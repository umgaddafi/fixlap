<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Repair;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $currentYear = (int) date('Y');
        $currentMonth = (int) date('n');

        $year = $request->filled('year') ? (int) $request->query('year') : $currentYear;
        $month = $request->filled('month') ? (int) $request->query('month') : $currentMonth;

        // Ensure month is within 1 - 12
        $month = max(1, min(12, $month));

        // Start and end of the chosen month
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = (clone $startOfMonth)->endOfMonth();

        // 1. Period-Specific Jobs
        $periodRepairs = Repair::whereBetween('created_at', [$startOfMonth, $endOfMonth])->get();
        $periodTotalJobs = $periodRepairs->count();
        $periodCompletedJobs = $periodRepairs->where('status', 'Completed')->count();
        $periodInProgressJobs = $periodRepairs->where('status', 'In progress')->count();
        $periodAwaitingPartsJobs = $periodRepairs->where('status', 'Awaiting parts')->count();
        $periodReadyForPickupJobs = $periodRepairs->where('status', 'Ready for pickup')->count();
        $periodNewJobs = $periodRepairs->where('status', 'New')->count();

        $periodCompletionRate = $periodTotalJobs > 0 ? round(($periodCompletedJobs / $periodTotalJobs) * 100) : 0;
        $periodQuoted = (float) $periodRepairs->sum('estimate_amount');

        // Revenue made in period: sum of paid repairs in period + payments received
        $paidRepairsRevenue = (float) $periodRepairs->where('is_paid', true)->sum('estimate_amount');
        $paymentsRevenue = (float) Payment::where('status', 'success')
            ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');
        $periodRevenue = max($paidRepairsRevenue, $paymentsRevenue);

        // If completed repairs have positive estimates, reflect realistic revenue if payments haven't been processed via gateway
        $completedEstimateValue = (float) $periodRepairs->where('status', 'Completed')->sum('estimate_amount');
        if ($periodRevenue == 0 && $completedEstimateValue > 0) {
            $periodRevenue = $completedEstimateValue;
        }

        // 2. All-Time Totals
        $allTimeTotal = Repair::count();
        $allTimeCompleted = Repair::where('status', 'Completed')->count();
        $allTimeRevenue = (float) Repair::where('is_paid', true)->sum('estimate_amount');

        // 3. Status breakdown in period
        $statusCounts = [
            'New' => $periodNewJobs,
            'In progress' => $periodInProgressJobs,
            'Awaiting parts' => $periodAwaitingPartsJobs,
            'Ready for pickup' => $periodReadyForPickupJobs,
            'Completed' => $periodCompletedJobs,
        ];

        // 4. Device Category Breakdown in period
        $categories = ['Phone', 'Laptop', 'Tablet', 'Other'];
        $categoryBreakdown = [];
        foreach ($categories as $cat) {
            $count = $periodRepairs->where('device_category', $cat)->count();
            $categoryBreakdown[$cat] = [
                'count' => $count,
                'percentage' => $periodTotalJobs > 0 ? round(($count / $periodTotalJobs) * 100) : 0,
            ];
        }

        // 5. 12-Month Trend for the Selected Year (for Line and Bar charts)
        $monthlyTrend = [];
        for ($m = 1; $m <= 12; $m++) {
            $mStart = Carbon::create($year, $m, 1)->startOfMonth();
            $mEnd = (clone $mStart)->endOfMonth();

            $mRepairs = Repair::whereBetween('created_at', [$mStart, $mEnd])->get();
            $mTotal = $mRepairs->count();
            $mCompleted = $mRepairs->where('status', 'Completed')->count();
            $mPaidRevenue = (float) $mRepairs->where('is_paid', true)->sum('estimate_amount');
            $mPaymentRev = (float) Payment::where('status', 'success')->whereBetween('paid_at', [$mStart, $mEnd])->sum('amount');
            $mCompletedValue = (float) $mRepairs->where('status', 'Completed')->sum('estimate_amount');
            $mRev = max($mPaidRevenue, $mPaymentRev);
            if ($mRev == 0 && $mCompletedValue > 0) {
                $mRev = $mCompletedValue;
            }

            $monthlyTrend[] = [
                'monthNumber' => $m,
                'month' => $mStart->format('M'),
                'fullMonth' => $mStart->format('F'),
                'totalJobs' => $mTotal,
                'completedJobs' => $mCompleted,
                'revenue' => $mRev,
            ];
        }

        // 6. Individual Technician Performance for Selected Period
        $technicians = User::where('role', 'repairer')
            ->with(['technicianProfile', 'assignedRepairs'])
            ->get();

        $technicianPerformance = $technicians->map(function ($tech) use ($startOfMonth, $endOfMonth) {
            $profile = $tech->technicianProfile;
            $techRepairs = $tech->assignedRepairs()
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->get();

            $totalAssigned = $techRepairs->count();
            $completed = $techRepairs->where('status', 'Completed')->count();
            $active = $totalAssigned - $completed;
            $completionRate = $totalAssigned > 0 ? round(($completed / $totalAssigned) * 100) : 0;

            // Revenue generated by this technician
            $techRev = (float) $techRepairs->where('is_paid', true)->sum('estimate_amount');
            $techCompletedVal = (float) $techRepairs->where('status', 'Completed')->sum('estimate_amount');
            $revenueGenerated = max($techRev, $techCompletedVal);

            $specialties = !empty($profile?->specialty)
                ? array_values(array_filter(array_map('trim', explode(',', $profile->specialty))))
                : ['General repairs'];

            return [
                'id' => "tech-{$tech->id}",
                'name' => $tech->name,
                'email' => $tech->email,
                'phone' => $tech->phone ?? '',
                'specialty' => $profile?->specialty ?? 'General repairs',
                'specialties' => $specialties,
                'available' => (bool) ($profile?->is_available ?? true),
                'assignedJobs' => $totalAssigned,
                'completedJobs' => $completed,
                'activeJobs' => $active,
                'revenueGenerated' => $revenueGenerated,
                'completionRate' => $completionRate,
            ];
        })->sortByDesc('revenueGenerated')->values();

        // 7. Available Years for Filter
        $firstRepair = Repair::orderBy('created_at', 'asc')->first();
        $minYear = $firstRepair ? (int) $firstRepair->created_at->format('Y') : ($currentYear - 2);
        $availableYears = range(min($minYear, $currentYear - 2), max($currentYear, $year));
        rsort($availableYears);

        return response()->json([
            'filter' => [
                'month' => $month,
                'year' => $year,
                'monthName' => $startOfMonth->format('F'),
                'isCurrentMonth' => ($month === $currentMonth && $year === $currentYear),
            ],
            'availableYears' => $availableYears,
            'periodSummary' => [
                'totalJobs' => $periodTotalJobs,
                'completedJobs' => $periodCompletedJobs,
                'activeJobs' => $periodTotalJobs - $periodCompletedJobs,
                'completionRate' => $periodCompletionRate,
                'totalQuoted' => $periodQuoted,
                'revenue' => $periodRevenue,
            ],
            'allTime' => [
                'totalJobs' => $allTimeTotal,
                'completedJobs' => $allTimeCompleted,
                'revenue' => $allTimeRevenue,
            ],
            'statusCounts' => $statusCounts,
            'categoryBreakdown' => $categoryBreakdown,
            'monthlyTrend' => $monthlyTrend,
            'technicianPerformance' => $technicianPerformance,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $year = $request->query('year');
        $month = $request->query('month');

        $query = Repair::query();
        if ($year) {
            $query->whereYear('created_at', (int) $year);
        }
        if ($month) {
            $query->whereMonth('created_at', (int) $month);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="fixlab_repairs_report_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Tracking #', 'Customer', 'Email', 'Phone', 'Device', 'Category', 'Issue', 'Status', 'Priority', 'Estimate (₦)', 'Paid', 'Due Date', 'Created At']);

            $query->chunk(100, function ($repairs) use ($handle) {
                foreach ($repairs as $r) {
                    fputcsv($handle, [
                        $r->tracking_number,
                        $r->customer_name,
                        $r->customer_email,
                        $r->customer_phone,
                        $r->device_name,
                        $r->device_category,
                        $r->reported_issue,
                        $r->status,
                        $r->priority,
                        $r->estimate_amount,
                        $r->is_paid ? 'Yes' : 'No',
                        $r->due_date,
                        $r->created_at ? $r->created_at->format('Y-m-d H:i:s') : '',
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
