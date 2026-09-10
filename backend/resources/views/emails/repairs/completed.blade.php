<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Device is Ready for Collection!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #38bdf8; letter-spacing: -0.5px; }
        .email-header p { margin: 8px 0 0 0; color: #cbd5e1; font-size: 15px; }
        .email-body { padding: 28px; }
        .congrats-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
        .congrats-banner h3 { margin: 0 0 4px 0; color: #166534; font-size: 18px; }
        .congrats-banner p { margin: 0; color: #15803d; font-size: 14px; }
        .ref-badge { display: inline-block; background: #ecfeff; color: #08a4b3; font-weight: 700; font-size: 16px; padding: 6px 14px; border-radius: 8px; border: 1px solid #cffafe; margin: 10px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
        .details-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .details-table td:first-child { color: #64748b; width: 35%; font-weight: 500; }
        .details-table td:last-child { color: #0f172a; font-weight: 600; }
        .details-table tr:last-child td { border-bottom: none; }
        .btn { display: inline-block; background: #08a4b3; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
        .pickup-info { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569; }
        .email-footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap Service Complete</h1>
            <p>Your device has passed precision quality testing</p>
        </div>
        <div class="email-body">
            <div class="congrats-banner">
                <h3>🎉 Great News, {{ $repair->customer_name }}!</h3>
                <p>Your repair is complete and your device is now ready for collection.</p>
            </div>

            <p>Our senior bench technicians have completed all servicing, parts replacements, and final quality control diagnostics on your device.</p>

            <table class="details-table">
                <tr>
                    <td>Tracking Reference</td>
                    <td><span class="ref-badge">#{{ $repair->tracking_number }}</span></td>
                </tr>
                <tr>
                    <td>Device</td>
                    <td>{{ $repair->device_name }}</td>
                </tr>
                <tr>
                    <td>Resolved Issue</td>
                    <td>{{ $repair->reported_issue }}</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td><strong style="color: #16a34a;">Ready for Pickup / Collection</strong></td>
                </tr>
                <tr>
                    <td>Warranty Period</td>
                    <td>90-Day Comprehensive Kendat FixLap Guarantee</td>
                </tr>
            </table>

            <div class="pickup-info">
                <strong>📍 Collection Hub:</strong><br>
                Kendat FixLap Ikeja Hub (HQ), Plot 12 Commercial Avenue, Ikeja, Lagos.<br>
                <strong>Operating Hours:</strong> Monday – Saturday, 8:00 AM – 6:30 PM.<br>
                <em>Please present your repair tracking code (<strong>#{{ $repair->tracking_number }}</strong>) upon arrival for fast handover.</em>
            </div>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}" class="btn">Access Client Portal & Invoice</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Technologies · Thank you for trusting our repair specialists.<br>Questions or dispatch request? Call +234 800 349 5227.</p>
        </div>
    </div>
</body>
</html>
