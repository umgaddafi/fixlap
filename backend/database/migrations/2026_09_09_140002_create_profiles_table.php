<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialty')->default('General repairs');
            $table->boolean('is_available')->default(true)->index();
            $table->unsignedInteger('active_job_count')->default(0);
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->timestamps();
        });

        Schema::create('client_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('preferred_contact_method', 20)->default('email'); // email, sms, whatsapp
            $table->boolean('notify_sms')->default(true);
            $table->boolean('notify_email')->default(true);
            $table->boolean('notify_whatsapp')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_profiles');
        Schema::dropIfExists('technician_profiles');
    }
};
