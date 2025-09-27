# 🚀 Business Intelligence Dashboard - User Guide

## 📋 What This Application Does

This is a **comprehensive Business Intelligence Dashboard** designed to help you manage, analyze, and report on your business data. Here's what it offers:

### 🎯 Core Features

#### 1. **Data Management**
- **Sales Tracking**: Manage 1000+ sales transactions with detailed customer and product information
- **Inventory Management**: Track 1000+ inventory items with stock levels, suppliers, and costs
- **Advanced Data Tables**: Professional tables with sorting, filtering, searching, and real-time editing

#### 2. **Business Analytics**
- **20+ Business Calculations**: Profit margins, ROI, customer metrics, inventory turnover, etc.
- **Real-time Metrics**: Live dashboard with key performance indicators
- **Interactive Calculator**: Customizable business calculations with multiple input parameters

#### 3. **Automated Reporting** ⭐
- **Hourly PDF Reports**: Automatically generated every hour
- **Email Delivery**: Reports sent to stakeholders
- **Manual Triggers**: Send reports on-demand for testing

## 🚀 How to Get Started

### 1. **Setup & Installation**
```bash
# Install dependencies
pnpm install

# Setup database
pnpm run db:migrate

# Seed with sample data (1000 rows each)
pnpm run db:seed

# Start the application
pnpm run dev
```

### 2. **Access the Dashboard**
- Open your browser to `http://localhost:3000`
- You'll be redirected to the dashboard automatically
- Use the sidebar to navigate between different sections

## 📊 Understanding Each Section

### 🏠 **Dashboard**
- **Overview**: Key metrics and KPIs at a glance
- **Recent Activity**: Latest sales transactions
- **Quick Stats**: Total revenue, inventory value, low stock alerts
- **Quick Actions**: Navigate to different sections

### 💰 **Sales Data**
- **View**: All sales transactions in a professional table
- **Features**:
  - Sort by any column (click headers)
  - Search across all fields
  - Filter by region, payment method, etc.
  - Export to CSV/Excel
  - Bulk operations (select multiple rows)
- **Data Includes**: Order ID, Customer info, Product details, Pricing, Discounts, Payment method, Dates, Region

### 📦 **Inventory Management**
- **View**: All inventory items with stock levels
- **Features**:
  - Track stock quantities and reorder levels
  - Monitor supplier information
  - View expiry dates and alerts
  - Calculate profit margins
- **Data Includes**: Product info, Stock levels, Costs, Suppliers, Expiry dates, Categories

### 🧮 **Business Calculator**
- **20+ Calculations** including:
  - **Financial Metrics**: ROI, Profit Margins, Break-even Analysis
  - **Customer Metrics**: Customer Lifetime Value, Acquisition Cost
  - **Inventory Metrics**: Turnover Rate, Carrying Cost
  - **Growth Metrics**: Revenue Growth, Market Share
- **Interactive**: Adjust input parameters and see real-time results

### 📈 **Reports & Automation**
- **Automated Reports**: Hourly PDF reports sent to `hello@sarg.io`
- **Manual Reports**: Send reports on-demand for testing
- **Email Logs**: Track all sent reports and their status
- **CRON Management**: Start/stop automated reporting

## 📧 How to Use the Reports Feature

### **Understanding the Reports System**

The reports feature is the **crown jewel** of this application. Here's how it works:

#### 1. **Automated Hourly Reports**
- **Schedule**: Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
- **Content**: PDF report with current business data
- **Delivery**: Automatically emailed to `hello@sarg.io`
- **Format**: Professional PDF with charts, tables, and summaries

#### 2. **Manual Report Testing**
- **Access**: Go to "Reports" in the sidebar
- **Send Test Report**: Click "Send Test Report Now" button
- **Recipient**: Defaults to `hello@sarg.io` (can be changed)
- **Real-time Status**: See sending progress and results

#### 3. **Report Content**
Each report includes:
- **Executive Summary**: Key metrics and insights
- **Sales Data**: Recent transactions and trends
- **Inventory Status**: Stock levels and alerts
- **Financial Metrics**: Revenue, profit, and growth data
- **Charts & Visualizations**: Data presented graphically

### **How to Test the Reports Feature**

#### Step 1: Check System Status
1. Go to the **Reports** page
2. Look for the system status indicators
3. Ensure all services are running (green checkmarks)

#### Step 2: Send a Test Report
1. Click **"Send Test Report Now"** button
2. Wait for the "Sending..." status
3. Check the result - should show "✅ Report sent successfully!"

#### Step 3: Verify Email Delivery
1. Check the email inbox for `hello@sarg.io`
2. Look for subject: "Hourly Business Report - [timestamp]"
3. Download and open the PDF attachment

#### Step 4: Check Email Logs
1. Scroll down to see recent email logs
2. View status of each sent report
3. See any error messages if delivery failed

### **Troubleshooting Reports**

#### If Reports Aren't Sending:
1. **Check Environment Variables**:
   ```bash
   # Make sure these are set in your .env file:
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   REPORT_RECIPIENT=hello@sarg.io
   ```

2. **Check Backend Server**:
   - Ensure the backend is running on port 3000
   - Check `/api/health` endpoint

3. **Check Email Configuration**:
   - Verify Gmail credentials
   - Ensure 2-factor authentication is enabled
   - Use App Password (not regular password)

## 🎯 Key Business Benefits

### **For Sales Teams**
- Track performance across regions
- Monitor customer acquisition and retention
- Analyze product performance and pricing

### **For Inventory Managers**
- Prevent stockouts with low stock alerts
- Optimize reorder levels
- Track supplier performance

### **For Executives**
- Get automated reports without manual work
- Monitor KPIs in real-time
- Make data-driven decisions

### **For Operations**
- Streamline data management
- Reduce manual reporting time
- Improve data accuracy

## 🔧 Advanced Features

### **Data Table Features**
- **Column Resizing**: Drag column borders to resize
- **Column Reordering**: Drag columns to reorder
- **Global Search**: Search across all fields simultaneously
- **Bulk Operations**: Select multiple rows for batch actions
- **Export Options**: CSV, Excel, PDF export
- **Keyboard Shortcuts**: Ctrl+F (search), Ctrl+A (select all), Delete (bulk delete)

### **Real-time Updates**
- **Live Data**: All data updates in real-time
- **Optimistic UI**: Changes appear immediately
- **Error Handling**: Graceful fallbacks for failed operations

### **Performance Features**
- **Virtual Scrolling**: Handles 1000+ rows efficiently
- **Server-side Pagination**: Fast loading with large datasets
- **Connection Pooling**: Robust database connections
- **Circuit Breaker**: Automatic recovery from failures

## 📱 Navigation Tips

### **Sidebar Navigation**
- **Dashboard**: Overview and quick actions
- **Sales**: Sales data and transactions
- **Inventory**: Stock management
- **Calculator**: Business calculations
- **Reports**: Automated reporting system

### **Quick Actions**
- Use the search bar to quickly find data
- Click column headers to sort
- Use the action buttons (Import, Export, Columns)
- Select rows for bulk operations

## 🎉 Getting the Most Out of the Application

1. **Start with the Dashboard** to get an overview
2. **Explore Sales Data** to understand your transactions
3. **Check Inventory** to see stock levels
4. **Use the Calculator** for business analysis
5. **Test the Reports** to see automated reporting in action

This application is designed to be your **one-stop solution** for business intelligence, data management, and automated reporting. The reports feature alone can save you hours of manual work by automatically generating and delivering professional business reports every hour!

---

**Need Help?** Check the README.md for technical setup details or explore the codebase to understand the implementation.
