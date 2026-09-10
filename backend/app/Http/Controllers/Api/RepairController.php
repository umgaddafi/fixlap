<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\JobAssignedMail;
use App\Mail\NewRepairAdminAlertMail;
use App\Mail\RepairCompletedMail;
use App\Mail\RepairSubmittedMail;
use App\Mail\TechnicianStandbyMail;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Repair;
use App\Models\RepairNote;
use App\Models\RepairTimelineEvent;
use App\Models\User;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RepairController extends Controller
{
    private array $stages = [
        'New' => 0,
        'Assigned repairer' => 1,
        'Repairer acknowledged' => 2,
        'Awaiting parts' => 2,
        'Paid' => 3,
        'In progress' => 4,
        'Ready for pickup' => 5,
        'Completed' => 5,
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Repair::with(['notes' => fn ($q) => $q->orderBy('created_at', 'desc'), 'technician']);

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'All') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('device_name', 'like', "%{$search}%")
                    ->orWhere('reported_issue', 'like', "%{$search}%");
            });
        }

        $repairs = $query->orderBy('due_date', 'asc')->orderBy('id', 'desc')->get();

        // Transform into the exact frontend Job type
        $formatted = $repairs->map(function ($r) {
            return [
                'id' => $r->tracking_number,
                'dbId' => $r->id,
                'customer' => $r->customer_name,
                'email' => $r->customer_email,
                'phone' => $r->customer_phone,
                'device' => $r->device_name,
                'category' => $r->device_category,
                'issue' => $r->reported_issue,
                'status' => $r->status,
                'priority' => $r->priority,
                'technicianId' => $r->technician_id ? "tech-{$r->technician_id}" : '',
                'technicianName' => $r->technician?->name ?? 'Unassigned',
                'dueDate' => $r->due_date ? Carbon::parse($r->due_date)->format('Y-m-d') : Carbon::today()->format('Y-m-d'),
                'time' => $r->appointment_time ?? '10:00',
                'estimate' => (float) $r->estimate_amount,
                'isPaid' => (bool) $r->is_paid,
                'stageIndex' => $r->stage_index,
                'createdAt' => $r->created_at->toISOString(),
                'notes' => $r->notes->map(fn ($n) => [
                    'id' => (string) $n->id,
                    'text' => $n->text,
                    'author' => $n->author_name,
                    'createdAt' => $n->created_at->toISOString(),
                ]),
            ];
        });

        return response()->json($formatted);
    }

    public function show(string $id): JsonResponse
    {
        $repair = Repair::where('tracking_number', $id)
            ->orWhere('id', $id)
            ->with(['notes', 'timelineEvents', 'invoice.items', 'technician'])
            ->firstOrFail();

        return response()->json($repair);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer' => 'required|string|max:191',
            'email' => 'required|email|max:191',
            'phone' => 'required|string|max:50',
            'device' => 'required|string|max:191',
            'category' => 'required|string|in:Phone,Laptop,Tablet,Other,Smartwatch',
            'issue' => 'required|string',
            'priority' => 'required|string|in:Normal,High,Urgent',
            'dueDate' => 'required|date',
            'time' => 'nullable|string',
            'estimate' => 'nullable|numeric|min:0',
            'technicianId' => 'nullable|string',
        ]);

        // Find or create customer account
        $client = User::where('email', $request->email)->first();
        if (! $client) {
            $client = User::create([
                'name' => $request->customer,
                'email' => $request->email,
                'phone' => $request->phone,
                'role' => 'client',
                'password' => bcrypt('password'),
            ]);
        }

        // Generate next tracking number FL-XXXX
        $lastRepair = Repair::orderBy('id', 'desc')->first();
        $nextNum = $lastRepair ? ($lastRepair->id + 1040) : 1049;
        $trackingNumber = "FL-{$nextNum}";

        // Resolve technician
        $techId = null;
        if ($request->filled('technicianId')) {
            $cleanId = str_replace('tech-', '', $request->technicianId);
            $techUser = User::where('id', $cleanId)->orWhere('role', 'repairer')->first();
            $techId = $techUser?->id;
        }

        $status = $techId ? 'In progress' : 'New';
        $stageIndex = $this->stages[$status] ?? 0;

        $repair = Repair::create([
            'tracking_number' => $trackingNumber,
            'client_id' => $client->id,
            'technician_id' => $techId,
            'customer_name' => $request->customer,
            'customer_email' => $request->email,
            'customer_phone' => $request->phone,
            'device_category' => $request->category,
            'device_name' => $request->device,
            'reported_issue' => $request->issue,
            'status' => $status,
            'priority' => $request->priority,
            'stage_index' => $stageIndex,
            'due_date' => $request->dueDate,
            'appointment_time' => $request->time ?? '10:00',
            'estimate_amount' => $request->estimate ?? 0,
            'final_amount' => $request->estimate ?? 0,
            'dropoff_date' => now(),
        ]);

        // Timeline event
        RepairTimelineEvent::create([
            'repair_id' => $repair->id,
            'user_id' => auth()->id(),
            'from_status' => null,
            'to_status' => $status,
            'event_description' => "Work order {$trackingNumber} intake registered.",
        ]);

        // Generate invoice if estimate > 0
        if ($repair->estimate_amount > 0) {
            $inv = Invoice::create([
                'invoice_number' => "INV-{$repair->tracking_number}-2026",
                'repair_id' => $repair->id,
                'client_id' => $client->id,
                'subtotal' => $repair->estimate_amount,
                'total_amount' => $repair->estimate_amount,
                'status' => 'Pending',
                'due_date' => $repair->due_date,
            ]);

            InvoiceItem::create([
                'invoice_id' => $inv->id,
                'description' => "{$repair->device_name} OEM Replacement Component",
                'quantity' => 1,
                'unit_price' => round($repair->estimate_amount * 0.78, 2),
                'total_amount' => round($repair->estimate_amount * 0.78, 2),
            ]);
            InvoiceItem::create([
                'invoice_id' => $inv->id,
                'description' => 'Precision technician diagnostic bench testing & workmanship labour',
                'quantity' => 1,
                'unit_price' => round($repair->estimate_amount * 0.22, 2),
                'total_amount' => round($repair->estimate_amount * 0.22, 2),
            ]);
        }

        // Send SMS Notification with reference tracking number
        try {
            SmsService::sendRepairSubmitted($repair);
        } catch (\Throwable $e) {
            Log::error('RepairController SMS dispatch error: ' . $e->getMessage());
        }

        // Send Email Confirmation
        try {
            if (! empty($repair->customer_email)) {
                Mail::to($repair->customer_email)->send(new RepairSubmittedMail($repair));
            }
        } catch (\Throwable $e) {
            Log::error('RepairController Email dispatch error: ' . $e->getMessage());
        }

        // Send Email Notification to assigned technician or standby technicians
        if ($repair->technician_id) {
            try {
                $assignedTech = $repair->technician ?? User::find($repair->technician_id);
                if ($assignedTech && ! empty($assignedTech->email)) {
                    Mail::to($assignedTech->email)->send(new JobAssignedMail($repair, $assignedTech));
                }
            } catch (\Throwable $e) {
                Log::error('RepairController Technician assignment Email dispatch error: ' . $e->getMessage());
            }
        } else {
            // New unassigned repair: Alert admin and all technicians to be on standby
            try {
                $admins = User::where('role', 'admin')->whereNotNull('email')->get();
                foreach ($admins as $adminUser) {
                    Mail::to($adminUser->email)->send(new NewRepairAdminAlertMail($repair, $adminUser));
                }
            } catch (\Throwable $e) {
                Log::error('RepairController Admin Email dispatch error: ' . $e->getMessage());
            }

            try {
                $technicians = User::where('role', 'repairer')->whereNotNull('email')->get();
                foreach ($technicians as $techUser) {
                    Mail::to($techUser->email)->send(new TechnicianStandbyMail($repair, $techUser));
                }
            } catch (\Throwable $e) {
                Log::error('RepairController Technicians Standby Email dispatch error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Repair created successfully.',
            'repair' => $repair,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $repair = Repair::where('tracking_number', $id)->orWhere('id', $id)->firstOrFail();

        $prevStatus = $repair->status;
        $prevTechId = $repair->technician_id;

        if ($request->has('status')) {
            $repair->status = $request->status;
            $repair->stage_index = $this->stages[$request->status] ?? $repair->stage_index;
            if ($request->status === 'Completed' && ! $repair->completed_at) {
                $repair->completed_at = now();
            }
        }

        if ($request->has('priority')) {
            $repair->priority = $request->priority;
        }

        if ($request->has('dueDate')) {
            $repair->due_date = $request->dueDate;
        }

        if ($request->has('time')) {
            $repair->appointment_time = $request->time;
        }

        if ($request->has('estimate')) {
            $repair->estimate_amount = $request->estimate;
            $repair->final_amount = $request->estimate;
        }

        if ($request->has('technicianId')) {
            $cleanId = str_replace('tech-', '', (string) $request->technicianId);
            $techUser = ! empty($cleanId) ? User::where('id', $cleanId)->orWhere('name', $request->technicianId)->first() : null;
            $repair->technician_id = $techUser?->id;
        }

        $repair->save();

        // If technician was assigned or changed, send notification email to the technician
        if ($repair->technician_id && $repair->technician_id != $prevTechId) {
            try {
                $assignedTech = $repair->technician ?? User::find($repair->technician_id);
                if ($assignedTech && ! empty($assignedTech->email)) {
                    Mail::to($assignedTech->email)->send(new JobAssignedMail($repair, $assignedTech));
                }
            } catch (\Throwable $e) {
                Log::error('RepairController Technician assignment Email dispatch error: ' . $e->getMessage());
            }
        }

        // If status changed, record timeline
        if ($request->has('status') && $request->status !== $prevStatus) {
            RepairTimelineEvent::create([
                'repair_id' => $repair->id,
                'user_id' => auth()->id(),
                'from_status' => $prevStatus,
                'to_status' => $request->status,
                'event_description' => "Status updated from '{$prevStatus}' to '{$request->status}'.",
            ]);

            // When fix is complete, send congratulation message to client
            if (in_array($request->status, ['Ready for pickup', 'Completed'])) {
                try {
                    SmsService::sendRepairCompleted($repair);
                } catch (\Throwable $e) {
                    Log::error('RepairController completion SMS dispatch error: ' . $e->getMessage());
                }

                try {
                    if (! empty($repair->customer_email)) {
                        Mail::to($repair->customer_email)->send(new RepairCompletedMail($repair));
                    }
                } catch (\Throwable $e) {
                    Log::error('RepairController completion Email dispatch error: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Repair updated successfully.',
            'repair' => $repair,
        ]);
    }

    public function addNote(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'text' => 'required|string',
            'author' => 'nullable|string',
        ]);

        $repair = Repair::where('tracking_number', $id)->orWhere('id', $id)->firstOrFail();

        $note = RepairNote::create([
            'repair_id' => $repair->id,
            'user_id' => auth()->id(),
            'author_name' => $request->author ?? auth()->user()?->name ?? 'Technician',
            'text' => $request->text,
            'is_internal' => false,
        ]);

        return response()->json([
            'message' => 'Note added successfully.',
            'note' => $note,
        ]);
    }
}
