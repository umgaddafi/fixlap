<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Message Regarding Your Repair</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08); }
        .email-header { background: #0b2230; padding: 26px; text-align: center; color: #ffffff; border-bottom: 3px solid #73e2e0; }
        .email-header h1 { margin: 0; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #73e2e0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body { padding: 30px; }
        .message-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 20px; border-radius: 8px; margin: 20px 0; }
        .message-author { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .message-text { font-size: 15px; color: #0f172a; margin: 0; font-style: italic; }
        .ref-badge { display: inline-block; background: #0f2b38; color: #73e2e0; font-weight: 800; font-size: 18px; padding: 6px 16px; border-radius: 8px; letter-spacing: 0.05em; margin: 8px 0 16px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
        .details-table td { padding: 12px 18px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .details-table td:first-child { color: #64748b; width: 34%; font-weight: 600; font-size: 13px; }
        .details-table td:last-child { color: #0f172a; font-weight: 600; }
        .details-table tr:last-child td { border-bottom: none; }
        .btn { display: inline-block; background: #0f2b38; color: #73e2e0 !important; border: 1px solid #73e2e055; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; }
        .email-footer { background: #f8fafc; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap · Client Support</h1>
            <p>Direct Workshop Message</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 19px; margin-top: 0; color: #0f172a;">Hello {{ $repair->customer_name }},</h2>
            
            <p style="font-size: 14.5px; color: #334155;">
                You have received a new update from your repair technician regarding device work order:
            </p>

            <div style="text-align: center;">
                <div class="ref-badge">#{{ $repair->tracking_number }}</div>
            </div>

            <div class="message-box">
                <div class="message-author">Message from {{ $chatMessage->author_name }} (Technician)</div>
                <p class="message-text">"{{ $chatMessage->text }}"</p>
            </div>

            <table class="details-table">
                <tr>
                    <td>Device Model</td>
                    <td>{{ $repair->device_name }} ({{ $repair->device_category }})</td>
                </tr>
                <tr>
                    <td>Current Status</td>
                    <td>{{ $repair->status }}</td>
                </tr>
                <tr>
                    <td>Reported Issue</td>
                    <td>{{ $repair->reported_issue }}</td>
                </tr>
            </table>

            <p style="font-size: 13.5px; color: #64748b;">
                You can reply directly to your technician or view the full live conversation anytime inside your FixLab client portal.
            </p>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/client/login" class="btn">Reply to Technician in Portal</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Repair Centre · Client Communications<br>Plot 12, Commercial Avenue, Ikeja, Lagos</p>
        </div>
    </div>
</body>
</html>
