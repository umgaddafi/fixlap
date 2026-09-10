<?php

namespace Tests\Feature;

use App\Mail\ClientRepairMessageMail;
use App\Mail\TechnicianDailyUnfinishedRepairsMail;
use App\Mail\TechnicianRepairMessageMail;
use App\Models\Repair;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TechnicianReminderAndChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_reminders_command_sends_email_to_technicians_with_unfinished_repairs(): void
    {
        Mail::fake();

        $tech = User::create([
            'name' => 'Jordan Malik',
            'email' => 'tech1@fixlab.com',
            'phone' => '080 3456 7891',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        $otherTech = User::create([
            'name' => 'Tomi Ade',
            'email' => 'tech2@fixlab.com',
            'phone' => '080 9999 8888',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        // Unfinished repair 1 assigned to tech 1
        Repair::create([
            'tracking_number' => 'FL-8801',
            'technician_id' => $tech->id,
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '080 1111 2222',
            'device_name' => 'iPhone 14 Pro',
            'device_category' => 'Phone',
            'reported_issue' => 'Broken screen',
            'status' => 'In progress',
            'priority' => 'High',
            'due_date' => now()->addDay(),
        ]);

        // Unfinished repair 2 assigned to tech 1
        Repair::create([
            'tracking_number' => 'FL-8802',
            'technician_id' => $tech->id,
            'customer_name' => 'Jane Smith',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '080 3333 4444',
            'device_name' => 'MacBook Air M2',
            'device_category' => 'Laptop',
            'reported_issue' => 'Trackpad not clicking',
            'status' => 'Awaiting parts',
            'priority' => 'Normal',
            'due_date' => now()->addDays(2),
        ]);

        // Completed repair assigned to tech 2 (should not trigger reminder if no unfinished jobs)
        Repair::create([
            'tracking_number' => 'FL-8803',
            'technician_id' => $otherTech->id,
            'customer_name' => 'Bob Brown',
            'customer_email' => 'bob@example.com',
            'customer_phone' => '080 5555 6666',
            'device_name' => 'iPad Pro',
            'device_category' => 'Tablet',
            'reported_issue' => 'Battery replacement',
            'status' => 'Completed',
            'priority' => 'Normal',
            'due_date' => now()->subDay(),
        ]);

        $exitCode = Artisan::call('repairs:send-daily-reminders');
        $this->assertEquals(0, $exitCode);

        Mail::assertSent(TechnicianDailyUnfinishedRepairsMail::class, function ($mail) {
            return $mail->hasTo('tech1@fixlab.com')
                && $mail->repairs->count() === 2;
        });

        Mail::assertNotSent(TechnicianDailyUnfinishedRepairsMail::class, function ($mail) {
            return $mail->hasTo('tech2@fixlab.com');
        });
    }

    public function test_admin_can_manually_trigger_daily_reminders(): void
    {
        Mail::fake();

        $admin = User::create([
            'name' => 'Alex Doe',
            'email' => 'admin_test@fixlab.com',
            'phone' => '080 1234 5678',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        $tech = User::create([
            'name' => 'Jordan Malik',
            'email' => 'tech_test@fixlab.com',
            'phone' => '080 8765 4321',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        Repair::create([
            'tracking_number' => 'FL-8804',
            'technician_id' => $tech->id,
            'customer_name' => 'Alice White',
            'customer_email' => 'alice@example.com',
            'customer_phone' => '080 2222 3333',
            'device_name' => 'Pixel 7',
            'device_category' => 'Phone',
            'reported_issue' => 'Battery drain',
            'status' => 'In progress',
            'priority' => 'Normal',
            'due_date' => now()->addDay(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/technicians/send-daily-reminders');
        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'output']);

        Mail::assertSent(TechnicianDailyUnfinishedRepairsMail::class);
    }

    public function test_repair_specific_chat_messaging_and_notifications(): void
    {
        Mail::fake();

        $tech = User::create([
            'name' => 'Jordan Malik',
            'email' => 'tech_chat@fixlab.com',
            'phone' => '080 3456 7891',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        $client = User::create([
            'name' => 'Aisha Bello',
            'email' => 'client_chat@example.com',
            'phone' => '080 7777 8888',
            'role' => 'client',
            'password' => bcrypt('password'),
        ]);

        $repair = Repair::create([
            'tracking_number' => 'FL-9001',
            'client_id' => $client->id,
            'technician_id' => $tech->id,
            'customer_name' => 'Aisha Bello',
            'customer_email' => 'client_chat@example.com',
            'customer_phone' => '080 7777 8888',
            'device_name' => 'Dell XPS 15',
            'device_category' => 'Laptop',
            'reported_issue' => 'Motherboard issue',
            'status' => 'In progress',
            'priority' => 'High',
            'due_date' => now()->addDays(3),
        ]);

        // 1. Technician sends message to client
        Sanctum::actingAs($tech);

        $chatResponse = $this->postJson("/api/repairs/{$repair->id}/chat", [
            'text' => 'We have inspected the motherboard and ordered replacement mosfets.',
        ]);

        $chatResponse->assertStatus(201)
            ->assertJson([
                'from' => 'staff',
                'author' => 'Jordan Malik',
                'text' => 'We have inspected the motherboard and ordered replacement mosfets.',
            ]);

        // Email dispatched to client
        Mail::assertSent(ClientRepairMessageMail::class, function ($mail) {
            return $mail->hasTo('client_chat@example.com')
                && $mail->chatMessage->text === 'We have inspected the motherboard and ordered replacement mosfets.';
        });

        // 2. Client checks notifications
        Sanctum::actingAs($client);

        $notifResponse = $this->getJson('/api/notifications');
        $notifResponse->assertStatus(200)
            ->assertJsonPath('unreadCount', 1);

        // 3. Client replies to technician
        $replyResponse = $this->postJson("/api/repairs/{$repair->id}/chat", [
            'text' => 'Thank you Jordan, please proceed with the installation.',
        ]);

        $replyResponse->assertStatus(201)
            ->assertJson([
                'from' => 'client',
                'author' => 'Aisha Bello',
            ]);

        // Email dispatched to technician
        Mail::assertSent(TechnicianRepairMessageMail::class, function ($mail) {
            return $mail->hasTo('tech_chat@fixlab.com')
                && $mail->chatMessage->text === 'Thank you Jordan, please proceed with the installation.';
        });

        // 4. Admin opens chat to monitor
        $admin = User::create([
            'name' => 'Alex Admin',
            'email' => 'admin_view_chat@fixlab.com',
            'phone' => '080 0000 1111',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);
        Sanctum::actingAs($admin);

        $adminView = $this->getJson("/api/repairs/{$repair->id}/chat");
        $adminView->assertStatus(200)
            ->assertJsonPath('trackingNumber', 'FL-9001')
            ->assertJsonCount(2, 'messages');
    }

    public function test_reports_summary_with_month_year_and_individual_technician_performance(): void
    {
        $admin = User::create([
            'name' => 'Alex Admin',
            'email' => 'admin_reports@fixlab.com',
            'phone' => '080 0000 2222',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        $tech = User::create([
            'name' => 'Jordan Malik',
            'email' => 'jordan_reports@fixlab.com',
            'phone' => '080 3456 7891',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);
        TechnicianProfile::create([
            'user_id' => $tech->id,
            'specialty' => 'Mobile, Tablet, Laptops',
            'is_available' => true,
        ]);

        // Completed repair this month
        Repair::create([
            'tracking_number' => 'FL-9002',
            'technician_id' => $tech->id,
            'customer_name' => 'David O',
            'customer_email' => 'david@example.com',
            'customer_phone' => '080 1234 5678',
            'device_name' => 'iPhone 13',
            'device_category' => 'Phone',
            'reported_issue' => 'Screen cracked',
            'status' => 'Completed',
            'estimate_amount' => 45000,
            'is_paid' => true,
            'due_date' => now()->addDays(2),
            'created_at' => now(),
        ]);

        // In progress repair this month
        Repair::create([
            'tracking_number' => 'FL-9003',
            'technician_id' => $tech->id,
            'customer_name' => 'Chidi E',
            'customer_email' => 'chidi@example.com',
            'customer_phone' => '080 8765 4321',
            'device_name' => 'ThinkPad T14',
            'device_category' => 'Laptop',
            'reported_issue' => 'Key replacement',
            'status' => 'In progress',
            'estimate_amount' => 30000,
            'is_paid' => false,
            'due_date' => now()->addDays(3),
            'created_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $currentMonth = (int) date('n');
        $currentYear = (int) date('Y');

        $response = $this->getJson("/api/reports/summary?month={$currentMonth}&year={$currentYear}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'filter' => ['month', 'year', 'monthName', 'isCurrentMonth'],
                'availableYears',
                'periodSummary' => ['totalJobs', 'completedJobs', 'activeJobs', 'completionRate', 'totalQuoted', 'revenue'],
                'allTime',
                'statusCounts',
                'categoryBreakdown',
                'monthlyTrend',
                'technicianPerformance' => [
                    '*' => [
                        'id', 'name', 'specialties', 'assignedJobs', 'completedJobs', 'activeJobs', 'revenueGenerated', 'completionRate',
                    ],
                ],
            ]);

        $this->assertEquals(2, $response->json('periodSummary.totalJobs'));
        $this->assertEquals(1, $response->json('periodSummary.completedJobs'));
        $this->assertEquals(1, $response->json('periodSummary.activeJobs'));
        $this->assertEquals(50, $response->json('periodSummary.completionRate'));
        $this->assertCount(12, $response->json('monthlyTrend'));

        // Check individual tech performance
        $techPerf = collect($response->json('technicianPerformance'))->firstWhere('name', 'Jordan Malik');
        $this->assertNotNull($techPerf);
        $this->assertEquals(2, $techPerf['assignedJobs']);
        $this->assertEquals(1, $techPerf['completedJobs']);
        $this->assertEquals(1, $techPerf['activeJobs']);
        $this->assertEquals(45000, $techPerf['revenueGenerated']);
    }
}
