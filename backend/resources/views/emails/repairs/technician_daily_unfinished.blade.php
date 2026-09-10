<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Technician Morning Digest</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .email-container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08); }
        .email-header { background: #0b2230; padding: 26px; text-align: center; color: #ffffff; border-bottom: 3px solid #73e2e0; }
        .email-header h1 { margin: 0; font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .email-header p { margin: 6px 0 0 0; color: #73e2e0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body { padding: 30px; }
        .alert-banner { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; }
        .alert-banner p { margin: 0; font-size: 14px; color: #92400e; font-weight: 500; }
        .repair-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 16px; }
        .repair-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; padding-bottom: 10px; margin-bottom: 12px; }
        .repair-tag { background: #0f2b38; color: #73e2e0; font-weight: 800; font-size: 15px; padding: 4px 12px; border-radius: 6px; letter-spacing: 0.03em; }
        .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
        .badge-urgent { background: #fee2e2; color: #b91c1c; }
        .badge-high { background: #ffedd5; color: #c2410c; }
        .badge-normal { background: #e0f2fe; color: #0369a1; }
        .badge-status { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        .repair-grid { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .repair-grid td { padding: 5px 0; vertical-align: top; }
        .repair-grid td:first-child { color: #64748b; width: 30%; font-weight: 600; }
        .repair-grid td:last-child { color: #0f172a; font-weight: 500; }
        .btn { display: inline-block; background: #0f2b38; color: #73e2e0 !important; border: 1px solid #73e2e055; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 24px; text-align: center; }
        .email-footer { background: #f8fafc; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Kendat FixLap · Daily Morning Digest</h1>
            <p>8:00 AM Workshop Standby & Workload Reminder</p>
        </div>
        <div class="email-body">
            <h2 style="font-size: 19px; margin-top: 0; color: #0f172a;">Good morning, {{ $technician->name }}!</h2>
            
            <div class="alert-banner">
                <p><strong>Workload Notice:</strong> You have <strong>{{ $repairs->count() }} unfinished repair job{{ $repairs->count() === 1 ? '' : 's' }}</strong> currently assigned to your workbench. Please prioritize diagnostics, part installations, and client readiness so we can deliver to customers as soon as possible.</p>
            </div>

            <h3 style="font-size: 15px; color: #0f2b38; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;">
                Your Assigned Unfinished Repairs ({{ $repairs->count() }})
            </h3>

            @foreach ($repairs as $repair)
                <div class="repair-card">
                    <table style="width: 100%; margin-bottom: 8px;">
                        <tr>
                            <td>
                                <span class="repair-tag">#{{ $repair->tracking_number }}</span>
                                <strong style="margin-left: 10px; font-size: 15px; color: #0f172a;">{{ $repair->device_name }}</strong>
                            </td>
                            <td style="text-align: right;">
                                @if (strtolower($repair->priority) === 'urgent')
                                    <span class="badge badge-urgent">Urgent</span>
                                @elseif (strtolower($repair->priority) === 'high')
                                    <span class="badge badge-high">High</span>
                                @else
                                    <span class="badge badge-normal">{{ $repair->priority }}</span>
                                @endif
                                <span class="badge badge-status">{{ $repair->status }}</span>
                            </td>
                        </tr>
                    </table>

                    <table class="repair-grid">
                        <tr>
                            <td>Client</td>
                            <td>{{ $repair->customer_name }} · <a href="tel:{{ $repair->customer_phone }}" style="color: #0369a1; text-decoration: none;">{{ $repair->customer_phone }}</a></td>
                        </tr>
                        <tr>
                            <td>Category</td>
                            <td>{{ $repair->device_category }}</td>
                        </tr>
                        <tr>
                            <td>Reported Fault</td>
                            <td>{{ $repair->reported_issue }}</td>
                        </tr>
                        <tr>
                            <td>Due Date</td>
                            <td>
                                <strong style="color: {{ $repair->due_date && \Carbon\Carbon::parse($repair->due_date)->isPast() ? '#dc2626' : '#0f172a' }};">
                                    {{ $repair->due_date ? \Carbon\Carbon::parse($repair->due_date)->format('d M Y') : 'Immediate priority' }}
                                    @if ($repair->due_date && \Carbon\Carbon::parse($repair->due_date)->isPast())
                                        (Overdue)
                                    @endif
                                </strong>
                            </td>
                        </tr>
                        @if ($repair->diagnostic_notes)
                            <tr>
                                <td>Diagnostic Notes</td>
                                <td><em>{{ $repair->diagnostic_notes }}</em></td>
                            </tr>
                        @endif
                    </table>
                </div>
            @endforeach

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/staff/login" class="btn">Open Workbench & Update Repairs</a>
            </div>
        </div>
        <div class="email-footer">
            <p>Kendat FixLap Technical Operations · 8:00 AM Automated Morning Digest<br>Plot 12, Commercial Avenue, Ikeja, Lagos</p>
        </div>
    </div>
</body>
</html>
