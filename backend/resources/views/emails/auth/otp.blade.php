<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Security Code</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .email-header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
        .email-body { padding: 28px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #08a4b3; background: #f0fdfa; border: 1px dashed #99f6e4; padding: 14px 28px; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .email-footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap Security Code</h1>
        </div>
        <div class="email-body">
            <p>Hello {{ $name }},</p>
            <p>Use the one-time security code below to complete your verification or login request:</p>
            <div class="otp-code">{{ $otp }}</div>
            <p style="font-size: 13px; color: #64748b;">This code is valid for 15 minutes. If you did not make this request, you can safely ignore this message.</p>
        </div>
        <div class="email-footer">
            <p>© {{ date('Y') }} Kendat FixLap. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
