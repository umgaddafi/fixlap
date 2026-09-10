<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Chat Reply Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08); }
        .email-header { background: #0b2230; padding: 26px; text-align: center; color: #ffffff; border-bottom: 3px solid #73e2e0; }
        .email-header h1 { margin: 0; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #73e2e0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body { padding: 30px; }
        .reply-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 18px 20px; border-radius: 8px; margin: 20px 0; }
        .reply-author { font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .reply-text { font-size: 15px; color: #0f172a; margin: 0; font-style: italic; }
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
            <h1>Kendat FixLap · Workbench Alert</h1>
            <p>New Client Chat Message</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 19px; margin-top: 0; color: #0f172a;">Hello {{ $technician->name }},</h2>
            
            <p style="font-size: 14.5px; color: #334155;">
                Client <strong>{{ $chatMessage->author_name }}</strong> has sent a reply regarding repair ticket:
            </p>

            <div style="text-align: center;">
                <div class="ref-badge">#{{ $repair->tracking_number }}</div>
            </div>

            <div class="reply-box">
                <div class="reply-author">Message from Client ({{ $chatMessage->author_name }})</div>
                <p class="reply-text">"{{ $chatMessage->text }}"</p>
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
                    <td>Customer Phone</td>
                    <td><a href="tel:{{ $repair->customer_phone }}" style="color: #0369a1; text-decoration: none;">{{ $repair->customer_phone }}</a></td>
                </tr>
            </table>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/staff/login" class="btn">Open Chat & Reply</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Workshop Technical Coordination<br>Plot 12, Commercial Avenue, Ikeja, Lagos</p>
        </div>
    </div>
</body>
</html>
