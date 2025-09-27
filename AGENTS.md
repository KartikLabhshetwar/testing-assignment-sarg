You are an expert full-stack engineer whose mission is to implement a complete Business Intelligence dashboard using Next.js (App Router), PostgreSQL, Prisma, Tailwind + shadcn/ui and @tanstack/react-table. Follow the assignment requirements precisely. Prioritize Feature #4 (Advanced Data Table / CRUD) and Feature #6 (Hourly CRON report emailed to hello@sarg.io). Deliver production-minded code with comments, tests where useful, and a clear README.

General rules:
1. Always protect dashboard routes with authentication (NextAuth or JWT). Use bcrypt for password hashing.
2. Use Prisma as ORM. Use pg.Pool for explicit connection pooling and advanced resilience handling where necessary. Provide a `/api/health` endpoint showing DB pool status.
3. All DB operations must include retry logic (exponential backoff up to 3 retries), automatic reconnection handling, and a circuit breaker pattern for database calls.
4. Seed exactly **1000 rows** in each of the two required tables (Sales & Customer Data and Inventory & Supplier Data). Validate counts after seeding.
5. Provide a working CRON job (node-cron) that runs every hour at minute 0 and emails a generated PDF report to `hello@sarg.io`. Include a manual trigger endpoint for testing.
6. And most importantly: implement a polished, highly-capable, **advanced data table** UI with all features listed in the assignment. This is the highest priority for scoring.

Project skeleton (create these files/folders first):
/app
  /(auth)/login/page.tsx
  /(auth)/register/page.tsx
  /(protected)/dashboard/page.tsx
  /(protected)/sales/page.tsx
  /(protected)/inventory/page.tsx
  /(protected)/calculator/page.tsx
  /(protected)/reports/page.tsx
  /api/auth/[...nextauth].ts
  /api/health/route.ts
  /api/crons/sendReport.ts
  /api/reports/manualSend.ts
/components
/lib
  /db.ts
  /prisma.ts
  /dbPool.ts
/prisma/schema.prisma
/seed/seed.ts
/scripts/generate-seed-data.ts
/.env
README.md

ENV variables (required):
DATABASE_URL=postgres://user:pass@host:5432/dbname
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=app-password
REPORT_RECIPIENT=hello@sarg.io
REDIS_URL=redis://localhost:6379  # optional for queue/caching

Database & Prisma schema (exactly 14 columns per table):
- Place this in `prisma/schema.prisma`. Ensure types map to the assignment column types.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Sales {
  id                   Int     @id @default(autoincrement())
  order_id             String  @unique
  customer_name        String
  customer_email       String
  customer_phone       String
  product_name         String
  product_sku          String
  quantity             Int
  unit_price           Decimal @db.Decimal(12,2)
  discount_percentage  Decimal @db.Decimal(5,2)
  total_amount         Decimal @db.Decimal(12,2)
  payment_method       String
  order_date           DateTime
  delivery_date        DateTime
  region               String

  @@map("sales")
}

model Inventory {
  id                Int     @id @default(autoincrement())
  product_id        String  @unique
  product_name      String
  product_sku       String
  category          String
  sub_category      String
  stock_quantity    Int
  reserved_quantity Int
  reorder_level     Int
  unit_cost         Decimal @db.Decimal(12,2)
  selling_price     Decimal @db.Decimal(12,2)
  supplier_name     String
  supplier_contact  String
  last_restocked    DateTime
  expiry_date       DateTime

  @@map("inventory")
}
````

Connection pooling + resilience (lib/dbPool.ts):

* Use `pg` Pool configured with Min=2, Max=10, connectionTimeoutMillis=5000, idleTimeoutMillis=10000.
* Wrap queries inside an `executeWithRetry` helper with exponential backoff (3 retries).
* Add event listeners to monitor `connect`, `error`, `acquire`, `remove`.
* Add a circuit breaker wrapper (use `opossum` or custom): open breaker after `n` failures, attempt reset after interval.
* For Prisma: create `lib/prisma.ts` -> instantiate `PrismaClient` and also subscribe to query logs; but use the pg Pool for lower-level pool metrics. If Prisma-specific pool settings are needed, document limitations and use pg Pool for raw needs.

Example snippet for pg Pool:

