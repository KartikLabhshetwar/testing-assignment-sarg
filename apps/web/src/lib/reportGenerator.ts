import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import prisma from './prisma';

export async function generatePdfReport(reportId: string, htmlUrl: string): Promise<Buffer> {
  console.log('Starting PDF generation for URL:', htmlUrl);
  
  // Validate URL
  if (!htmlUrl || !htmlUrl.startsWith('http')) {
    throw new Error(`Invalid URL provided: ${htmlUrl}`);
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  });
  
  try {
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    page.setDefaultTimeout(30000);
    
    console.log('Navigating to URL:', htmlUrl);
    await page.goto(htmlUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
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
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await browser.close();
  }
}

export async function sendEmailReport(to: string, subject: string, pdfBuffer: Buffer, summary: string) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    html: `
      <h2>Business Intelligence Report</h2>
      <p>Please find your hourly business report attached.</p>
      <h3>Summary:</h3>
      <p>${summary}</p>
      <p>Generated at: ${new Date().toISOString()}</p>
    `,
    attachments: [
      {
        filename: `business-report-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  let attempt = 0;
  const maxRetries = 3;
  
  while (attempt < maxRetries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      
      // Log successful email
      await prisma.emailLogs.create({
        data: {
          to,
          subject,
          status: 'sent',
          timestamp: new Date(),
        },
      });
      
      return info;
    } catch (error) {
      attempt++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt === maxRetries) {
        // Log failed email
        await prisma.emailLogs.create({
          data: {
            to,
            subject,
            status: 'failed',
            error: errorMessage,
            timestamp: new Date(),
          },
        });
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

export async function generateReportSummary(): Promise<string> {
  const [salesCount, inventoryCount, recentSales] = await Promise.all([
    prisma.sales.count(),
    prisma.inventory.count(),
    prisma.sales.findMany({
      where: {
        order_date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        total_amount: true
      }
    })
  ]);

  const totalRevenue = recentSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const avgOrderValue = recentSales.length > 0 ? totalRevenue / recentSales.length : 0;

  return `
    <strong>Key Metrics (Last 24 Hours):</strong><br/>
    • Total Sales Records: ${salesCount.toLocaleString()}<br/>
    • Total Inventory Items: ${inventoryCount.toLocaleString()}<br/>
    • Recent Orders: ${recentSales.length}<br/>
    • Total Revenue: $${totalRevenue.toFixed(2)}<br/>
    • Average Order Value: $${avgOrderValue.toFixed(2)}
  `;
}
