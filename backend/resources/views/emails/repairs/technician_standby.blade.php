<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Technician Standby Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08); }
        .email-header { background: #0b2230; padding: 26px; text-align: center; color: #ffffff; border-bottom: 3px solid #73e2e0; }
        .email-header h1 { margin: 0; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #73e2e0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body { padding: 30px; }
        .standby-banner { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 6px; margin-bottom: 22px; }
        .standby-banner p { margin: 0; font-size: 13.5px; color: #166534; font-weight: 500; }
        .ref-badge { display: inline-block; background: #0f2b38; color: #73e2e0; font-weight: 800; font-size: 20px; padding: 8px 18px; border-radius: 8px; letter-spacing: 0.05em; margin: 8px 0 18px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
        .details-table td { padding: 13px 18px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .details-table td:first-child { color: #64748b; width: 34%; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
        .details-table td:last-child { color: #0f172a; font-weight: 600; }
        .details-table tr:last-child td { border-bottom: none; }
        .btn { display: inline-block; background: #0f2b38; color: #73e2e0 !important; border: 1px solid #73e2e055; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
        .email-footer { background: #f8fafc; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap · Workshop Queue</h1>
            <p>Technician Standby Notice</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 19px; margin-top: 0; color: #0f172a;">Hello {{ $technician->name }},</h2>
            
            <div class="standby-banner">
                <p><strong>Standby Alert:</strong> A client has just submitted a new repair request. This work order is currently in the intake queue awaiting administrative assignment. Please be on standby as the workshop administrator will assign this device shortly according to technical specialty and workbench availability.</p>
            </div>

            <div style="text-align: center;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Upcoming Work Order</div>
                <div class="ref-badge">#{{ $repair->tracking_number }}</div>
            </div>

            <table class="details-table">
                <tr>
                    <td>Device Category</td>
                    <td><strong>{{ $repair->device_category }}</strong></td>
                </tr>
                <tr>
                    <td>Device Model</td>
                    <td>{{ $repair->device_name }}</td>
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
                    <td>Intake Scheduled</td>
                    <td>{{ $repair->dropoff_date ? \Carbon\Carbon::parse($repair->dropoff_date)->format('d M Y') : 'Immediate bench queue' }}</td>
                </tr>
                <tr>
                    <td>Current Assignment</td>
                    <td><em>Pending administrator allocation</em></td>
                </tr>
            </table>

            <p style="font-size: 13px; color: #64748b;">If this order matches your technical specialty ({{ $technician->technicianProfile?->specialty ?? 'General repairs' }}), ensure your diagnostic bench and required parts are prepared.</p>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/staff/login" class="btn">View Workbench in Staff Portal</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Workshop Technical Coordination · Automated Standby Broadcast<br>Plot 12, Commercial Avenue, Ikeja, Lagos</p>
        </div>
    </div>
</body>
</html>
