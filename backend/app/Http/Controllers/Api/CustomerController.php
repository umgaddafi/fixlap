<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        // Get all unique customers from clients and repairs
        $clients = User::where('role', 'client')
            ->with(['clientRepairs' => fn ($q) => $q->orderBy('created_at', 'desc')])
            ->get();

        $formatted = $clients->map(function ($client) {
            $repairs = $client->clientRepairs;
            $totalSpend = $repairs->where('is_paid', true)->sum('estimate_amount');
            $activeCount = $repairs->whereNotIn('status', ['Completed', 'Cancelled'])->count();

            return [
                'id' => "cust-{$client->id}",
                'dbId' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone ?? '080 0000 0000',
                'repairCount' => $repairs->count(),
                'activeRepairs' => $activeCount,
                'totalSpent' => (float) $totalSpend,
                'repairs' => $repairs->map(fn ($r) => [
                    'id' => $r->tracking_number,
                    'device' => $r->device_name,
                    'status' => $r->status,
                    'estimate' => (float) $r->estimate_amount,
                    'paid' => (bool) $r->is_paid,
                ]),
            ];
        });

        return response()->json($formatted);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $cleanId = str_replace('cust-', '', $id);
        $client = User::where(function ($q) use ($cleanId, $id) {
            $q->where('id', $cleanId)->orWhere('email', $id);
        })->where('role', 'client')->firstOrFail();

        $realId = $client->id;
        $request->validate([
            'name' => 'required|string|max:191',
            'email' => "required|email|max:191|unique:users,email,{$realId}",
            'phone' => 'required|string|max:50',
        ]);

        $client->name = $request->name;
        $client->email = $request->email;
        $client->phone = $request->phone;
        $client->save();

        // Synchronize customer details across their repair orders
        Repair::where('client_id', $cleanId)->update([
            'customer_name' => $client->name,
            'customer_email' => $client->email,
            'customer_phone' => $client->phone,
        ]);

        $repairs = $client->clientRepairs()->orderBy('created_at', 'desc')->get();
        $totalSpend = $repairs->where('is_paid', true)->sum('estimate_amount');
        $activeCount = $repairs->whereNotIn('status', ['Completed', 'Cancelled'])->count();

        return response()->json([
            'message' => "Customer {$client->name} updated successfully.",
            'customer' => [
                'id' => "cust-{$client->id}",
                'dbId' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'repairCount' => $repairs->count(),
                'activeRepairs' => $activeCount,
                'totalSpent' => (float) $totalSpend,
                'repairs' => $repairs->map(fn ($r) => [
                    'id' => $r->tracking_number,
                    'device' => $r->device_name,
                    'status' => $r->status,
                    'estimate' => (float) $r->estimate_amount,
                    'paid' => (bool) $r->is_paid,
                ]),
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $cleanId = str_replace('cust-', '', $id);
        $client = User::where(function ($q) use ($cleanId, $id) {
            $q->where('id', $cleanId)->orWhere('email', $id);
        })->where('role', 'client')->firstOrFail();

        $name = $client->name;
        $client->delete();

        return response()->json([
            'message' => "Customer {$name} deleted successfully.",
            'id' => "cust-{$client->id}",
        ]);
    }
}
