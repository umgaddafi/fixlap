<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewRepairAdminAlertMail;
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

class ClientRepairController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Query repairs matching client_id OR customer_email
        $repairs = Repair::where('client_id', $user->id)
            ->orWhere('customer_email', $user->email)
            ->with(['technician', 'notes' => fn ($q) => $q->orderBy('created_at', 'desc')])
            ->orderBy('id', 'desc')
            ->get();

        $formatted = $repairs->map(function ($r) {
            $latestNote = $r->notes->first();

            return [
                'id' => $r->tracking_number,
                'dbId' => $r->id,
                'device' => $r->device_name,
                'category' => $r->device_category,
                'issue' => $r->reported_issue,
                'status' => $r->status,
                'stageIndex' => $r->stage_index,
                'estimate' => (float) $r->estimate_amount,
                'paid' => (bool) $r->is_paid,
                'dueDate' => $r->due_date ? Carbon::parse($r->due_date)->format('d M Y') : 'Pending schedule',
                'dropoffDate' => $r->dropoff_date ? Carbon::parse($r->dropoff_date)->format('d F Y') : Carbon::today()->format('d F Y'),
                'technician' => $r->technician?->name ?? 'Workshop Queue',
                'notes' => $latestNote ? $latestNote->text : 'Device scheduled for diagnostic bench inspection.',
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'deviceType' => 'required|string',
            'model' => 'required|string',
            'issue' => 'required|string',
            'phone' => 'nullable|string',
            'dropoffDate' => 'required|date',
        ]);

        $user = $request->user();

        $lastRepair = Repair::orderBy('id', 'desc')->first();
        $nextNum = $lastRepair ? ($lastRepair->id + 1040) : 1049;
        $trackingNumber = "FL-{$nextNum}";

        // Calculate estimate based on category
        $estimates = [
            'Phone' => 35000,
            'Laptop' => 55000,
            'Tablet' => 42000,
            'Smartwatch' => 25000,
            'Other' => 30000,
        ];
        $est = $estimates[$request->deviceType] ?? 35000;

        $repair = Repair::create([
            'tracking_number' => $trackingNumber,
            'client_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => $request->phone ?? $user->phone ?? '080 0000 0000',
            'device_category' => $request->deviceType,
            'device_name' => $request->model,
            'reported_issue' => $request->issue,
            'status' => 'Submitted',
            'priority' => 'Normal',
            'stage_index' => 0,
            'due_date' => Carbon::parse($request->dropoffDate)->addDays(2),
            'appointment_time' => '10:00',
            'estimate_amount' => $est,
            'final_amount' => $est,
            'is_paid' => false,
            'dropoff_date' => $request->dropoffDate,
        ]);

        RepairTimelineEvent::create([
            'repair_id' => $repair->id,
            'user_id' => $user->id,
            'from_status' => null,
            'to_status' => 'Submitted',
            'event_description' => 'Online repair request submitted by client.',
        ]);

        RepairNote::create([
            'repair_id' => $repair->id,
            'user_id' => $user->id,
            'author_name' => $user->name,
            'text' => "Device submitted for inspection: {$request->issue}",
            'is_internal' => false,
        ]);

        // Generate Invoice
        $inv = Invoice::create([
            'invoice_number' => "INV-{$repair->tracking_number}-2026",
            'repair_id' => $repair->id,
            'client_id' => $user->id,
            'subtotal' => $est,
            'total_amount' => $est,
            'status' => 'Pending',
            'due_date' => $repair->due_date,
        ]);

        InvoiceItem::create([
            'invoice_id' => $inv->id,
            'description' => "{$repair->device_name} Diagnostic Bench Assessment & OEM Parts",
            'quantity' => 1,
            'unit_price' => round($est * 0.78, 2),
            'total_amount' => round($est * 0.78, 2),
        ]);
        InvoiceItem::create([
            'invoice_id' => $inv->id,
            'description' => 'Precision technician labour & quality control',
            'quantity' => 1,
            'unit_price' => round($est * 0.22, 2),
            'total_amount' => round($est * 0.22, 2),
        ]);

        // Send SMS Notification with reference tracking number
        try {
            SmsService::sendRepairSubmitted($repair);
        } catch (\Throwable $e) {
            Log::error('ClientRepairController SMS dispatch error: ' . $e->getMessage());
        }

        // Send Email Confirmation to customer
        try {
            if (! empty($repair->customer_email)) {
                Mail::to($repair->customer_email)->send(new RepairSubmittedMail($repair));
            }
        } catch (\Throwable $e) {
            Log::error('ClientRepairController Customer Email dispatch error: ' . $e->getMessage());
        }

        // Send New Repair Alert Email to Admin(s)
        try {
            $admins = User::where('role', 'admin')->whereNotNull('email')->get();
            foreach ($admins as $adminUser) {
                Mail::to($adminUser->email)->send(new NewRepairAdminAlertMail($repair, $adminUser));
            }
        } catch (\Throwable $e) {
            Log::error('ClientRepairController Admin Email dispatch error: ' . $e->getMessage());
        }

        // Send Standby Email Alert to all active workshop technicians
        try {
            $technicians = User::where('role', 'repairer')->whereNotNull('email')->get();
            foreach ($technicians as $techUser) {
                Mail::to($techUser->email)->send(new TechnicianStandbyMail($repair, $techUser));
            }
        } catch (\Throwable $e) {
            Log::error('ClientRepairController Technicians Standby Email dispatch error: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Repair request submitted successfully.',
            'repair' => [
                'id' => $repair->tracking_number,
                'dbId' => $repair->id,
                'device' => $repair->device_name,
                'category' => $repair->device_category,
                'issue' => $repair->reported_issue,
                'status' => $repair->status,
                'stageIndex' => $repair->stage_index,
                'estimate' => (float) $repair->estimate_amount,
                'paid' => false,
                'dueDate' => Carbon::parse($repair->due_date)->format('d M Y'),
                'dropoffDate' => Carbon::parse($repair->dropoff_date)->format('d F Y'),
                'technician' => 'Pending assignment',
                'notes' => 'Device scheduled for intake.',
            ],
        ], 201);
    }
}
