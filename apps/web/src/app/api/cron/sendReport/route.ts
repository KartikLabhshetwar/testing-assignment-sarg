import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/emailService';
import Papa from 'papaparse';

// Secure the cron endpoint
function verifyCronSecret(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set, allowing request (development mode)');
    return true;
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    if (!verifyCronSecret(request)) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Starting hourly report generation...');
    
    // Generate timestamp for report
    const reportTimestamp = new Date().toISOString();
    const reportDate = new Date().toISOString().split('T')[0];
    
    // Fetch sales data
    const salesData = await prisma.sales.findMany({
      orderBy: { order_date: 'desc' },
      take: 1000, // Limit to 1000 most recent records
    });
    
    // Fetch inventory data
    const inventoryData = await prisma.inventory.findMany({
      orderBy: { last_restocked: 'desc' },
      take: 1000, // Limit to 1000 most recent records
    });
    
    // Generate summary statistics
    const salesSummary = {
      totalSales: salesData.length,
      totalRevenue: salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
      averageOrderValue: salesData.length > 0 
        ? salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / salesData.length 
        : 0,
      topRegion: salesData.reduce((acc, sale) => {
        acc[sale.region] = (acc[sale.region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    const inventorySummary = {
      totalItems: inventoryData.length,
      totalValue: inventoryData.reduce((sum, item) => sum + (item.stock_quantity * Number(item.unit_cost)), 0),
      lowStockItems: inventoryData.filter(item => item.stock_quantity <= item.reorder_level).length,
      expiringSoon: inventoryData.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
    };
    
    // Format sales data for CSV
    const salesCsvData = salesData.map(sale => ({
      'Order ID': sale.order_id,
      'Customer Name': sale.customer_name,
      'Customer Email': sale.customer_email,
      'Customer Phone': sale.customer_phone,
      'Product Name': sale.product_name,
      'Product SKU': sale.product_sku,
      'Quantity': sale.quantity,
      'Unit Price': sale.unit_price.toString(),
      'Discount %': sale.discount_percentage.toString(),
      'Total Amount': sale.total_amount.toString(),
      'Payment Method': sale.payment_method,
      'Order Date': sale.order_date.toISOString().split('T')[0],
      'Delivery Date': sale.delivery_date.toISOString().split('T')[0],
      'Region': sale.region,
    }));
    
    // Format inventory data for CSV
    const inventoryCsvData = inventoryData.map(item => ({
      'Product ID': item.product_id,
      'Product Name': item.product_name,
      'Product SKU': item.product_sku,
      'Category': item.category,
      'Sub Category': item.sub_category,
      'Stock Quantity': item.stock_quantity,
      'Reserved Quantity': item.reserved_quantity,
      'Reorder Level': item.reorder_level,
      'Unit Cost': item.unit_cost.toString(),
      'Selling Price': item.selling_price.toString(),
      'Supplier Name': item.supplier_name,
      'Supplier Contact': item.supplier_contact,
      'Last Restocked': item.last_restocked.toISOString().split('T')[0],
      'Expiry Date': item.expiry_date.toISOString().split('T')[0],
    }));
    
    // Generate CSV content
    const salesCsv = Papa.unparse(salesCsvData);
    const inventoryCsv = Papa.unparse(inventoryCsvData);
    
    // Create summary report
    const summaryReport = `
BUSINESS INTELLIGENCE REPORT - ${reportDate}
Generated at: ${reportTimestamp}

SALES SUMMARY:
- Total Sales Records: ${salesSummary.totalSales}
- Total Revenue: $${salesSummary.totalRevenue.toLocaleString()}
- Average Order Value: $${salesSummary.averageOrderValue.toFixed(2)}
- Top Region: ${Object.entries(salesSummary.topRegion).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}

INVENTORY SUMMARY:
- Total Items: ${inventorySummary.totalItems}
- Total Inventory Value: $${inventorySummary.totalValue.toLocaleString()}
- Low Stock Items: ${inventorySummary.lowStockItems}
- Items Expiring Soon (30 days): ${inventorySummary.expiringSoon}

This report contains the most recent 1000 records from each table.
CSV files are attached for detailed analysis.
    `.trim();
    
    // Prepare email content
    const emailSubject = `Hourly Business Report - ${reportDate}`;
    const emailHtml = `
      <h2>Business Intelligence Report</h2>
      <p><strong>Generated:</strong> ${reportTimestamp}</p>
      
      <h3>Sales Summary</h3>
      <ul>
        <li>Total Sales Records: ${salesSummary.totalSales}</li>
        <li>Total Revenue: $${salesSummary.totalRevenue.toLocaleString()}</li>
        <li>Average Order Value: $${salesSummary.averageOrderValue.toFixed(2)}</li>
        <li>Top Region: ${Object.entries(salesSummary.topRegion).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</li>
      </ul>
      
      <h3>Inventory Summary</h3>
      <ul>
        <li>Total Items: ${inventorySummary.totalItems}</li>
        <li>Total Inventory Value: $${inventorySummary.totalValue.toLocaleString()}</li>
        <li>Low Stock Items: ${inventorySummary.lowStockItems}</li>
        <li>Items Expiring Soon (30 days): ${inventorySummary.expiringSoon}</li>
      </ul>
      
      <p>Please find the detailed CSV files attached to this email.</p>
    `;
    
    // Send email with CSV attachments
    const emailResult = await sendEmail({
      to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `sales-report-${reportDate}.csv`,
          content: salesCsv,
          contentType: 'text/csv',
        },
        {
          filename: `inventory-report-${reportDate}.csv`,
          content: inventoryCsv,
          contentType: 'text/csv',
        },
        {
          filename: `summary-report-${reportDate}.txt`,
          content: summaryReport,
          contentType: 'text/plain',
        },
      ],
    });
    
    // Log the email send attempt
    await prisma.emailLogs.create({
      data: {
        to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
        subject: emailSubject,
        status: emailResult.success ? 'sent' : 'failed',
        error: emailResult.error || null,
      },
    });
    
    console.log('Hourly report sent successfully:', emailResult);
    
    return NextResponse.json({
      success: true,
      message: 'Report sent successfully',
      timestamp: reportTimestamp,
      summary: {
        salesRecords: salesSummary.totalSales,
        inventoryRecords: inventorySummary.totalItems,
        totalRevenue: salesSummary.totalRevenue,
        totalInventoryValue: inventorySummary.totalValue,
      },
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    
    // Log the error
    try {
      await prisma.emailLogs.create({
        data: {
          to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
          subject: 'Hourly Business Report - FAILED',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trigger } = body;
    
    if (trigger !== 'manual') {
      return NextResponse.json(
        { error: 'Invalid trigger. Use { "trigger": "manual" }' },
        { status: 400 }
      );
    }
    
    // Call the GET handler for manual trigger
    return await GET(request);
    
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual trigger failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
