<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::with('category')->where('is_active', true);

        if ($request->filled('category') && $request->category !== 'All') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('name', $request->category);
            });
        }

        if ($request->boolean('lowStock')) {
            $query->whereColumn('stock_quantity', '<=', 'minimum_reorder_level');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('name')->get();

        $formatted = $items->map(function ($item) {
            return [
                'id' => "part-{$item->id}",
                'dbId' => $item->id,
                'name' => $item->name,
                'category' => $item->category->name ?? 'General',
                'sku' => $item->sku,
                'stock' => $item->stock_quantity,
                'minimum' => $item->minimum_reorder_level,
                'price' => (float) $item->price,
            ];
        });

        return response()->json($formatted);
    }

    public function restock(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $cleanId = str_replace('part-', '', $id);
        $item = InventoryItem::where('id', $cleanId)->orWhere('sku', $id)->firstOrFail();

        $delta = (int) $request->quantity;
        $item->stock_quantity += $delta;
        $item->save();

        InventoryTransaction::create([
            'inventory_item_id' => $item->id,
            'type' => 'restock',
            'quantity_delta' => $delta,
            'balance_after' => $item->stock_quantity,
            'user_id' => auth()->id(),
            'notes' => $request->notes ?? "Restocked +{$delta} units via staff portal.",
        ]);

        return response()->json([
            'message' => "Successfully restocked +{$delta} units of {$item->name}.",
            'item' => [
                'id' => "part-{$item->id}",
                'dbId' => $item->id,
                'name' => $item->name,
                'category' => $item->category->name ?? 'General',
                'sku' => $item->sku,
                'stock' => $item->stock_quantity,
                'minimum' => $item->minimum_reorder_level,
                'price' => (float) $item->price,
            ],
        ]);
    }
}
