# FixLab Full-Stack Architecture & Developer Guide

FixLab is an enterprise device-repair management platform designed for multi-branch workshop operations, real-time client tracking, parts inventory control, technician task queues, and invoice/payment processing.

The project is decoupled into a modern **Frontend (React 19, TypeScript, Vite)** and **Backend (Laravel 11 REST API, MariaDB / MySQL `fixlab_db`, Laravel Sanctum)**.

---

## 1. Directory Structure

```text
fixlap/
├── backend/                       # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/  # REST API Controllers (Auth, Repairs, Inventory, etc.)
│   │   └── Models/                # Eloquent Models (18 tables)
│   ├── config/                    # Config (CORS, Sanctum, Database)
│   ├── database/
│   │   ├── migrations/            # Scalable MySQL Schema Migrations
│   │   └── seeders/               # DatabaseSeeder with enterprise test records
│   ├── routes/
│   │   └── api.php                # Token-protected API routes
│   └── .env                       # DB: fixlab_db, root@127.0.0.1
│
├── frontend/                      # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/client.ts          # Typed REST API Client & Auth Token handler
│   │   ├── features/
│   │   │   ├── auth/              # Staff Login & Role Session
│   │   │   ├── client/            # Client Portal (Repairs, Invoices, Messages, Paystack)
│   │   │   ├── dashboard/         # Admin & Technician Workspaces (Repairs, Inventory, Reports)
│   │   │   └── landing/           # Responsive Marketing Website
│   │   ├── App.tsx                # History API SPA Routing
│   │   └── main.tsx               # Application Entrypoint
│   ├── vite.config.ts             # Vite config with /api proxy to Laravel (127.0.0.1:8000)
│   └── package.json               # Frontend dependencies & scripts
│
├── package.json                   # Root orchestrator scripts (run dev, backend, dev:all)
└── PROJECT_GUIDE.md               # Architecture, Schema, and Operational Guide
```

---

## 2. Seeded Accounts & Credentials

The system comes pre-seeded with 10 accounts and realistic workshop records:

| Role | Account Name | Email | Password | Access Portal |
| --- | --- | --- | --- | --- |
| **Administrator** | Alex Doe | `admin@fixlab.com` | `password` | `/staff/login` → Administrator |
| **Technician** | Jordan Malik | `repairer@fixlab.com` | `password` | `/staff/login` → Technician |
| **Client** | Sarah Johnson | `client@fixlab.com` | `password` | `/client/login` |

*Note: Sarah's active referral code is `SARAH200`. Invoices, messages, and repair history are linked to both user ID and email.*

---

## 3. Database Schema & Scalability Design

The database is built on **MariaDB / MySQL** using database `fixlab_db` with `utf8mb4_unicode_ci` and 191-character index compatibility.

### Enterprise Features:
1. **Multi-Organization & Multi-Branch Support**:
   - `organizations` and `branches` tables allow the system to scale across multiple service centers or franchises.
2. **User Roles & Profiles**:
   - `users` table with indexed `role` (`admin`, `repairer`, `client`), `status`, `phone`, `referral_code`, and `deleted_at` (soft deletes).
   - `technician_profiles` (skills, specialties, performance rating, availability status).
   - `client_profiles` (loyalty points, notes, wallet balance).
3. **Workflow & Auditing**:
   - `repairs` table with auto-generated indexed `tracking_number` (`FL-1048`), stage progression indices, priority tags, and financial estimates.
   - `repair_timeline_events` records every state transition with timestamps and acting user for enterprise compliance.
   - `repair_notes` provides internal workshop logs and customer-visible notes.
4. **Inventory & Parts Management**:
   - `inventory_categories` and `inventory_items` with SKU, stock quantity, reorder thresholds, unit cost, and retail pricing.
   - `repair_parts_used` links parts consumed during bench repairs with quantity and cost.
   - `inventory_transactions` provides immutable stock ledger entries (`purchase`, `usage`, `adjustment`, `return`).
5. **Invoices & Payments**:
   - `invoices` and `invoice_items` for itemized parts and labor billing.
   - `payments` records transaction references (e.g. Paystack `ref`), payment methods, status, and verification metadata.
6. **Communication & Viral Growth**:
   - `message_threads` and `messages` for direct technician-client messaging.
   - `referrals` with referral bonus tracking and conversion status.
   - `activity_logs` for enterprise security auditing.

---

## 4. How to Run the Application

### Option A: From Workspace Root (Recommended)

From `/opt/lampp/htdocs/fixlap`:

```bash
# Run both Frontend and Laravel Backend concurrently
npm run dev:all

# Or run separately in two terminals:
npm run backend    # Starts Laravel API on http://127.0.0.1:8000
npm run dev        # Starts Vite Frontend on http://localhost:5174
```

### Option B: Running Individually

#### 1. Backend (Laravel API)
```bash
cd /opt/lampp/htdocs/fixlap/backend
php artisan serve --host=0.0.0.0 --port=8000
```
API endpoints will be live on all network interfaces at `http://0.0.0.0:8000/api` (e.g., `http://192.168.1.190:8000/api` or `http://localhost:8000/api`).

