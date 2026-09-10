<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\ClientProfile;
use App\Models\Referral;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'role' => 'nullable|string|in:admin,repairer,client',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email address or password.',
            ], 401);
        }

        if ($request->filled('role') && $user->role !== $request->role) {
            return response()->json([
                'message' => "Account is not registered with the '{$request->role}' role.",
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'avatar_url' => $user->avatar_url,
                'referral_code' => $user->referral_code,
            ],
            'role' => $user->role,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|max:191|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'referral_code' => 'nullable|string',
        ]);

        // Generate a referral code for this new user
        $newReferralCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $request->name), 0, 5) . rand(100, 999));

        $referrer = null;
        if ($request->filled('referral_code')) {
            $referrer = User::where('referral_code', trim($request->referral_code))->first();
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone ?? '080 0000 0000',
            'role' => 'client',
            'referral_code' => $newReferralCode,
            'referred_by_id' => $referrer?->id,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        ClientProfile::create([
            'user_id' => $user->id,
            'notify_sms' => true,
            'notify_email' => true,
            'notify_whatsapp' => true,
        ]);

        if ($referrer) {
            Referral::create([
                'referrer_id' => $referrer->id,
                'referee_id' => $user->id,
                'referral_code' => $referrer->referral_code,
                'status' => 'converted',
                'reward_amount' => 2500,
                'converted_at' => now(),
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'referral_code' => $user->referral_code,
            ],
            'role' => $user->role,
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['technicianProfile', 'clientProfile']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'avatar_url' => $user->avatar_url,
                'referral_code' => $user->referral_code,
                'technician_profile' => $user->technicianProfile,
                'client_profile' => $user->clientProfile,
            ],
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out.',
        ]);
    }

    /**
     * Generate and send a 6-digit OTP security code via SMS and Email.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string', // phone or email
            'type' => 'nullable|string|in:login,register,reset,verification',
        ]);

        $identifier = trim($request->identifier);
        $user = User::where('email', $identifier)->orWhere('phone', $identifier)->first();

        $otp = sprintf('%06d', random_int(100000, 999999));
        $cacheKey = "fixlab_otp_" . md5($identifier);
        Cache::put($cacheKey, $otp, now()->addMinutes(15));

        $sentChannels = [];

        // Determine destination phone
        $phone = $user?->phone ?? (preg_match('/^[0-9+ ]{8,20}$/', $identifier) ? $identifier : null);
        if ($phone) {
            try {
                if (SmsService::sendOtp($phone, $otp)) {
                    $sentChannels[] = 'sms';
                }
            } catch (\Throwable $e) {
                Log::error('OTP SMS error: ' . $e->getMessage());
            }
        }

        // Determine destination email
        $email = $user?->email ?? (filter_var($identifier, FILTER_VALIDATE_EMAIL) ? $identifier : null);
        if ($email) {
            try {
                Mail::to($email)->send(new OtpMail($otp, $user?->name ?? 'Valued Customer'));
                $sentChannels[] = 'email';
            } catch (\Throwable $e) {
                Log::error('OTP Email error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'status' => true,
            'message' => 'Security code generated and dispatched.',
            'channels' => $sentChannels,
            'expires_in_minutes' => 15,
        ]);
    }

    /**
     * Verify the 6-digit OTP security code.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $identifier = trim($request->identifier);
        $cacheKey = "fixlab_otp_" . md5($identifier);
        $storedCode = Cache::get($cacheKey);

        if (! $storedCode || $storedCode !== trim($request->code)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid or expired security code. Please request a new code.',
            ], 422);
        }

        // Clean up code once consumed
        Cache::forget($cacheKey);

        $user = User::where('email', $identifier)->orWhere('phone', $identifier)->first();
        $token = null;
        if ($user) {
            $token = $user->createToken('auth-token')->plainTextToken;
        }

        return response()->json([
            'status' => true,
            'message' => 'Security code verified successfully.',
            'verified' => true,
            'token' => $token,
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ] : null,
        ]);
    }
}
