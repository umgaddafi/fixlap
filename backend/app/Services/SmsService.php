<?php

namespace App\Services;

use App\Models\Repair;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Clean and normalize phone numbers for Nigerian telecom networks.
     *
     * @param string|null $phone
     * @return string
     */
    public static function normalizePhone($phone): string
    {
        if (empty($phone)) {
            return '';
        }

        // Keep digits only
        $phone = preg_replace('/[^0-9]/', '', (string) $phone);

        // Normalize 10-digit formats (703..., 802..., 901...)
        if (strlen($phone) === 10 && in_array(substr($phone, 0, 1), ['7', '8', '9'])) {
            $phone = '234' . $phone;
        }
        // Normalize 11-digit local format (0803..., 0901..., 0708...)
        elseif (strlen($phone) === 11 && str_starts_with($phone, '0')) {
            $phone = '234' . substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Send an SMS via KudiSMS API using application/json.
     * Includes automatic fallback to active sender ID if custom ID is pending network approval.
     *
     * @param string $phone
     * @param string $message
     * @return bool
     */
    public static function send(string $phone, string $message): bool
    {
        $normalizedPhone = self::normalizePhone($phone);

        if (empty($normalizedPhone)) {
            Log::warning("SmsService: Phone number '{$phone}' is empty or invalid, skipping SMS.");
            return false;
        }

        $apiKey = config('services.kudisms.api_key', env('KUDISMS_API_KEY'));
        $senderId = config('services.kudisms.sender_id', env('KUDISMS_SENDER_ID', 'Kendat FixLap'));
        $fallbackSenderId = config('services.kudisms.fallback_sender_id', 'SNADKITCHEN');
        $endpoint = config('services.kudisms.endpoint', 'https://my.kudisms.net/api/sms');
        $gateway = config('services.kudisms.gateway', '2');

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($endpoint, [
                'token' => $apiKey,
                'senderID' => $senderId,
                'recipients' => $normalizedPhone,
                'mobiles' => $normalizedPhone,
                'message' => $message,
                'gateway' => $gateway,
            ]);

            $resBody = $response->body();
            Log::info("KudiSMS attempt ({$senderId}) for recipient {$normalizedPhone}: {$resBody}");

            $isSuccess = $response->successful() && (
                str_contains($resBody, '"status":"success"') ||
                str_contains($resBody, '"error_code":"000"')
            );

            // If error 106 (sender ID does not exist / pending approval), retry with approved fallback ID
            if (! $isSuccess && str_contains($resBody, '"error_code":"106"') && ! empty($fallbackSenderId) && $senderId !== $fallbackSenderId) {
                Log::info("KudiSMS: Primary sender ID '{$senderId}' returned 106. Retrying with approved sender ID '{$fallbackSenderId}'.");

                $fallbackResponse = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post($endpoint, [
                    'token' => $apiKey,
                    'senderID' => $fallbackSenderId,
                    'recipients' => $normalizedPhone,
                    'mobiles' => $normalizedPhone,
                    'message' => $message,
                    'gateway' => $gateway,
                ]);

                $fallbackBody = $fallbackResponse->body();
                Log::info("KudiSMS fallback response for recipient {$normalizedPhone}: {$fallbackBody}");

                return $fallbackResponse->successful() && (
                    str_contains($fallbackBody, '"status":"success"') ||
                    str_contains($fallbackBody, '"error_code":"000"')
                );
            }

            return $isSuccess;
        } catch (\Throwable $e) {
            Log::error("KudiSMS exception for recipient {$normalizedPhone}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send reference tracking number when a repair is submitted.
     *
     * @param Repair $repair
     * @return bool
     */
    public static function sendRepairSubmitted(Repair $repair): bool
    {
        if (empty($repair->customer_phone)) {
            Log::warning("Repair #{$repair->tracking_number} has no customer phone number for SMS.");
            return false;
        }

        $fullName = trim($repair->customer_name ?: 'Customer');
        $firstName = explode(' ', $fullName)[0];
        $device = $repair->device_name ?: 'Device';
        $ref = $repair->tracking_number;

        $message = "Dear {$firstName}, your repair request for {$device} has been received. Your reference tracking number is #{$ref}. Thank you for choosing Kendat FixLap!";

        return self::send($repair->customer_phone, $message);
    }

    /**
     * Send congratulation message when repair is fixed and ready for collection.
     *
     * @param Repair $repair
     * @return bool
     */
    public static function sendRepairCompleted(Repair $repair): bool
    {
        if (empty($repair->customer_phone)) {
            Log::warning("Repair #{$repair->tracking_number} has no customer phone number for completion SMS.");
            return false;
        }

        $fullName = trim($repair->customer_name ?: 'Customer');
        $firstName = explode(' ', $fullName)[0];
        $device = $repair->device_name ?: 'Device';
        $ref = $repair->tracking_number;

        $message = "Great news {$firstName}! Your device {$device} (Ref: #{$ref}) has been fixed and is ready for collection at Kendat FixLap. Thank you for trusting us!";

        return self::send($repair->customer_phone, $message);
    }

    /**
     * Send OTP security code via SMS.
     * Note: Uses 'key' instead of telecom-filtered keywords 'otp' or 'verification' to ensure immediate network delivery.
     *
     * @param string $phone
     * @param string $otp
     * @return bool
     */
    public static function sendOtp(string $phone, string $otp): bool
    {
        $message = "Your Kendat FixLap key is {$otp}. Valid for 15 minutes.";
        return self::send($phone, $message);
    }
}
