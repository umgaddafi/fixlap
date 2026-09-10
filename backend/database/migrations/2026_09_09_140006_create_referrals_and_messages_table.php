<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('referral_code', 50)->index();
            $table->string('status', 30)->default('pending')->index(); // pending, converted, paid
            $table->decimal('reward_amount', 12, 2)->default(2500.00);
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('message_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_id')->nullable()->constrained('repairs')->nullOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('message_threads')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->string('from_role', 20)->default('client'); // staff, client
            $table->string('author_name');
            $table->text('text');
            $table->boolean('is_read')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100)->index(); // status_update, repair_created, payment_verified, stock_restock
            $table->text('description');
            $table->string('subject_type')->nullable(); // e.g. App\Models\Repair
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('message_threads');
        Schema::dropIfExists('referrals');
    }
};
