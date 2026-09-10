<?php

namespace Tests\Feature;

use App\Mail\JobAssignedMail;
use App\Mail\NewRepairAdminAlertMail;
use App\Mail\TechnicianStandbyMail;
use App\Models\Repair;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TechnicianAndCustomerManagementTest extends TestCase
{
    use RefreshDatabase;
    public function test_technician_index_includes_phone()
    {
        $tech = User::create([
            'name' => 'Test Tech',
            'email' => 'tech_index_test@fixlab.com',
            'phone' => '080 1111 2222',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);
        TechnicianProfile::create([
            'user_id' => $tech->id,
            'specialty' => 'Hardware testing',
            'is_available' => true,
        ]);

        $response = $this->actingAs($tech)->getJson('/api/technicians');
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'email' => 'tech_index_test@fixlab.com',
            'phone' => '080 1111 2222',
        ]);
    }

    public function test_technician_creation_requires_phone()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_test@fixlab.com'],
            ['name' => 'Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        $response = $this->actingAs($admin)->postJson('/api/technicians', [
            'name' => 'No Phone Tech',
            'email' => 'nophone@fixlab.com',
            'specialty' => 'Screens',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['phone']);
    }

    public function test_technician_can_be_created_modified_and_deleted()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_test2@fixlab.com'],
            ['name' => 'Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        // 1. Create
        $email = 'tech_crud_' . time() . '@fixlab.com';
        $createRes = $this->actingAs($admin)->postJson('/api/technicians', [
            'name' => 'Emeka Okafor',
            'email' => $email,
            'phone' => '080 4444 5555',
            'specialty' => 'Tablets & Motherboards',
            'available' => true,
        ]);
        $createRes->assertStatus(201);
        $techId = $createRes->json('technician.id');

        // 2. Modify
        $updateRes = $this->actingAs($admin)->putJson("/api/technicians/{$techId}", [
            'name' => 'Emeka Okafor Snr',
            'email' => $email,
            'phone' => '080 6666 7777',
            'specialty' => 'Advanced Micro-soldering',
            'available' => false,
        ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('Emeka Okafor Snr', $updateRes->json('technician.name'));
        $this->assertEquals('080 6666 7777', $updateRes->json('technician.phone'));

        // 3. Delete
        $deleteRes = $this->actingAs($admin)->deleteJson("/api/technicians/{$techId}");
        $deleteRes->assertStatus(200);
    }

    public function test_customer_can_be_modified_and_deleted()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_test3@fixlab.com'],
            ['name' => 'Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        $client = User::create([
            'name' => 'Ngozi Eze',
            'email' => 'ngozi_' . time() . '@fixlab.com',
            'phone' => '080 1234 9999',
            'role' => 'client',
            'password' => bcrypt('password'),
        ]);

        $repair = Repair::create([
            'tracking_number' => 'FL-TEST-' . rand(1000, 9999),
            'client_id' => $client->id,
            'customer_name' => $client->name,
            'customer_email' => $client->email,
            'customer_phone' => $client->phone,
            'device_name' => 'iPhone 12',
            'device_category' => 'Phone',
            'reported_issue' => 'Battery replacement',
            'status' => 'In progress',
            'priority' => 'Normal',
            'stage_index' => 1,
            'due_date' => now()->addDays(2),
        ]);

        // 1. Update customer
        $updateRes = $this->actingAs($admin)->putJson("/api/customers/cust-{$client->id}", [
            'name' => 'Ngozi Eze-Johnson',
            'email' => $client->email,
            'phone' => '080 8888 7777',
        ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('Ngozi Eze-Johnson', $updateRes->json('customer.name'));

        // Verify repair sync
        $repair->refresh();
        $this->assertEquals('Ngozi Eze-Johnson', $repair->customer_name);
        $this->assertEquals('080 8888 7777', $repair->customer_phone);

        // 2. Delete customer
        $deleteRes = $this->actingAs($admin)->deleteJson("/api/customers/cust-{$client->id}");
        $deleteRes->assertStatus(200);
    }

    public function test_technician_receives_email_when_job_is_assigned()
    {
        Mail::fake();

        $admin = User::firstOrCreate(
            ['email' => 'admin_test4@fixlab.com'],
            ['name' => 'Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        $tech = User::create([
            'name' => 'Assigned Tech',
            'email' => 'assigned_tech_' . time() . '@fixlab.com',
            'phone' => '080 5555 4444',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        // Create repair assigned to technician
        $response = $this->actingAs($admin)->postJson('/api/repairs', [
            'customer' => 'Customer A',
            'email' => 'customera@fixlab.com',
            'phone' => '080 1111 2222',
            'device' => 'MacBook Pro M1',
            'category' => 'Laptop',
            'issue' => 'Screen replacement',
            'priority' => 'High',
            'dueDate' => now()->addDays(3)->format('Y-m-d'),
            'technicianId' => "tech-{$tech->id}",
        ]);

        $response->assertStatus(201);

        Mail::assertSent(JobAssignedMail::class, function ($mail) use ($tech) {
            return $mail->hasTo($tech->email);
        });
    }

    public function test_technician_receives_email_when_job_is_reassigned()
    {
        Mail::fake();

        $admin = User::firstOrCreate(
            ['email' => 'admin_test5@fixlab.com'],
            ['name' => 'Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        $client = User::create([
            'name' => 'Customer B',
            'email' => 'customerb@fixlab.com',
            'phone' => '080 3333 4444',
            'role' => 'client',
            'password' => bcrypt('password'),
        ]);

        $repair = Repair::create([
            'tracking_number' => 'FL-REASSIGN-' . rand(1000, 9999),
            'client_id' => $client->id,
            'customer_name' => $client->name,
            'customer_email' => $client->email,
            'customer_phone' => $client->phone,
            'device_name' => 'Samsung S22',
            'device_category' => 'Phone',
            'reported_issue' => 'Charging port loose',
            'status' => 'New',
            'priority' => 'Normal',
            'stage_index' => 0,
            'due_date' => now()->addDays(2),
            'technician_id' => null,
        ]);

        $newTech = User::create([
            'name' => 'Reassigned Tech',
            'email' => 'reassigned_tech_' . time() . '@fixlab.com',
            'phone' => '080 7777 8888',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        // Reassign job to new technician
        $response = $this->actingAs($admin)->putJson("/api/repairs/{$repair->tracking_number}", [
            'technicianId' => "tech-{$newTech->id}",
        ]);

        $response->assertStatus(200);

        Mail::assertSent(JobAssignedMail::class, function ($mail) use ($newTech) {
            return $mail->hasTo($newTech->email);
        });
    }

    public function test_technician_can_have_multiple_specialties()
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_multi_spec@fixlab.com'],
            ['name' => 'Admin Multi', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        // 1. Create with array of multiple specialties
        $response = $this->actingAs($admin)->postJson('/api/technicians', [
            'name' => 'Multi Tech',
            'email' => 'multi_tech_' . time() . '@fixlab.com',
            'phone' => '080 8888 9999',
            'specialty' => ['Mobile', 'Tablet', 'Desktop'],
            'available' => true,
        ]);

        $response->assertStatus(201);
        $this->assertEquals('Mobile, Tablet, Desktop', $response->json('technician.specialty'));
        $this->assertEquals(['Mobile', 'Tablet', 'Desktop'], $response->json('technician.specialties'));

        $techId = $response->json('technician.id');

        // 2. Update with new set of specialties
        $updateRes = $this->actingAs($admin)->putJson("/api/technicians/{$techId}", [
            'name' => 'Multi Tech Updated',
            'email' => $response->json('technician.email'),
            'phone' => '080 8888 9999',
            'specialty' => ['Mobile', 'Laptops', 'Micro-soldering'],
            'available' => true,
        ]);

        $updateRes->assertStatus(200);
        $this->assertEquals('Mobile, Laptops, Micro-soldering', $updateRes->json('technician.specialty'));
        $this->assertEquals(['Mobile', 'Laptops', 'Micro-soldering'], $updateRes->json('technician.specialties'));
    }

    public function test_client_repair_submission_sends_email_to_admin_and_all_technicians()
    {
        Mail::fake();

        // Seed 1 admin and 2 technicians
        $admin = User::firstOrCreate(
            ['email' => 'admin_alert_dest@fixlab.com'],
            ['name' => 'Alert Admin', 'role' => 'admin', 'password' => bcrypt('password')]
        );

        $tech1 = User::create([
            'name' => 'Tech Standby 1',
            'email' => 'tech_standby_1_' . time() . '@fixlab.com',
            'phone' => '080 1234 0001',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        $tech2 = User::create([
            'name' => 'Tech Standby 2',
            'email' => 'tech_standby_2_' . time() . '@fixlab.com',
            'phone' => '080 1234 0002',
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        $client = User::create([
            'name' => 'Submitting Client',
            'email' => 'submitter_' . time() . '@fixlab.com',
            'phone' => '080 9999 8888',
            'role' => 'client',
            'password' => bcrypt('password'),
        ]);

        // Client submits repair
        $response = $this->actingAs($client)->postJson('/api/client/repairs', [
            'deviceType' => 'Phone',
            'model' => 'iPhone 14 Pro Max',
            'issue' => 'Cracked OLED and no touchscreen response',
            'phone' => '080 9999 8888',
            'dropoffDate' => now()->format('Y-m-d'),
        ]);

        $response->assertStatus(201);

        // Verify Admin alert email was sent
        Mail::assertSent(NewRepairAdminAlertMail::class, function ($mail) use ($admin) {
            return $mail->hasTo($admin->email);
        });

        // Verify Technician standby emails were sent to both technicians
        Mail::assertSent(TechnicianStandbyMail::class, function ($mail) use ($tech1) {
            return $mail->hasTo($tech1->email);
        });

        Mail::assertSent(TechnicianStandbyMail::class, function ($mail) use ($tech2) {
            return $mail->hasTo($tech2->email);
        });
    }
}