#### 2. Frontend (React 19 + Vite)
```bash
cd /opt/lampp/htdocs/fixlap/frontend
npm run dev
```
Or from root:
```bash
npm run dev
```
Access the application locally at `http://localhost:5174` or across the local network/devices at `http://<your-ip>:5174` (e.g. `http://192.168.1.190:5174`).

---

## 4.1 Dynamic IP & Cross-Site Origin (CORS) Architecture

FixLab is built to support dynamic network environments where users, staff, and clients access the application from different IPs, devices, or domains:

1. **Server Bindings (`0.0.0.0`)**:
   - Both the Laravel backend and Vite frontend listen on `0.0.0.0` instead of `127.0.0.1`, exposing them to localhost, WiFi/Ethernet LAN IPs (e.g. `192.168.1.190`), and external network interfaces.
2. **Dynamic Frontend API Base URL**:
   - `frontend/src/api/client.ts` includes `getApiBaseUrl()` and `resolveApiUrl()`.
   - In browser environments, it dynamically detects `window.location.hostname` (e.g., `${window.location.protocol}//${window.location.hostname}:8000`) so any client visiting `http://<any-ip>:5174` automatically routes API traffic to the corresponding backend IP on port 8000.
   - An optional `VITE_API_URL` environment variable is supported to override with a custom domain or reverse proxy if needed.
3. **Dynamic Cross-Origin Resource Sharing (CORS)**:
   - In `backend/config/cors.php`, `allowed_origins_patterns` is set to `['#.*#']` and `supports_credentials` is set to `true`.
   - Laravel dynamically echoes the requesting client's `Origin` in `Access-Control-Allow-Origin` and enables `Access-Control-Allow-Credentials: true`, allowing browsers on different IPs, mobile devices, and ports to make cross-origin API calls without CORS blocks.
4. **Sanctum Dynamic Stateful Domains**:
   - `backend/config/sanctum.php` uses `Sanctum::currentRequestHost()` so cookie/session-based checks adapt dynamically to whatever IP or domain requests the API.

---

## 5. Database Commands (`mysql -u root`)

- Direct MySQL access:
  ```bash
  /opt/lampp/bin/mysql -u root fixlab_db
  ```
- Re-run migrations and re-seed sample data:
  ```bash
  cd /opt/lampp/htdocs/fixlap/backend
  php artisan migrate:fresh --seed
  ```
- Inspect latest repairs in MySQL:
  ```bash
  /opt/lampp/bin/mysql -u root fixlab_db -e "SELECT id, tracking_number, customer_name, device_name, status, estimate_amount FROM repairs ORDER BY id DESC LIMIT 10;"
  ```

---

## 6. Key Routes & Features

| Route | Functionality |
| --- | --- |
| `/` | Landing page with responsive navigation, social icons, brand trust, and service details. |
| `/staff/login` | Role-based staff authentication (Admin / Technician) issuing Laravel Sanctum tokens. |
| `/staff/admin` | Full workshop pulse, assignment desk, technician availability, parts inventory, reports & CSV export. |
| `/staff/repairer` | Bench technician queue, scheduled appointments, status updater, internal diagnostic notes. |
| `/client/login` | Client authentication, account creation with referral codes, password recovery. |
| `/client/dashboard` | Client repair tracker, live timeline, Paystack checkout, invoice viewer, print-to-PDF, and technician chat. |
| `/referral/<code>` | Direct referral link onboarding new clients. |

---

## 7. Paystack Payments Architecture

Paystack is integrated for online card, bank transfer, and USSD payments:

- **Backend Environment** (`backend/.env`):
  All Paystack credentials are kept exclusively on the backend:
  ```env
  PAYSTACK_BASE_URL=https://api.paystack.co
  PAYSTACK_PUBLIC_KEY=pk_test_placeholder_key
  PAYSTACK_SECRET_KEY=sk_test_placeholder_key
  ```
- **Frontend**:
  The frontend contains **no hardcoded keys or env files**. It dynamically loads the active public key from the backend (`GET /api/payments/config`) at runtime.
- **Endpoints**:
  - `GET /api/payments/config`: Dynamically retrieves active public key for client popup checkout.
  - `POST /api/payments/initialize`: Initializes transactions with metadata directly on Paystack.
  - `POST /api/payments/verify`: Verifies reference with Paystack API, updates repair status to `In progress`, marks linked invoice as `Paid`, and records transaction ledger entry.
  - `POST /api/payments/webhook`: Webhook listener with HMAC SHA512 signature validation for background charge event handling.

---

## 8. Production Build & Deployment

To generate optimized production bundles:
```bash
cd /opt/lampp/htdocs/fixlap/frontend
npm run build
```
The compiled SPA is located in `frontend/dist/`.
For production Apache / Nginx setups:
1. Configure Apache VirtualHost or Nginx to point to `/opt/lampp/htdocs/fixlap/backend/public` for backend `/api` requests.
2. Serve `frontend/dist` for frontend requests with SPA fallback to `index.html`.

