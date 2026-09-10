<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class TechnicianController extends Controller
{
    public function index(): JsonResponse
    {
        $technicians = User::where('role', 'repairer')
            ->with(['technicianProfile', 'assignedRepairs' => fn ($q) => $q->active()])
            ->get();

        $formatted = $technicians->map(function ($tech) {
            $profile = $tech->technicianProfile;
            $activeJobs = $tech->assignedRepairs->count();

            return [
                'id' => "tech-{$tech->id}",
                'dbId' => $tech->id,
                'name' => $tech->name,
                'email' => $tech->email,
                'phone' => $tech->phone ?? '',
                'specialty' => $profile?->specialty ?? 'General repairs',
                'specialties' => $this->parseSpecialties($profile?->specialty),
                'available' => (bool) ($profile?->is_available ?? true),
                'activeJobs' => $activeJobs,
                'rating' => (float) ($profile?->rating ?? 5.0),
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|max:191|unique:users,email',
            'phone' => 'required|string|max:50',
            'specialty' => 'required',
            'available' => 'nullable|boolean',
        ]);

        $specialtyString = $this->normalizeSpecialty($request->input('specialty'));

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => 'repairer',
            'password' => bcrypt('password'),
        ]);

        $profile = TechnicianProfile::create([
            'user_id' => $user->id,
            'specialty' => $specialtyString,
            'is_available' => $request->boolean('available', true),
            'rating' => 5.0,
        ]);

        return response()->json([
            'message' => "Technician {$user->name} added successfully.",
            'technician' => [
                'id' => "tech-{$user->id}",
                'dbId' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'specialty' => $profile->specialty,
                'specialties' => $this->parseSpecialties($profile->specialty),
                'available' => (bool) $profile->is_available,
                'activeJobs' => 0,
                'rating' => 5.0,
            ],
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $cleanId = str_replace('tech-', '', $id);
        $user = User::where('id', $cleanId)->where('role', 'repairer')->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:191',
            'email' => "required|email|max:191|unique:users,email,{$cleanId}",
            'phone' => 'required|string|max:50',
            'specialty' => 'required',
            'available' => 'nullable|boolean',
        ]);

        $specialtyString = $this->normalizeSpecialty($request->input('specialty'));

        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;
        $user->save();

        $profile = $user->technicianProfile ?? new TechnicianProfile(['user_id' => $user->id]);
        $profile->specialty = $specialtyString;
        if ($request->has('available')) {
            $profile->is_available = $request->boolean('available');
        }
        $profile->save();

        $activeJobs = $user->assignedRepairs()->active()->count();

        return response()->json([
            'message' => "Technician {$user->name} updated successfully.",
            'technician' => [
                'id' => "tech-{$user->id}",
                'dbId' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'specialty' => $profile->specialty,
                'specialties' => $this->parseSpecialties($profile->specialty),
                'available' => (bool) $profile->is_available,
                'activeJobs' => $activeJobs,
                'rating' => (float) ($profile->rating ?? 5.0),
            ],
        ]);
    }

    private function normalizeSpecialty(mixed $specialty): string
    {
        if (is_array($specialty)) {
            $filtered = array_values(array_filter(array_map('trim', $specialty)));
            return ! empty($filtered) ? implode(', ', $filtered) : 'General repairs';
        }

        $trimmed = trim((string) $specialty);

        return ! empty($trimmed) ? $trimmed : 'General repairs';
    }

    private function parseSpecialties(?string $specialty): array
    {
        if (empty($specialty)) {
            return ['General repairs'];
        }
        $parts = array_values(array_filter(array_map('trim', explode(',', $specialty))));

        return ! empty($parts) ? $parts : ['General repairs'];
    }

    public function destroy(string $id): JsonResponse
    {
        $cleanId = str_replace('tech-', '', $id);
        $user = User::where('id', $cleanId)->where('role', 'repairer')->firstOrFail();

        // Safely unassign all open repairs so work orders remain intact
        Repair::where('technician_id', $cleanId)
            ->whereNotIn('status', ['Completed', 'Cancelled'])
            ->update(['technician_id' => null]);

        $name = $user->name;
        $user->delete();

        return response()->json([
            'message' => "Technician {$name} deleted successfully.",
            'id' => "tech-{$cleanId}",
        ]);
    }

    public function toggleAvailability(string $id): JsonResponse
    {
        $cleanId = str_replace('tech-', '', $id);
        $user = User::where('id', $cleanId)->where('role', 'repairer')->firstOrFail();

        $profile = $user->technicianProfile ?? new TechnicianProfile(['user_id' => $user->id]);
        $profile->is_available = ! $profile->is_available;
        $profile->save();

        return response()->json([
            'message' => "Availability for {$user->name} updated to " . ($profile->is_available ? 'Available' : 'Unavailable') . '.',
            'technician' => [
                'id' => "tech-{$user->id}",
                'name' => $user->name,
                'available' => (bool) $profile->is_available,
            ],
        ]);
    }

    public function sendDailyReminders(): JsonResponse
    {
        Artisan::call('repairs:send-daily-reminders');
        $output = Artisan::output();

        return response()->json([
            'message' => 'Daily morning technician reminders dispatched successfully.',
            'output' => trim($output),
        ]);
    }
}