```javascript
// lib/dbPool.ts
import { Pool } from 'pg';
import opossum from 'opossum';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  // maxUses: 7500 (optional, if using node-postgres v8+)
});

pool.on('connect', () => console.log('pg connected'));
pool.on('error', (err) => console.error('pg pool error', err));

export async function executeWithRetry(queryText, params = [], retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(queryText, params);
        client.release();
        return res;
      } catch (err) {
        client.release();
        throw err;
      }
    } catch (err) {
      attempt++;
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

const breakerOptions = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

export const dbBreaker = new opossum(executeWithRetry, breakerOptions);
dbBreaker.fallback(() => ({ rows: [], warning: 'db circuit open - returning empty result' }));
dbBreaker.on('open', () => console.warn('DB circuit opened'));
```

Health endpoint `/api/health`:

* Return JSON with:

  * pool.totalCount, pool.idleCount, pool.waitingCount
  * boolean dbConnected
  * circuitBreaker state
* Example: GET `/api/health` => `{ status: 'ok', db: { total: 5, idle: 3 }, circuit: 'close' }`

Seeding exactly 1000 rows each:

* Use `faker` (or @faker-js/faker) to generate realistic names, emails, phones, products, SKUs, suppliers, realistic dates, regions, categories.
* Seed script must check inserted counts and throw if not exactly 1000.

Example `seed/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient();

async function seedSales() {
  const rows = [];
  for (let i = 0; i < 1000; i++) {
    const qty = faker.datatype.number({ min: 1, max: 10 });
    const unit = faker.commerce.price(10, 1000, 2);
    const discount = faker.datatype.number({ min: 0, max: 30 });
    const total = (qty * Number(unit)) * (1 - discount / 100);
    rows.push({
      order_id: `ORD-${2025}-${String(i+1).padStart(4,'0')}`,
      customer_name: faker.name.fullName(),
      customer_email: faker.internet.email(),
      customer_phone: faker.phone.number(),
      product_name: faker.commerce.productName(),
      product_sku: `PROD-${faker.string.alphanumeric(6).toUpperCase()}`,
      quantity: qty,
      unit_price: Number(unit),
      discount_percentage: discount,
      total_amount: Number(total.toFixed(2)),
      payment_method: faker.helpers.arrayElement(['Cash','Card','Online']),
      order_date: faker.date.past({ years: 1 }),
      delivery_date: faker.date.soon({ days: 14 }),
      region: faker.helpers.arrayElement(['North','South','East','West'])
    });
  }
  await prisma.sales.createMany({ data: rows });
}

// Similarly seed inventory 1000 rows
// After seeding, validate counts:
const salesCount = await prisma.sales.count();
if (salesCount !== 1000) throw new Error('sales seed count mismatch');
```

Authentication:

* Use NextAuth with Credentials provider or custom JWT.
* On register: hash password with bcrypt (salt rounds = 10).
* Protect all pages in `(protected)` with a server side session check (middleware or layout) and redirect to login.

Feature #4 — **ADVANCED DATA TABLE / CRUD** (Priority: 1)
Follow these steps and implement each sub-feature fully. This section must be exceptionally detailed and completed early.

A. Data flow & API:

* Build RESTful API for Sales and Inventory:

  * `/api/sales` -> GET (paginated), POST (create), PUT `/api/sales/:id` (update), DELETE `/api/sales/:id`
  * `/api/sales/bulk` -> POST for bulk updates/deletes/import
  * Support global search across all 14 fields (server-side, indexed).
  * Provide endpoints for export (CSV/Excel/PDF) and import mapping preview.
* APIs must respect connection resilience wrappers (use `dbBreaker` and `executeWithRetry`).

B. Frontend table component (Sales and Inventory pages):

* Use `@tanstack/react-table` with:

  * Column resizing (`enableResizing: true`, `minSize`, `maxSize`)
  * Column show/hide controls
  * Column reorder via drag-and-drop (use `@dnd-kit/sortable`)
  * Column pinning (left/right)
  * Column grouping support
  * Multi-column sort
  * Column filters (per column) and global search (debounced 300ms)
  * Pagination — server-side with 50 rows per page
  * Virtualization for performance (use `@tanstack/react-virtual` or `react-window`) — necessary for 1000+ rows
  * Inline cell editing (use editable cell renderer, react-hook-form + validation)
  * Row expansion to show details
  * Bulk actions with checkboxes, select all, and batch delete/update
  * Export filtered dataset to CSV/Excel (use `papaparse` & `sheetjs/xlsx`)

