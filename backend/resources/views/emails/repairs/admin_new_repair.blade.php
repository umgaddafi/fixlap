<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Repair Request Received</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08); }
        .email-header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; border-bottom: 3px solid #08a4b3; }
        .email-header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #73e2e0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body { padding: 30px; }
        .alert-banner { background: #ecfeff; border-left: 4px solid #08a4b3; padding: 14px 18px; border-radius: 6px; margin-bottom: 22px; }
        .alert-banner p { margin: 0; font-size: 13.5px; color: #0e4e58; font-weight: 500; }
        .ref-badge { display: inline-block; background: #0f2b38; color: #73e2e0; font-weight: 800; font-size: 20px; padding: 8px 18px; border-radius: 8px; letter-spacing: 0.05em; margin: 8px 0 18px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
        .details-table td { padding: 13px 18px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .details-table td:first-child { color: #64748b; width: 34%; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
        .details-table td:last-child { color: #0f172a; font-weight: 600; }
        .details-table tr:last-child td { border-bottom: none; }
        .btn { display: inline-block; background: #08a4b3; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
        .email-footer { background: #f8fafc; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap · Admin Operations</h1>
            <p>New Client Work Order Intake</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 19px; margin-top: 0; color: #0f172a;">Hello Admin{{ isset($admin->name) ? ' ' . $admin->name : '' }},</h2>
            
            <div class="alert-banner">
                <p><strong>Action Required:</strong> A client has just submitted a new repair request online. All workshop technicians have been notified to remain on standby. Please review and assign a technician to begin diagnosis.</p>
            </div>

            <div style="text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Work Order Tracking Number</div>
                <div class="ref-badge">#{{ $repair->tracking_number }}</div>
            </div>

            <table class="details-table">
                <tr>
                    <td>Client Name</td>
                    <td>{{ $repair->customer_name }}</td>
                </tr>
                <tr>
                    <td>Contact Email</td>
                    <td>{{ $repair->customer_email }}</td>
                </tr>
                <tr>
                    <td>Contact Phone</td>
                    <td>{{ $repair->customer_phone ?? 'Not provided' }}</td>
                </tr>
                <tr>
                    <td>Device Model</td>
                    <td>{{ $repair->device_name }} ({{ $repair->device_category }})</td>
                </tr>
                <tr>
                    <td>Reported Issue</td>
                    <td>{{ $repair->reported_issue }}</td>
                </tr>
                <tr>
                    <td>Estimated Cost</td>
                    <td>₦{{ number_format((float) $repair->estimate_amount) }}</td>
                </tr>
                <tr>
                    <td>Intake / Dropoff</td>
                    <td>{{ $repair->dropoff_date ? \Carbon\Carbon::parse($repair->dropoff_date)->format('d M Y') : 'Scheduled' }}</td>
                </tr>
                <tr>
                    <td>Current Status</td>
                    <td><span style="display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0284c7; border-radius: 6px; font-weight: 700; font-size: 12px;">{{ $repair->status }}</span></td>
                </tr>
            </table>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/staff/login" class="btn">Open Admin Dashboard & Assign Technician</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Administrative Service Dispatch · Automated Workshop Notification<br>Ikeja Hub (HQ), Lagos, Nigeria</p>
        </div>
    </div>
</body>
</html>
