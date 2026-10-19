# India Labour Law Library

> **Statutory Intelligence & Verified Gazette Repository**  
> A searchable, subscription-oriented legal intelligence platform for Indian central and state labour legislation.

---

## 1. System Overview & Legal Integrity Philosophy

The **India Labour Law Library** provides an authoritative, auditable repository of Indian labour legislation. Built to eliminate compliance ambiguity, the platform indexes:
- The **4 Central Labour Codes** enacted by the Parliament of India (Code on Wages 2019, Industrial Relations Code 2020, Code on Social Security 2020, Occupational Safety, Health and Working Conditions Code 2020).
- Key **Central Legacy Statutes** (Minimum Wages Act 1948, EPF Act 1952, Factories Act 1948, Maternity Benefit Act 1961, Payment of Gratuity Act 1972).
- Primary **State Enactments** (e.g. Maharashtra Shops & Establishments Act 2017, Karnataka Shops Act 1961, Delhi Shops Act 1954).
- Subordinate **Draft Rules** undergoing legislative/tripartite consultation.

### Transparency & Verification Policy
- **No Hallucinated Laws**: All indexed statutes, dates, numbers, and gazette citations reflect official publications from [eGazette of India](https://egazette.gov.in), [India Code](https://www.indiacode.nic.in), and the Ministry of Labour and Employment ([MoLE](https://labour.gov.in)).
- **Explicit Lifecycle Statuses**: Every enactment is strictly categorized under one of five legal statuses:
  1. `verified` (Active law cross-referenced with primary gazette copies)
  2. `draft` (Published subordinate rules open for consultation or awaiting notification)
  3. `pending_verification` (Enactments undergoing legal editorial verification)
  4. `superseded` (Legacy statutes being consolidated into newer Codes upon notification)
  5. `archived` (Historical legal reference documents)
- **Missing Information Disclosure**: The system automatically computes and flags pending notifications, unrecorded numbers, or missing enforcement dates.

---

## 2. Technology Stack & Design Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime** | Node.js v24 LTS | Modern performance, ES modules & CommonJS support. |
| **Backend Framework** | Express.js | Mature, lightweight REST API architecture. |
| **Relational Database** | `node:sqlite` (DatabaseSync) | Native zero-dependency SQLite with Write-Ahead Logging (`WAL`), ACID compliance, foreign key constraints, and 100% portable file-based backup. |
| **Frontend Architecture** | Responsive SPA | Glassmorphism design system in Vanilla CSS, Google Fonts (`Outfit`, `Inter`, `Lora`), zero frontend build friction, SEO-optimized markup. |
| **Security & Auth** | Node Crypto (`scrypt`) + JWT | Server-side role-based authorization (`admin`, `editor`, `subscriber`, `guest`), salted password hashing, timing-safe equality verification. |
| **Test Suite** | `node:test` + `node:assert/strict` | 28 automated tests covering search, RBAC, schema validation, and lifecycle transitions. |

---

## 3. Relational Database Schema

The database utilizes SQLite with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`.

```
users
 ├── id (TEXT PK)
 ├── email (TEXT UNIQUE NOT NULL)
 ├── password_hash (TEXT NOT NULL)
 ├── salt (TEXT NOT NULL)
 ├── full_name (TEXT NOT NULL)
 ├── role ('admin' | 'editor' | 'subscriber' | 'guest')
 ├── subscription_tier ('free' | 'pro' | 'enterprise')
 ├── subscription_status ('active' | 'trialing' | 'past_due' | 'cancelled')
 └── created_at, updated_at

legal_documents
 ├── id (TEXT PK)
 ├── slug (TEXT UNIQUE NOT NULL)
 ├── title (TEXT NOT NULL)
 ├── short_title (TEXT NOT NULL)
 ├── document_number (TEXT)
 ├── document_type ('code' | 'act' | 'rules' | 'notification' | 'amendment')
 ├── jurisdiction ('central' | 'state')
 ├── state (TEXT NOT NULL)
 ├── issuing_authority (TEXT NOT NULL)
 ├── subject_category (TEXT NOT NULL)
 ├── publication_date (TEXT ISO YYYY-MM-DD)
 ├── effective_date (TEXT ISO YYYY-MM-DD NULL)
 ├── legal_status ('draft' | 'pending_verification' | 'verified' | 'superseded' | 'archived')
 ├── superseded_by_id (TEXT FK -> legal_documents.id)
 ├── official_source_url (TEXT NOT NULL)
 ├── official_citation (TEXT NOT NULL)
 ├── verification_status ('verified' | 'unverified' | 'disputed')
 ├── last_verified_date (TEXT ISO NULL)
 ├── verified_by_user_id (TEXT FK -> users.id)
 ├── missing_fields (TEXT JSON)
 ├── summary (TEXT NOT NULL)
 ├── full_text (TEXT NOT NULL)
 ├── download_url (TEXT)
 └── created_at, updated_at

document_sections
 ├── id (TEXT PK)
 ├── document_id (TEXT FK -> legal_documents.id CASCADE)
 ├── section_number (TEXT NOT NULL)
 ├── title (TEXT NOT NULL)
 ├── content (TEXT NOT NULL)
 └── order_index (INTEGER NOT NULL)

document_amendments
 ├── id (TEXT PK)
 ├── document_id (TEXT FK -> legal_documents.id CASCADE)
 ├── amending_act_title (TEXT NOT NULL)
 ├── notification_number (TEXT)
 ├── amendment_date (TEXT ISO)
 ├── description (TEXT NOT NULL)
 └── source_url (TEXT)

verification_audit_log
 ├── id (TEXT PK)
 ├── document_id (TEXT FK -> legal_documents.id CASCADE)
 ├── user_id (TEXT FK -> users.id)
 ├── action (TEXT NOT NULL)
 ├── previous_status (TEXT)
 ├── new_status (TEXT)
 ├── notes (TEXT)
 └── created_at (TEXT ISO)
```

---

## 4. Getting Started & Local Setup

### Prerequisites
- Node.js >= 22.0.0 (Node 24 LTS recommended)
- npm >= 10.0.0

### Step 1: Clone and Install Dependencies
```bash
cd "labour laws app"
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` contents:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=labour_law_library_secure_jwt_dev_key_89234892384923
DB_PATH=./data/labour_laws.db
BACKUP_DIR=./backups
```

### Step 3: Seed the Database
Populate verified Indian labour statutes, codifications, sections, and default test accounts:
```bash
npm run db:seed
```

### Step 4: Run the Application
```bash
npm start
```
Open your browser to: **`http://localhost:5000`**

---

## 5. Automated Testing

Run the full automated test suite containing 28 tests across 4 domains:
```bash
npm test
```

### Test Coverage Highlights:
- **`server/tests/search.test.js`**: Keyword search, multi-field indexing, jurisdiction filtering (central vs state), state specific lookup (Maharashtra, Karnataka, Delhi), supersession relationships, and section sequencing.
- **`server/tests/permissions.test.js`**: Timing-safe scrypt password authentication, JWT token payload signing, role-based authorization for administrative routes, unauthenticated rejection (401), subscriber restriction (403), and subscription tier gating (Free vs Pro vs Enterprise).
- **`server/tests/validation.test.js`**: Input sanitization, mandatory field checks, enum validation for document types and legal statuses, ISO date formatting, and automated detection of missing statutory fields.
- **`server/tests/lifecycle.test.js`**: End-to-end document status transitions (`draft` &rarr; `pending_verification` &rarr; `verified` &rarr; `superseded` &rarr; `archived`) and immutable audit history logging.

---

## 6. Default Demo Credentials

For demonstration and testing, the application includes pre-configured accounts:

| Role | Email | Password | Tier | Permissions |
|---|---|---|---|---|
| **Chief Registrar (Admin)** | `admin@labourlaws.in` | `Admin@12345!` | Enterprise | Full admin console, document creation, editing, status changes, deletions, database backups. |
| **Senior Editor** | `editor@labourlaws.in` | `Editor@12345!` | Pro | Admin console access, document creation, editing, gazette verification. |
| **Pro Corporate HR** | `pro@subscriber.in` | `Subscriber@12345!` | Pro | Full search, statutory text downloads, state comparison, amendment timeline. |
| **Free Researcher** | `free@subscriber.in` | `FreeUser@12345!` | Free | Search, document reader, gazette source links. |

*Quick test profile buttons are available directly inside the Sign In modal in the UI.*

---

## 7. Operational Runbook: Backups & Disaster Recovery

### Automated Backup Command
Execute an on-demand snapshot of the active SQLite database with automated integrity check:
```bash
npm run db:backup
```
- Snapshot destination: `./backups/labour_laws_backup_<timestamp>.db`
- Runs `PRAGMA integrity_check` automatically before confirming success.

### Administrative UI Backup
Administrators can also trigger instant backups from the **Admin Registry** dashboard header button: `💾 Trigger Database Backup`.

### Restoring from Backup
To restore the platform to a previous snapshot:
1. Stop the application server: `kill <pid>` or `Ctrl + C`.
2. Replace `./data/labour_laws.db` with the chosen snapshot:
   ```bash
   cp ./backups/labour_laws_backup_2026-10-19T07-59-30-139Z.db ./data/labour_laws.db
   ```
3. Restart the server: `npm start`.

---

## 8. Security & Web Vulnerability Hardening

1. **Authentication**: Passwords are hashed using Node's cryptographic `scryptSync` with unique 16-byte random salts. Verification employs constant-time buffer comparison (`crypto.timingSafeEqual`) to defeat timing attacks.
2. **Server-Enforced Authorization**: Roles and subscription tiers are checked on the server middleware. Client tokens cannot spoof permissions.
3. **SQL Injection Defense**: 100% of database queries use parameterized SQL statements (`?` placeholders).
4. **XSS & Injection Protection**: Inputs are sanitized and trimmed; HTML entities are escaped in document rendering.
5. **Security Headers**: Standard headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin` are enforced on all HTTP responses.
6. **Environment Variable Isolation**: Secrets are kept out of source control via `.env` and `.gitignore`.

---

## 9. Production Deployment Guide

### Deployment via Docker / Linux Container
Create a `Dockerfile`:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "server/index.js"]
```

### Deployment via systemd (Ubuntu / Debian Linux)
Create `/etc/systemd/system/labour-law-library.service`:
```ini
[Unit]
Description=India Labour Law Library Service
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/var/www/labour-laws-app
ExecStart=/usr/bin/node /var/www/labour-laws-app/server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=JWT_SECRET=replace_with_high_entropy_prod_secret

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl enable labour-law-library
sudo systemctl start labour-law-library
```

---

## 10. Subscription Architecture & Billing Extension

The platform is engineered with a subscription-ready schema:
- **Tiers**: `free`, `pro`, `enterprise`.
- **Statuses**: `active`, `trialing`, `past_due`, `cancelled`.
- **Gating**: Endpoints and UI capabilities check the subscriber's tier and status.
- **Webhook Integration Point**: To integrate Razorpay / Stripe billing webhooks, add an endpoint `POST /api/webhooks/billing` that verifies the webhook signature and updates the `users` table `subscription_tier` and `subscription_status` fields based on `invoice.paid` or `subscription.cancelled` events.

---

## 11. Maintenance & Verification Protocol for New Legislation

When the Central Government or a State Government gazettes a new notification:
1. **Log in** with an Editor or Admin account.
2. Click **Admin Registry &rarr; Register New Enactment**.
3. Input the official citation, gazette notification number, and link to the official `.gov.in` PDF.
4. Mark the document as `pending_verification` or `draft` until cross-checked with the official Gazette of India Extraordinary publication.
5. Once verified, click **Verify & Publish** to add a verifiable timestamp and registrar signature to the public library.

---

## 12. License & Legal Disclaimer

This software is licensed under the ISC License.  
**Disclaimer:** The statutory texts and summaries indexed in this library are for educational, research, and compliance reference. They do not constitute formal legal counsel. For statutory enforcement, refer directly to notifications published in the Official Gazette of India (`egazette.gov.in`).