C. Column resizing persistence:

* Save per-user preferences via API:

  * Endpoint: `POST /api/user/preferences/table` accepts `{ tableId, prefs }`
  * Save `columnWidths`, `hiddenColumns`, `order`, `pinnedColumns`, `density`, `pageSize`, `filters`, `sorting`
* Fallback: persist to `localStorage` as `table-prefs-${userId}-${tableId}` for offline.
* Implement double-click auto-fit (measure cell contents and set width) and enforce min/max.

D. Keyboard shortcuts:

* Implement global listeners (component mount) for:

  * Ctrl+F to focus global search
  * Ctrl+A to select all rows on current page
  * Delete to delete selected rows (with confirmation)
  * Enter to edit selected cell
  * Escape to cancel edit
  * Ctrl+C / Ctrl+V cell copy/paste (use clipboard API; support multi-cell copy as CSV)
  * Provide a help overlay listing shortcuts

E. Inline editing & optimistic updates:

* Editing a cell triggers immediate optimistic UI update locally.
* Fire PATCH request; on error, rollback state and show inline error message.
* Validate inputs (numbers, decimals, date ranges) on client before sending.

F. Advanced filtering & filter builder:

* Column filters: text, select, date-range picker, numeric-range slider
* Filter builder UI: allow combining filters with AND / OR; store as JSON filter DSL and send to API
* Save filter presets by name in `user_preferences` table

G. Row features:

* Expandable rows show linked items, notes, audit log
* Conditional formatting: e.g., total_amount > threshold => highlight green
* Sticky summary row showing sum/avg/min/max; can be pinned

H. Import & Export:

* Import CSV/Excel:

  * Show column mapping UI, validate required fields (if any), show preview (first 10 rows), and confirm.
  * Use worker to process large files
* Export:

  * CSV/Excel/PDF export of filtered dataset
  * Preserve formatting (date/currency) in exports

I. Cell comments & collaboration:

* Cell comment data stored in `cell_comments` table with user, timestamp, content
* Tooltip shows comments preview; click to open comments thread
* Provide audit log for changes

J. Performance & UX:

* Debounce searches (300ms)
* Use loading skeletons
* Show error boundaries and graceful fallbacks
* Virtualized rows with row height estimation for good scroll performance

K. Accessibility:

* Ensure keyboard nav works across cells
* ARIA attributes for table & interactive elements

L. Tests:

* Unit test table utilities
* Integration test API endpoints for CRUD, bulk actions, import/export

Feature #6 — **CRON JOB & PDF EMAIL REPORTS** (Priority: 2)
Implement robust hourly reporting with logging and manual trigger.

A. Scheduling:

* Use `node-cron` on server side `server-only` route:

  * Cron schedule: `0 * * * *` (every hour at minute 0)
* Create a server task that:

  * Runs DB queries to fetch the configured report data
  * Uses saved report configuration if available
  * Renders a headless HTML route or a React server-rendered page representing the report

B. PDF generation:

* Use Puppeteer (recommended) to render the report route (`/reports/render?id=...`) into PDF ensuring:

  * Cover page with timestamp & report id
  * Executive summary (top metrics)
  * Drag-order preserved table (pull `rowOrder` config from DB)
  * Custom elements inserted (dividers, labels, footnotes)
  * Charts included as PNG/SVG (render client-side, then ensure they are present in HTML before screenshot)
* Example:

```js
// /lib/reportGenerator.ts
import puppeteer from 'puppeteer';
export async function generatePdfReport(reportId, htmlUrl) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(htmlUrl, { waitUntil: 'networkidle2' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdfBuffer;
}
```

C. Email sending:

* Use `nodemailer` with Gmail SMTP and `GMAIL_USER` / `GMAIL_APP_PASSWORD`.
* Email subject: `"Hourly Business Report - [ISO Timestamp]"`
* Body: short summary and link to download (attach PDF)
* Store email logs in `email_logs` table: `{ id, to, subject, timestamp, status, error }`

D. Manual trigger endpoint:

* `POST /api/reports/manualSend` -> accepts report config id -> generates PDF and emails immediately. Return logs and result.

E. Error handling & retry:

