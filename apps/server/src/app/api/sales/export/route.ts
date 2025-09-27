import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const ExportSchema = z.object({
  format: z.enum(['csv', 'excel']),
  search: z.string().optional(),
  filter: z.string().optional().transform(str => str ? JSON.parse(str) : {}),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ExportSchema.parse(Object.fromEntries(searchParams));
    
    const { format, search, filter } = query;
    
    let where: any = {};
    
    // Apply same filtering logic as the main GET endpoint
    if (search) {
      where.OR = [
        { order_id: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_email: { contains: search, mode: 'insensitive' } },
        { customer_phone: { contains: search, mode: 'insensitive' } },
        { product_name: { contains: search, mode: 'insensitive' } },
        { product_sku: { contains: search, mode: 'insensitive' } },
        { payment_method: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (filter.region && filter.region.length > 0) {
      where.region = { in: filter.region };
    }
    if (filter.payment_method && filter.payment_method.length > 0) {
      where.payment_method = { in: filter.payment_method };
    }
    if (filter.date_range) {
      where.order_date = {
        gte: new Date(filter.date_range.from),
        lte: new Date(filter.date_range.to),
      };
    }
    
    const data = await prisma.sales.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    
    // Format data for export
    const exportData = data.map(row => ({
      'Order ID': row.order_id,
      'Customer Name': row.customer_name,
      'Customer Email': row.customer_email,
      'Customer Phone': row.customer_phone,
      'Product Name': row.product_name,
      'Product SKU': row.product_sku,
      'Quantity': row.quantity,
      'Unit Price': row.unit_price.toString(),
      'Discount %': row.discount_percentage.toString(),
      'Total Amount': row.total_amount.toString(),
      'Payment Method': row.payment_method,
      'Order Date': row.order_date.toISOString().split('T')[0],
      'Delivery Date': row.delivery_date.toISOString().split('T')[0],
      'Region': row.region,
    }));
    
    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="sales-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
    
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Sales export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
