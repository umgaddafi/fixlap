<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\ClientProfile;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Message;
use App\Models\MessageThread;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Referral;
use App\Models\Repair;
use App\Models\RepairNote;
use App\Models\RepairTimelineEvent;
use App\Models\TechnicianProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Organization & HQ Branch
        $org = Organization::create([
            'name' => 'FixLab Technologies',
            'code' => 'FIXLAB',
            'email' => 'support@fixlab.com',
            'phone' => '+234 800 349 5227',
            'currency' => 'NGN',
            'currency_symbol' => '₦',
            'address' => 'Plot 12, Commercial Avenue, Ikeja, Lagos, Nigeria',
            'is_active' => true,
        ]);

        $branch = Branch::create([
            'organization_id' => $org->id,
            'name' => 'FixLab Ikeja Hub (HQ)',
            'code' => 'HQ-IKJ',
            'city' => 'Lagos',
            'address' => 'Plot 12, Commercial Avenue, Ikeja',
            'phone' => '+234 800 349 5227',
            'is_active' => true,
        ]);

        // 2. Core Staff & Clients
        $admin = User::create([
            'name' => 'Alex Doe',
            'email' => 'admin@fixlab.com',
            'phone' => '080 9999 1111',
            'role' => 'admin',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);

        $jordan = User::create([
            'name' => 'Jordan Malik',
            'email' => 'repairer@fixlab.com',
            'phone' => '080 8888 2222',
            'role' => 'repairer',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        TechnicianProfile::create([
            'user_id' => $jordan->id,
            'specialty' => 'Phones & tablets',
            'is_available' => true,
            'active_job_count' => 4,
            'rating' => 4.95,
        ]);

        $tomi = User::create([
            'name' => 'Tomi Adeyemi',
            'email' => 'tomi@example.com',
            'phone' => '080 7777 3333',
            'role' => 'repairer',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        TechnicianProfile::create([
            'user_id' => $tomi->id,
            'specialty' => 'Laptops & diagnostics',
            'is_available' => true,
            'active_job_count' => 3,
            'rating' => 4.88,
        ]);

        $ada = User::create([
            'name' => 'Ada Eze',
            'email' => 'ada@example.com',
            'phone' => '080 6666 4444',
            'role' => 'repairer',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        TechnicianProfile::create([
            'user_id' => $ada->id,
            'specialty' => 'Board repairs',
            'is_available' => false,
            'active_job_count' => 0,
            'rating' => 4.90,
        ]);

        // Demo Client: Sarah Johnson
        $sarah = User::create([
            'name' => 'Sarah Johnson',
            'email' => 'client@fixlab.com',
            'phone' => '080 1234 5678',
            'role' => 'client',
            'branch_id' => $branch->id,
            'referral_code' => 'SARAH200',
            'password' => Hash::make('password'),
            'status' => 'active',
        ]);
        ClientProfile::create([
            'user_id' => $sarah->id,
            'address' => '14 Admiralty Way, Lekki Phase 1',
            'city' => 'Lagos',
            'state' => 'Lagos',
            'preferred_contact_method' => 'whatsapp',
            'notify_sms' => true,
            'notify_email' => true,
            'notify_whatsapp' => true,
        ]);

        // Other customer records
        $amaka = User::create([
            'name' => 'Amaka Okafor',
            'email' => 'amaka@example.com',
            'phone' => '080 2345 6789',
            'role' => 'client',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
        ]);
        $david = User::create([
            'name' => 'David Mensah',
            'email' => 'david@example.com',
            'phone' => '080 3456 7890',
            'role' => 'client',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
        ]);
        $zainab = User::create([
            'name' => 'Zainab Bello',
            'email' => 'zainab@example.com',
            'phone' => '080 4567 8901',
            'role' => 'client',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
        ]);
        $emeka = User::create([
            'name' => 'Emeka Nwosu',
            'email' => 'emeka@example.com',
            'phone' => '080 5678 9012',
            'role' => 'client',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
        ]);
        $kemi = User::create([
            'name' => 'Kemi Adebayo',
            'email' => 'kemi@example.com',
            'phone' => '080 6789 0123',
            'role' => 'client',
            'branch_id' => $branch->id,
            'password' => Hash::make('password'),
        ]);

        // 3. Inventory Categories & Items
        $catScreens = InventoryCategory::create(['name' => 'Screens', 'slug' => 'screens', 'description' => 'OEM displays & digitizers']);
        $catCharging = InventoryCategory::create(['name' => 'Charging', 'slug' => 'charging', 'description' => 'Ports, cables & power ICs']);
        $catBatteries = InventoryCategory::create(['name' => 'Batteries', 'slug' => 'batteries', 'description' => 'Original high-cycle batteries']);
        $catKeyboards = InventoryCategory::create(['name' => 'Keyboards', 'slug' => 'keyboards', 'description' => 'Laptop keyboards & top cases']);
        $catStorage = InventoryCategory::create(['name' => 'Storage', 'slug' => 'storage', 'description' => 'NVMe SSDs and memory chips']);

        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catScreens->id,
            'name' => 'iPhone 13 Pro display',
            'sku' => 'SCR-IP13P',
            'stock_quantity' => 4,
            'minimum_reorder_level' => 3,
            'cost_price' => 24000,
            'price' => 32000,
        ]);
        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catCharging->id,
            'name' => 'Samsung S23 USB-C port',
            'sku' => 'CHG-S23',
            'stock_quantity' => 0,
            'minimum_reorder_level' => 3,
            'cost_price' => 8000,
            'price' => 12000,
        ]);
        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catBatteries->id,
            'name' => 'MacBook Air M2 battery',
            'sku' => 'BAT-MBA2',
            'stock_quantity' => 2,
            'minimum_reorder_level' => 4,
            'cost_price' => 42000,
            'price' => 56000,
        ]);
        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catBatteries->id,
            'name' => 'iPhone 12 battery',
            'sku' => 'BAT-IP12',
            'stock_quantity' => 8,
            'minimum_reorder_level' => 3,
            'cost_price' => 10000,
            'price' => 15000,
        ]);
        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catKeyboards->id,
            'name' => 'Dell XPS 13 keyboard',
            'sku' => 'KEY-XPS13',
            'stock_quantity' => 5,
            'minimum_reorder_level' => 2,
            'cost_price' => 16000,
            'price' => 22000,
        ]);
        InventoryItem::create([
            'branch_id' => $branch->id,
            'category_id' => $catStorage->id,
            'name' => '1 TB NVMe SSD',
            'sku' => 'SSD-1TB',
            'stock_quantity' => 6,
            'minimum_reorder_level' => 3,
            'cost_price' => 38000,
            'price' => 48000,
        ]);

        // 4. Seed Repairs (Matching FL-1048 to FL-1039)
        $today = Carbon::today();

        $repairsData = [
            [
                'tracking_number' => 'FL-1048',
                'customer' => $amaka,
                'technician' => $jordan,
                'device' => 'iPhone 13 Pro',
                'category' => 'Phone',
                'issue' => 'Cracked screen after drop. Replace OLED display and test touch digitizer.',
                'status' => 'In progress',
                'priority' => 'High',
                'stage_index' => 4,
                'due_date' => $today->toDateString(),
                'time' => '10:30',
                'estimate' => 45000,
                'paid' => false,
                'dropoff' => $today->copy()->subDays(1),
                'notes' => 'Display received from storage bin SCR-IP13P. Installing and checking TrueTone sensor.',
            ],
            [
                'tracking_number' => 'FL-1047',
                'customer' => $david,
                'technician' => $tomi,
                'device' => 'MacBook Air M2',
                'category' => 'Laptop',
                'issue' => 'Battery health degraded (62%). Battery replacement and thermal check.',
                'status' => 'Ready for pickup',
                'stage_index' => 5,
                'priority' => 'Normal',
                'due_date' => $today->toDateString(),
                'time' => '12:00',
                'estimate' => 85000,
                'paid' => true,
                'dropoff' => $today->copy()->subDays(2),
                'notes' => 'OEM cell fitted. Battery health restored to 100%. Device passed 24hr burn-in.',
            ],
            [
                'tracking_number' => 'FL-1046',
                'customer' => $zainab,
                'technician' => $jordan,
                'device' => 'Samsung Galaxy S23',
                'category' => 'Phone',
                'issue' => 'Loose charging port. Fast charging failing intermittently.',
                'status' => 'Awaiting parts',
                'priority' => 'Urgent',
                'stage_index' => 2,
                'due_date' => $today->copy()->subDay()->toDateString(),
                'time' => '14:00',
                'estimate' => 28000,
                'paid' => false,
                'dropoff' => $today->copy()->subDays(3),
                'notes' => 'USB-C flex assembly on order from supplier. Expected arrival tomorrow morning.',
            ],
            [
                'tracking_number' => 'FL-1045',
                'customer' => $emeka,
                'technician' => $jordan,
                'device' => 'iPad Pro 11-inch',
                'category' => 'Tablet',
                'issue' => 'Display flickers after a drop. Run diagnostic checks.',
                'status' => 'New',
                'priority' => 'Normal',
                'stage_index' => 0,
                'due_date' => $today->toDateString(),
                'time' => '15:30',
                'estimate' => 60000,
                'paid' => false,
                'dropoff' => $today,
                'notes' => 'Intake logged. Assigned to bench 2 for disassembly and display line check.',
            ],
            [
                'tracking_number' => 'FL-1044',
                'customer' => $sarah,
                'technician' => $tomi,
                'device' => 'Dell XPS 13',
                'category' => 'Laptop',
                'issue' => 'Keyboard replacement; several keys are unresponsive.',
                'status' => 'In progress',
                'priority' => 'Normal',
                'stage_index' => 4,
                'due_date' => $today->copy()->addDay()->toDateString(),
                'time' => '11:00',
                'estimate' => 38000,
                'paid' => false,
                'dropoff' => $today->copy()->subDays(1),
                'notes' => 'Top cover removed. Fitting brand new backlit OEM UK layout keyboard.',
            ],
            [
                'tracking_number' => 'FL-1043',
                'customer' => $kemi,
                'technician' => $jordan,
                'device' => 'iPhone 12',
                'category' => 'Phone',
                'issue' => 'Replace battery and complete final quality checks.',
                'status' => 'Ready for pickup',
                'priority' => 'Normal',
                'stage_index' => 5,
                'due_date' => $today->toDateString(),
                'time' => '16:00',
                'estimate' => 32000,
                'paid' => true,
                'dropoff' => $today->copy()->subDays(2),
                'notes' => 'Battery replacement complete. Adhesive seals applied and waterproof test passed.',
            ],
            [
                'tracking_number' => 'FL-1042',
                'customer' => $david,
                'technician' => null,
                'device' => 'HP Pavilion 15',
                'category' => 'Laptop',
                'issue' => 'Device will not power on. Assess mainboard power rails.',
                'status' => 'New',
                'priority' => 'High',
                'stage_index' => 0,
                'due_date' => $today->copy()->addDays(2)->toDateString(),
                'time' => '09:00',
                'estimate' => 0,
                'paid' => false,
                'dropoff' => $today,
                'notes' => 'Awaiting technician assignment for board inspection.',
            ],
            [
                'tracking_number' => 'FL-1041',
                'customer' => $sarah,
                'technician' => $jordan,
                'device' => 'iPhone 11',
                'category' => 'Phone',
                'issue' => 'Ear speaker replacement completed; device collected.',
                'status' => 'Completed',
                'priority' => 'Normal',
                'stage_index' => 5,
                'due_date' => $today->copy()->subDays(2)->toDateString(),
                'time' => '13:00',
                'estimate' => 18000,
                'paid' => true,
                'dropoff' => $today->copy()->subDays(4),
                'completed_at' => $today->copy()->subDays(2),
                'notes' => 'Repaired, tested, and collected by client Sarah Johnson.',
            ],
            [
                'tracking_number' => 'FL-1040',
                'customer' => $amaka,
                'technician' => $tomi,
                'device' => 'Lenovo ThinkPad',
                'category' => 'Laptop',
                'issue' => 'SSD upgrade and operating system setup completed.',
                'status' => 'Completed',
                'priority' => 'Normal',
                'stage_index' => 5,
                'due_date' => $today->copy()->subDays(3)->toDateString(),
                'time' => '10:00',
                'estimate' => 52000,
                'paid' => true,
                'dropoff' => $today->copy()->subDays(5),
                'completed_at' => $today->copy()->subDays(3),
                'notes' => '1TB NVMe drive installed with Windows 11 Pro.',
            ],
            [
                'tracking_number' => 'FL-1039',
                'customer' => $sarah,
                'technician' => $jordan,
                'device' => 'MacBook Air M1',
                'category' => 'Laptop',
                'issue' => 'OEM battery replacement & precision thermal re-paste.',
                'status' => 'Ready for pickup',
                'priority' => 'Normal',
                'stage_index' => 5,
                'due_date' => $today->toDateString(),
                'time' => '11:30',
                'estimate' => 45000,
                'paid' => true,
                'dropoff' => $today->copy()->subDays(2),
                'notes' => 'Thermal paste replaced with Arctic MX-4. OEM battery cycle count 0. 90-day warranty issued.',
            ],
        ];

        foreach ($repairsData as $data) {
            $repair = Repair::create([
                'tracking_number' => $data['tracking_number'],
                'branch_id' => $branch->id,
                'client_id' => $data['customer']->id,
                'technician_id' => $data['technician']?->id,
                'customer_name' => $data['customer']->name,
                'customer_email' => $data['customer']->email,
                'customer_phone' => $data['customer']->phone ?? '080 0000 0000',
                'device_category' => $data['category'],
                'device_name' => $data['device'],
                'reported_issue' => $data['issue'],
                'status' => $data['status'],
                'priority' => $data['priority'],
                'stage_index' => $data['stage_index'],
                'due_date' => $data['due_date'],
                'appointment_time' => $data['time'],
                'estimate_amount' => $data['estimate'],
                'final_amount' => $data['estimate'],
                'is_paid' => $data['paid'],
                'dropoff_date' => $data['dropoff'],
                'completed_at' => $data['completed_at'] ?? null,
            ]);

            // Initial Timeline Event
            RepairTimelineEvent::create([
                'repair_id' => $repair->id,
                'user_id' => $data['technician']?->id ?? $admin->id,
                'from_status' => null,
                'to_status' => $data['status'],
                'event_description' => "Work order {$repair->tracking_number} entered {$data['status']} state.",
                'created_at' => $data['dropoff'],
            ]);

            // Note
            RepairNote::create([
                'repair_id' => $repair->id,
                'user_id' => $data['technician']?->id ?? $admin->id,
                'author_name' => $data['technician']?->name ?? 'Workshop Desk',
                'text' => $data['notes'],
                'is_internal' => false,
                'created_at' => $data['dropoff'],
            ]);

            // Generate Invoices for key repairs
            if ($data['estimate'] > 0) {
                $subtotal = round($data['estimate'] * 0.78, 2);
                $labour = round($data['estimate'] * 0.22, 2);
                $inv = Invoice::create([
                    'invoice_number' => "INV-{$repair->tracking_number}-2026",
                    'repair_id' => $repair->id,
                    'client_id' => $data['customer']->id,
                    'subtotal' => $data['estimate'],
                    'total_amount' => $data['estimate'],
                    'status' => $data['paid'] ? 'Paid' : 'Pending',
                    'due_date' => $data['due_date'],
                    'paid_at' => $data['paid'] ? $data['dropoff'] : null,
                ]);

                InvoiceItem::create([
                    'invoice_id' => $inv->id,
                    'description' => "{$repair->device_name} OEM Replacement Component",
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'total_amount' => $subtotal,
                ]);
                InvoiceItem::create([
                    'invoice_id' => $inv->id,
                    'description' => 'Precision diagnostic testing & workmanship labour',
                    'quantity' => 1,
                    'unit_price' => $labour,
                    'total_amount' => $labour,
                ]);

                if ($data['paid']) {
                    Payment::create([
                        'reference' => 'PAY-' . strtoupper(substr(md5($repair->tracking_number), 0, 10)),
                        'invoice_id' => $inv->id,
                        'repair_id' => $repair->id,
                        'client_id' => $data['customer']->id,
                        'amount' => $data['estimate'],
                        'payment_method' => 'paystack',
                        'status' => 'success',
                        'gateway_response' => ['status' => 'success', 'gateway' => 'paystack'],
                        'paid_at' => $data['dropoff'],
                    ]);
                }
            }
        }

        // 5. Referrals for Sarah Johnson
        Referral::create([
            'referrer_id' => $sarah->id,
            'referee_id' => $david->id,
            'referral_code' => 'SARAH200',
            'status' => 'converted',
            'reward_amount' => 2500,
            'converted_at' => Carbon::now()->subDays(5),
        ]);
        Referral::create([
            'referrer_id' => $sarah->id,
            'referee_id' => $kemi->id,
            'referral_code' => 'SARAH200',
            'status' => 'converted',
            'reward_amount' => 2500,
            'converted_at' => Carbon::now()->subDays(1),
        ]);

        // 6. Message Thread between Sarah and Technician Jordan
        $thread = MessageThread::create([
            'repair_id' => Repair::where('tracking_number', 'FL-1044')->first()?->id,
            'client_id' => $sarah->id,
            'technician_id' => $jordan->id,
            'title' => 'Dell XPS 13 Keyboard Service (FL-1044)',
            'subtitle' => 'Technician Jordan Malik',
            'last_message_at' => Carbon::now()->subHours(2),
        ]);

        Message::create([
            'thread_id' => $thread->id,
            'sender_id' => $jordan->id,
            'from_role' => 'staff',
            'author_name' => 'Jordan Malik',
            'text' => 'Hello Sarah, we opened your Dell XPS 13 and verified that the spacebar mechanism was physically detached. We have the exact OEM keyboard assembly in stock and are installing it now.',
            'is_read' => true,
            'created_at' => Carbon::now()->subHours(3),
        ]);
        Message::create([
            'thread_id' => $thread->id,
            'sender_id' => $sarah->id,
            'from_role' => 'client',
            'author_name' => 'Sarah Johnson',
            'text' => 'Thank you Jordan! Please let me know once it is ready for collection.',
            'is_read' => true,
            'created_at' => Carbon::now()->subHours(2),
        ]);
    }
}
