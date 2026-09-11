<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $referrals = Referral::where('referrer_id', $user->id)
            ->with('referee')
            ->orderBy('created_at', 'desc')
            ->get();

        $totalEarnings = $referrals->where('status', 'converted')->sum('reward_amount');
        $successfulInvites = $referrals->where('status', 'converted')->count();

        if (empty($user->referral_code)) {
            $user->referral_code = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $user->name ?: 'USER'), 0, 5) . rand(100, 999));
            $user->save();
        }

        return response()->json([
            'referralCode' => $user->referral_code,
            'totalEarnings' => (float) $totalEarnings,
            'successfulInvites' => $successfulInvites,
            'pendingInvites' => $referrals->where('status', 'pending')->count(),
            'referrals' => $referrals->map(fn ($r) => [
                'id' => $r->id,
                'refereeName' => $r->referee?->name ?? 'Invited User',
                'status' => $r->status,
                'reward' => (float) $r->reward_amount,
                'date' => $r->created_at->format('d M Y'),
            ]),
        ]);
    }
}
