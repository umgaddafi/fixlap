<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientRepairController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\RepairController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TechnicianController;
use Illuminate\Support\Facades\Route;

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/otp/send', [AuthController::class, 'sendOtp']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
});

// Paystack Public Config & Webhook
Route::get('/payments/config', [PaymentController::class, 'config']);
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);
Route::post('/payments/verify', [PaymentController::class, 'verify']);

// Invoices & public reports preview
Route::get('/invoices/{id}', [InvoiceController::class, 'show']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Staff Repair Operations
    Route::get('/repairs', [RepairController::class, 'index']);
    Route::post('/repairs', [RepairController::class, 'store']);
    Route::get('/repairs/{id}', [RepairController::class, 'show']);
    Route::put('/repairs/{id}', [RepairController::class, 'update']);
    Route::post('/repairs/{id}/notes', [RepairController::class, 'addNote']);

    // Client Portal Repairs
    Route::get('/client/repairs', [ClientRepairController::class, 'index']);
    Route::post('/client/repairs', [ClientRepairController::class, 'store']);

    // Inventory & Parts
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);

    // Technicians & Workload
    Route::get('/technicians', [TechnicianController::class, 'index']);
    Route::post('/technicians', [TechnicianController::class, 'store']);
    Route::put('/technicians/{id}', [TechnicianController::class, 'update']);
    Route::delete('/technicians/{id}', [TechnicianController::class, 'destroy']);
    Route::post('/technicians/{id}/toggle-availability', [TechnicianController::class, 'toggleAvailability']);
    Route::post('/technicians/send-daily-reminders', [TechnicianController::class, 'sendDailyReminders']);

    // Customers Directory
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Operational Reports & Analytics
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);

    // Payments & Initialization
    Route::post('/payments/initialize', [PaymentController::class, 'initialize']);

    // Repair-Specific Chat & Notifications
    Route::get('/repairs/{id}/chat', [MessageController::class, 'repairChat']);
    Route::post('/repairs/{id}/chat', [MessageController::class, 'sendRepairMessage']);
    Route::get('/notifications', [MessageController::class, 'notifications']);

    // Messaging Threads
    Route::get('/messages/threads', [MessageController::class, 'threads']);
    Route::post('/messages/threads/{threadId}', [MessageController::class, 'sendMessage']);
    Route::post('/messages/threads/{threadId}/read', [MessageController::class, 'markRead']);

    // Referrals & Rewards
    Route::get('/referrals/stats', [ReferralController::class, 'stats']);
});