* If email fails, retry exponential backoff 3 times.
* Queue failed send operations to Redis for background retry.
* Log every send attempt with timestamp and error details if any.

F. Testing:

* Provide a UI button in Reports page labeled “Send test report now” that hits the manual send endpoint and shows real-time status.

Report configuration & drag-and-drop preservation:

* Allow users to create and save report templates (tableConfig JSON).
* When generating PDF, read `tableConfig.rowOrder` to render table rows in that order.

Security & monitoring:

* Sanitize all inputs.
* Use rate-limiting for manual send endpoint.
* Ensure nodemailer credentials are secret and not committed.

Developer checklist & step-by-step build plan (follow in order):
0. `git init`, create branches `setup`, `auth`, `db`, `ui-table`, `cron-report`, `polish`.

1. Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui.
2. Setup Prisma, create schema (paste above), run `npx prisma migrate dev`.
3. Implement pg Pool and `lib/dbPool.ts` with retry/circuit breaker.
4. Build `/api/health` and test pool metrics.
5. Implement authentication (register/login) and protect routes; test session flows.
6. Add seed script and run `npm run seed`; verify `SELECT COUNT(*)` for both tables equals 1000.
7. Build basic CRUD APIs for Sales & Inventory (paginated, search).
8. Implement core frontend table with @tanstack/react-table: pagination, sorting, column filters, server-side data.
9. Implement virtual scrolling and inline editing with optimistic updates.
10. Add column resizing, reorder, show/hide, pinning, and persist preferences via API + localStorage fallback.
11. Implement bulk actions, import/export, and the filter builder.
12. Implement advanced features: comments, audit log, undo/redo for edits (in-memory command stack).
13. Implement calculator page (pull from DB for choices) and implement at least 20 calculations (each as a separate function that can be combined). Expose saved configs.
14. Implement report template UI: drag-and-drop table (dnd-kit), save config.
15. Implement PDF generation via Puppeteer and cron job that triggers the generation + email send. Add manual trigger endpoint.
16. Add logs for email sends; implement retries & queue if send fails.
17. Add README with instructions, env, migrations, seed, starting cron locally and how to view logs.
18. Final polish: responsive styles, accessibility, error handling, tests and commit history.

Example API snippets:

* GET paginated sales:
  `GET /api/sales?page=1&pageSize=50&sort=order_date.desc&search=keyword&filter={"region":["North","East"]}`

* POST create sale (validate all fields server-side with Zod or Yup).

Export implementation:

* CSV: server side run of query -> stream to CSV via `papaparse` or `json2csv`.
* Excel: use `xlsx` to build workbook and send as attachment.

Important UX details (to include on UI):

* Loading skeletons and spinner for heavy operations.
* Graceful read-only mode during DB outages: show cached data and banner "Read-only — recovering from DB issue".
* User-friendly error messages for DB connection issues (map technical errors to friendly messages).

Deliverables after 2 hours:

* Working app locally with all features above.
* Seeded DB with 1000 rows each.
* Cron job test proof: logs showing an hourly run or example manual run.
* README with commands:

  * `npm install`
  * `npx prisma migrate dev`
  * `npm run seed`
  * `npm run dev`
  * `npm run cron` (if needed for local cron)
* Demonstration instructions to show email delivery to `hello@sarg.io`.

If anything cannot be fully implemented in the time you have, prioritize:

1. Feature #4 advanced table features (minimum: column resizing + persistence, inline edit, pagination, virtual scrolling, export).
2. Feature #6 cron + manual triggering + PDF generation + email sending.
3. DB resilience and seeding 1000 rows.

Finish by running basic end-to-end checks:

* Login -> Open Sales table -> verify 50 rows/page -> resize column and reload -> preference persists.
* Edit a cell -> optimistic UI -> persisted to DB.
* Click "Send test report" -> check `email_logs` and inbox for `hello@sarg.io` (or captured logs if SMTP blocked).
* Visit `/api/health` and ensure `status: ok`.

Be explicit while coding: include comments explaining retry logic, circuit breaker thresholds, and why chosen UI/UX decisions suit heavy datasets. Always log meaningful errors, but never leak secrets.

Now start building: create files, write migrations, seed DB, implement APIs, then implement the advanced table UI and cron report flow in that order. Focus on reliability, testability, and delivering the two prioritized features fully.
