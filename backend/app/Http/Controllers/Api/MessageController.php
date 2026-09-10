<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ClientRepairMessageMail;
use App\Mail\TechnicianRepairMessageMail;
use App\Models\Message;
use App\Models\MessageThread;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MessageController extends Controller
{
    public function threads(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MessageThread::with([
            'messages' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'repair',
            'client',
            'technician',
        ]);

        if ($user->role === 'client') {
            $query->where(function ($q) use ($user) {
                $q->where('client_id', $user->id)
                  ->orWhereHas('repair', fn ($rq) => $rq->where('customer_email', $user->email));
            });
        } elseif ($user->role === 'repairer') {
            $query->where(function ($q) use ($user) {
                $q->where('technician_id', $user->id)
                  ->orWhereNull('technician_id')
                  ->orWhereHas('repair', fn ($rq) => $rq->where('technician_id', $user->id));
            });
        }
        // Admin has no filter — admin sees all threads

        $threads = $query->orderBy('last_message_at', 'desc')->get();

        $formatted = $threads->map(function ($thread) use ($user) {
            $unreadCount = $thread->messages->where('is_read', false)->filter(function ($m) use ($user) {
                if ($user->role === 'client') {
                    return $m->from_role === 'staff';
                }
                return $m->from_role === 'client';
            })->count();

            return [
                'id' => (string) $thread->id,
                'repairId' => $thread->repair_id ? (string) $thread->repair_id : null,
                'trackingNumber' => $thread->repair?->tracking_number,
                'title' => $thread->title,
                'subtitle' => $thread->subtitle ?? 'FixLab Workshop',
                'avatar' => $thread->technician ? strtoupper(substr($thread->technician->name, 0, 2)) : 'FL',
                'unread' => $unreadCount > 0,
                'unreadCount' => $unreadCount,
                'messages' => $thread->messages->map(fn ($m) => [
                    'id' => (string) $m->id,
                    'from' => $m->from_role,
                    'author' => $m->author_name,
                    'text' => $m->text,
                    'time' => $m->created_at->format('h:i A'),
                    'createdAt' => $m->created_at->toISOString(),
                ]),
            ];
        });

        return response()->json($formatted);
    }

    public function repairChat(Request $request, string $repairId): JsonResponse
    {
        $user = $request->user();
        $repair = $this->resolveRepair($repairId);

        // Find or create thread for this repair
        $thread = MessageThread::where('repair_id', $repair->id)->first();

        if (!$thread) {
            $clientId = $repair->client_id;
            if (!$clientId) {
                $clientUser = User::where('email', $repair->customer_email)->first();
                $clientId = $clientUser?->id ?? ($user->role === 'client' ? $user->id : User::where('role', 'client')->first()?->id);
            }

            $thread = MessageThread::create([
                'repair_id' => $repair->id,
                'client_id' => $clientId ?? $user->id,
                'technician_id' => $repair->technician_id,
                'title' => "#{$repair->tracking_number} - {$repair->device_name}",
                'subtitle' => "Customer: {$repair->customer_name}",
                'last_message_at' => now(),
            ]);
        } elseif ($repair->technician_id && $thread->technician_id !== $repair->technician_id) {
            $thread->technician_id = $repair->technician_id;
            $thread->save();
        }

        $thread->load([
            'messages' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'technician',
            'client',
            'repair',
        ]);

        return response()->json([
            'id' => (string) $thread->id,
            'repairId' => (string) $repair->id,
            'trackingNumber' => $repair->tracking_number,
            'deviceName' => $repair->device_name,
            'deviceCategory' => $repair->device_category,
            'customerName' => $repair->customer_name,
            'customerEmail' => $repair->customer_email,
            'customerPhone' => $repair->customer_phone,
            'status' => $repair->status,
            'technicianName' => $repair->technician?->name ?? 'Unassigned',
            'messages' => $thread->messages->map(fn ($m) => [
                'id' => (string) $m->id,
                'from' => $m->from_role,
                'author' => $m->author_name,
                'text' => $m->text,
                'time' => $m->created_at->format('h:i A'),
                'createdAt' => $m->created_at->toISOString(),
            ]),
        ]);
    }

    public function sendRepairMessage(Request $request, string $repairId): JsonResponse
    {
        $request->validate([
            'text' => 'required|string|max:3000',
        ]);

        $user = $request->user();
        $repair = $this->resolveRepair($repairId);

        // Find or create thread
        $thread = MessageThread::firstOrCreate(
            ['repair_id' => $repair->id],
            [
                'client_id' => $repair->client_id ?? ($user->role === 'client' ? $user->id : (User::where('email', $repair->customer_email)->value('id') ?? $user->id)),
                'technician_id' => $repair->technician_id,
                'title' => "#{$repair->tracking_number} - {$repair->device_name}",
                'subtitle' => "Customer: {$repair->customer_name}",
                'last_message_at' => now(),
            ]
        );

        $fromRole = in_array($user->role, ['admin', 'repairer']) ? 'staff' : 'client';

        $message = Message::create([
            'thread_id' => $thread->id,
            'sender_id' => $user->id,
            'from_role' => $fromRole,
            'author_name' => $user->name,
            'text' => $request->text,
            'is_read' => false,
        ]);

        $thread->last_message_at = now();
        $thread->save();

        // Dispatch email notifications
        if ($fromRole === 'staff') {
            // Staff/Technician sent message -> alert client
            $targetEmail = $repair->customer_email ?? $repair->client?->email;
            if (!empty($targetEmail)) {
                try {
                    Mail::to($targetEmail)->send(new ClientRepairMessageMail($repair, $message, $user));
                } catch (\Throwable $e) {
                    Log::error("Failed to send ClientRepairMessageMail: {$e->getMessage()}");
                }
            }
        } else {
            // Client sent reply -> alert assigned technician
            if ($repair->technician && !empty($repair->technician->email)) {
                try {
                    Mail::to($repair->technician->email)->send(new TechnicianRepairMessageMail($repair, $message, $repair->technician));
                } catch (\Throwable $e) {
                    Log::error("Failed to send TechnicianRepairMessageMail: {$e->getMessage()}");
                }
            }
        }

        return response()->json([
            'id' => (string) $message->id,
            'threadId' => (string) $thread->id,
            'from' => $message->from_role,
            'author' => $message->author_name,
            'text' => $message->text,
            'time' => $message->created_at->format('h:i A'),
            'createdAt' => $message->created_at->toISOString(),
        ], 201);
    }

    public function sendMessage(Request $request, string $threadId): JsonResponse
    {
        $request->validate([
            'text' => 'required|string',
        ]);

        $thread = MessageThread::with(['repair', 'technician', 'client'])->findOrFail($threadId);
        $user = $request->user();
        $fromRole = in_array($user->role, ['admin', 'repairer']) ? 'staff' : 'client';

        $message = Message::create([
            'thread_id' => $thread->id,
            'sender_id' => $user->id,
            'from_role' => $fromRole,
            'author_name' => $user->name,
            'text' => $request->text,
            'is_read' => false,
        ]);

        $thread->last_message_at = now();
        $thread->save();

        // If thread has repair attached, send alert emails as appropriate
        if ($thread->repair) {
            $repair = $thread->repair;
            if ($fromRole === 'staff') {
                $targetEmail = $repair->customer_email ?? $thread->client?->email;
                if (!empty($targetEmail)) {
                    try {
                        Mail::to($targetEmail)->send(new ClientRepairMessageMail($repair, $message, $user));
                    } catch (\Throwable $e) {
                        Log::error("Failed to send ClientRepairMessageMail: {$e->getMessage()}");
                    }
                }
            } else {
                $tech = $repair->technician ?? $thread->technician;
                if ($tech && !empty($tech->email)) {
                    try {
                        Mail::to($tech->email)->send(new TechnicianRepairMessageMail($repair, $message, $tech));
                    } catch (\Throwable $e) {
                        Log::error("Failed to send TechnicianRepairMessageMail: {$e->getMessage()}");
                    }
                }
            }
        }

        return response()->json([
            'id' => (string) $message->id,
            'from' => $message->from_role,
            'author' => $message->author_name,
            'text' => $message->text,
            'time' => $message->created_at->format('h:i A'),
            'createdAt' => $message->created_at->toISOString(),
        ], 201);
    }

    public function markRead(string $threadId): JsonResponse
    {
        $thread = MessageThread::findOrFail($threadId);
        $thread->messages()->where('is_read', false)->update(['is_read' => true]);

        return response()->json(['message' => 'Messages marked as read.']);
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();

        $unreadQuery = Message::with(['thread.repair'])
            ->where('is_read', false);

        if ($user->role === 'client') {
            $unreadQuery->where('from_role', 'staff')
                ->whereHas('thread', function ($tq) use ($user) {
                    $tq->where('client_id', $user->id)
                       ->orWhereHas('repair', fn ($rq) => $rq->where('customer_email', $user->email));
                });
        } elseif ($user->role === 'repairer') {
            $unreadQuery->where('from_role', 'client')
                ->whereHas('thread', function ($tq) use ($user) {
                    $tq->where('technician_id', $user->id)
                       ->orWhereHas('repair', fn ($rq) => $rq->where('technician_id', $user->id));
                });
        } else {
            // Admin receives notification of all incoming client replies
            $unreadQuery->where('from_role', 'client');
        }

        $unreadMessages = $unreadQuery->orderBy('created_at', 'desc')->take(20)->get();

        $items = $unreadMessages->map(function ($msg) {
            $repair = $msg->thread?->repair;
            return [
                'id' => (string) $msg->id,
                'threadId' => (string) $msg->thread_id,
                'repairId' => $repair ? (string) $repair->id : null,
                'trackingNumber' => $repair?->tracking_number,
                'title' => $repair ? "#{$repair->tracking_number} - {$repair->device_name}" : ($msg->thread?->title ?? 'New Message'),
                'author' => $msg->author_name,
                'text' => $msg->text,
                'time' => $msg->created_at->diffForHumans(),
                'createdAt' => $msg->created_at->toISOString(),
            ];
        });

        return response()->json([
            'unreadCount' => $unreadMessages->count(),
            'items' => $items,
        ]);
    }

    private function resolveRepair(string $repairId): Repair
    {
        $clean = str_replace('FL-', '', $repairId);

        if (is_numeric($repairId)) {
            $repair = Repair::find($repairId);
            if ($repair) return $repair;
        }

        $repair = Repair::where('tracking_number', $repairId)
            ->orWhere('tracking_number', "FL-{$clean}")
            ->orWhere('id', $clean)
            ->first();

        if ($repair) return $repair;

        abort(404, "Repair order [{$repairId}] not found.");
    }
}
