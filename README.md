# Business Intelligence Dashboard

A production-ready Business Intelligence dashboard with advanced data tables, automated reporting, and real-time analytics.

## 🚀 Quick Setup (5 minutes)

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **pnpm** (recommended) or npm

### 1. Clone & Install

```bash
git clone <repository-url>
cd testing-assignment-sarg
pnpm install
```

### 2. Database Setup

```bash
# Start PostgreSQL (if not running)
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Linux

# Create database
createdb business_intelligence
```

### 3. Environment Configuration

Create `.env` file in `apps/web/`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/business_intelligence"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (for reports)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
REPORT_RECIPIENT="hello@sarg.io"
```

### 4. Database Migration & Seeding

```bash
# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Seed with 1000 rows each table
pnpm run db:seed

# Verify data (should show 1000 each)
pnpm run db:studio
```

### 5. Start Development

```bash
# Start the application
pnpm run dev
```

**🎉 Done!** Visit [http://localhost:3000](http://localhost:3000)

---

## ✨ Key Features

### 📊 **Advanced Data Tables**

- **@tanstack/react-table** with full feature set
- Column resizing, reordering, show/hide
- Server-side pagination (50 rows/page)
- Global search across all 14 fields
- Multi-column sorting and filtering
- Virtualized rows for 1000+ records
- Inline cell editing with optimistic updates
- Bulk actions and keyboard shortcuts
- Export to CSV/Excel

### 📧 **Automated Reporting**

- **Hourly CRON job** (runs at minute 0)
- PDF generation using Puppeteer
- Email delivery to `hello@sarg.io`
- Manual trigger with real-time status
- Comprehensive email logging

### 🏗️ **Production Infrastructure**

- **PostgreSQL** with connection pooling
- **Prisma ORM** with 14 columns per table
- Retry logic with exponential backoff
- Circuit breaker pattern
- Health monitoring endpoint
- **Exactly 1000 rows** seeded per table

### 🧮 **Business Calculator**

- **20+ calculations** including:
  - Profitability metrics (Gross Profit, ROI, Margins)
  - Financial ratios (Current Ratio, Debt-to-Equity)
  - Customer metrics (LTV/CAC, Churn Rate)
  - Inventory metrics (Turnover, DSO)
  - Growth and productivity indicators

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **PostgreSQL** + **Prisma ORM**
- **@tanstack/react-table** + **@tanstack/react-virtual**
- **Tailwind CSS** + **shadcn/ui**
- **Better Auth** for authentication
- **Puppeteer** for PDF generation
- **Nodemailer** for email delivery

## 📁 Project Structure

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── sales/     # Sales CRUD + Export
│   │   │   ├── inventory/ # Inventory CRUD + Export
│   │   │   ├── health/    # DB Health Check
│   │   │   ├── crons/     # CRON Job Management
│   │   │   └── reports/   # Report Generation
│   │   ├── dashboard/     # Main Dashboard
│   │   ├── sales/         # Sales Data Table
│   │   ├── inventory/     # Inventory Data Table
│   │   ├── calculator/    # Business Calculator
│   │   └── reports/       # Report Management
│   ├── components/
│   │   ├── data-table/    # Advanced Data Table
│   │   └── ui/            # shadcn/ui Components
│   └── lib/
│       ├── dbPool.ts      # Connection Pool + Circuit Breaker
│       ├── prisma.ts      # Prisma Client
│       └── reportGenerator.ts # PDF + Email
├── prisma/
│   └── schema/            # Database Schema
└── seed/
    └── seed.ts            # 1000 rows per table
```

## 🎯 Quick Demo

### 1. **Data Tables** (`/sales`, `/inventory`)

- Resize columns by dragging borders
- Use **Ctrl+F** for global search
- **Ctrl+A** to select all rows
- Sort multiple columns (Shift+click)
- Export filtered data to CSV/Excel

### 2. **Automated Reports** (`/reports`)

- Click "Start CRON" to enable hourly reports
- "Send Report Now" for immediate test
- View email logs and delivery status

### 3. **Business Calculator** (`/calculator`)

- Modify input parameters
- View 20+ real-time calculations
- Explore different metric categories

### 4. **System Health** (`/api/health`)

- Database connection status
- Pool metrics and circuit breaker state

## 🔧 API Reference

### Core Endpoints

- `GET /api/health` - System health & database status
- `GET /api/sales` - Paginated sales data with search/filter
- `GET /api/inventory` - Paginated inventory data
- `POST /api/sales/bulk` - Bulk operations (update/delete)
- `GET /api/sales/export` - Export CSV/Excel

### Reports & Automation

- `GET /api/crons/sendReport?action=start` - Start hourly CRON
- `GET /api/crons/sendReport?action=stop` - Stop CRON
- `POST /api/reports/manualSend` - Send report immediately

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Verify connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### Email Not Sending

1. Check Gmail app password setup
2. Verify `.env` variables
3. Test with manual send in `/reports`

#### CRON Job Not Running

1. Check server logs
2. Verify Puppeteer installation
3. Test report generation manually

### Health Checks

```bash
# System status
curl http://localhost:3000/api/health

# Data validation
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sales;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM inventory;"
```

## 📊 Database Schema

#### Sales Table (14 columns)

```sql
id, order_id, customer_name, customer_email, customer_phone,
product_name, product_sku, quantity, unit_price, discount_percentage,
total_amount, payment_method, order_date, delivery_date, region
```

#### Inventory Table (14 columns)

```sql
id, product_id, product_name, product_sku, category, sub_category,
stock_quantity, reserved_quantity, reorder_level, unit_cost,
selling_price, supplier_name, supplier_contact, last_restocked, expiry_date
```

## 🏆 Production Features

✅ **Advanced Data Tables** - Full @tanstack/react-table implementation  
✅ **Automated Reporting** - Hourly CRON with PDF generation  
✅ **Database Resilience** - Connection pooling + circuit breaker  
✅ **Real-time Analytics** - 20+ business calculations  
✅ **Production Security** - Input validation + authentication  
✅ **Performance Optimized** - Virtualized tables + server-side pagination  

**Ready for Production** 🚀
