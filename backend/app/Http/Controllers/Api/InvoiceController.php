<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Repair;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $invoice = Invoice::where('invoice_number', $id)
            ->orWhere('id', $id)
            ->orWhereHas('repair', function ($q) use ($id) {
                $q->where('tracking_number', $id);
            })
            ->with(['items', 'repair.technician', 'client'])
            ->firstOrFail();

        return response()->json($invoice);
    }
}
