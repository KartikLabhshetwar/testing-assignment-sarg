import puppeteer from 'puppeteer';

interface ReportData {
  salesData: any[];
  inventoryData: any[];
  summary: {
    totalSalesAmount: number;
    totalSalesCount: number;
    lowStockCount: number;
  };
  generatedAt: string;
}

export async function generatePdfReport(reportData: ReportData): Promise<Buffer> {
  console.log('Starting PDF generation for report data');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    
    try {
      const page = await browser.newPage();
      
      // Set a reasonable timeout
      page.setDefaultTimeout(30000);
      
      // Generate HTML content
      const htmlContent = generateReportHTML(reportData);
      
      console.log('Setting HTML content and generating PDF...');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      });
      
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Fallback: return a simple text-based report if PDF generation fails
    console.log('Falling back to text-based report');
    const textReport = generateTextReport(reportData);
    return Buffer.from(textReport, 'utf-8');
  }
}

function generateTextReport(data: ReportData): string {
  return `
BUSINESS INTELLIGENCE REPORT
Generated: ${data.generatedAt}

SUMMARY:
- Total Sales Amount: $${data.summary.totalSalesAmount.toLocaleString()}
- Total Sales Count: ${data.summary.totalSalesCount.toLocaleString()}
- Low Stock Items: ${data.summary.lowStockCount}

RECENT SALES (Top 10):
${data.salesData.slice(0, 10).map(sale => 
  `${sale.order_id} | ${sale.customer_name} | ${sale.product_name} | $${Number(sale.total_amount).toFixed(2)}`
).join('\n')}

INVENTORY STATUS (Top 10):
${data.inventoryData.slice(0, 10).map(item => 
  `${item.product_sku} | ${item.product_name} | Stock: ${item.stock_quantity} | Status: ${item.stock_quantity <= 10 ? 'Low Stock' : 'In Stock'}`
).join('\n')}

This is a text-based report generated as a fallback.
For the full PDF report, please check the system logs.
  `;
}

function generateReportHTML(data: ReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Business Intelligence Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary h3 {
          margin-top: 0;
          color: #007bff;
        }
        .metric {
          display: inline-block;
          margin: 10px 20px 10px 0;
          padding: 10px 15px;
          background: white;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        .metric-label {
          font-size: 14px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .section {
          margin: 30px 0;
        }
        .section h3 {
          color: #007bff;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Business Intelligence Report</h1>
        <p>Generated on: ${new Date(data.generatedAt).toLocaleString()}</p>
      </div>

      <div class="summary">
        <h3>Key Metrics</h3>
        <div class="metric">
          <div class="metric-value">$${data.summary.totalSalesAmount.toLocaleString()}</div>
          <div class="metric-label">Total Sales Amount</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.summary.totalSalesCount.toLocaleString()}</div>
          <div class="metric-label">Total Sales Count</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.summary.lowStockCount}</div>
          <div class="metric-label">Low Stock Items</div>
        </div>
      </div>

      <div class="section">
        <h3>Recent Sales (Top 10)</h3>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total Amount</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.salesData.slice(0, 10).map(sale => `
              <tr>
                <td>${sale.order_id}</td>
                <td>${sale.customer_name}</td>
                <td>${sale.product_name}</td>
                <td>${sale.quantity}</td>
                <td>$${Number(sale.total_amount).toFixed(2)}</td>
                <td>${new Date(sale.order_date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Inventory Status (Top 10)</h3>
        <table>
          <thead>
            <tr>
              <th>Product SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock Qty</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.inventoryData.slice(0, 10).map(item => `
              <tr>
                <td>${item.product_sku}</td>
                <td>${item.product_name}</td>
                <td>${item.category}</td>
                <td>${item.stock_quantity}</td>
                <td>${item.reorder_level}</td>
                <td style="color: ${item.stock_quantity <= item.reorder_level ? 'red' : 'green'}">
                  ${item.stock_quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This report was automatically generated by the Business Intelligence Dashboard</p>
        <p>For questions or support, contact the development team</p>
      </div>
    </body>
    </html>
  `;
}