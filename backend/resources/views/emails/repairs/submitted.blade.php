<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repair Request Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .email-header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
        .email-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }
        .email-body { padding: 28px; }
        .ref-badge { display: inline-block; background: #ecfeff; color: #08a4b3; font-weight: 700; font-size: 18px; padding: 8px 16px; border-radius: 8px; border: 1px solid #cffafe; margin: 12px 0 20px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
        .details-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .details-table td:first-child { color: #64748b; width: 35%; font-weight: 500; }
        .details-table td:last-child { color: #0f172a; font-weight: 600; }
        .details-table tr:last-child td { border-bottom: none; }
        .btn { display: inline-block; background: #08a4b3; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
        .email-footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap Device Repair</h1>
            <p>Reliable device repairs with clarity and care</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Hello {{ $repair->customer_name }},</h2>
            <p>Your repair request has been successfully received by the Kendat FixLap workshop intake team. We will inspect your device and begin diagnostic bench testing.</p>
            
            <div style="text-align: center;">
                <div>Your Reference Tracking Number:</div>
                <div class="ref-badge">#{{ $repair->tracking_number }}</div>
            </div>

            <table class="details-table">
                <tr>
                    <td>Device Model</td>
                    <td>{{ $repair->device_name }} ({{ $repair->device_category }})</td>
                </tr>
                <tr>
                    <td>Reported Issue</td>
                    <td>{{ $repair->reported_issue }}</td>
                </tr>
                <tr>
                    <td>Initial Estimate</td>
                    <td>₦{{ number_format((float) $repair->estimate_amount) }}</td>
                </tr>
                <tr>
                    <td>Current Status</td>
                    <td>{{ $repair->status }}</td>
                </tr>
            </table>

            <p>You can track the progress of your repair, chat directly with your assigned technician, and download diagnostic invoices anytime from your client dashboard.</p>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}" class="btn">View Live Tracking on Kendat FixLap</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Technologies · Plot 12, Commercial Avenue, Ikeja, Lagos, Nigeria<br>Need help? Reply directly to this email or call +234 800 349 5227.</p>
        </div>
    </div>
</body>
</html>
