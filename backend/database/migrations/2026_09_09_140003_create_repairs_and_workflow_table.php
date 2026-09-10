<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number', 50)->unique();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Customer contact information (denormalized for speed and offline/guest tickets)
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            
            // Device specifications
            $table->string('device_category', 50)->default('Phone'); // Phone, Laptop, Tablet, Smartwatch, Other
            $table->string('device_name');
            $table->string('serial_or_imei')->nullable();
            
            // Issue & Diagnosis
            $table->text('reported_issue');
            $table->text('diagnostic_notes')->nullable();
            
            // Workflow state
            $table->string('status', 50)->default('New')->index(); // New, In progress, Awaiting parts, Ready for pickup, Completed, Cancelled
            $table->string('priority', 30)->default('Normal')->index(); // Normal, High, Urgent
            $table->unsignedTinyInteger('stage_index')->default(0); // 0 to 5
            
            // Schedule & Estimates
            $table->date('due_date')->index();
            $table->string('appointment_time', 20)->nullable();
            $table->decimal('estimate_amount', 12, 2)->default(0.00);
            $table->decimal('final_amount', 12, 2)->default(0.00);
            $table->boolean('is_paid')->default(false)->index();
            
            $table->timestamp('dropoff_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('repair_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('event_description');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('repair_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('author_name');
            $table->text('text');
            $table->boolean('is_internal')->default(false); // Internal technician note vs client-facing
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_notes');
        Schema::dropIfExists('repair_timeline_events');
        Schema::dropIfExists('repairs');
    }
};
