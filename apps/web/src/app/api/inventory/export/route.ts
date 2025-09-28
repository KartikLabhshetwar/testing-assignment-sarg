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
        { product_id: { contains: search, mode: 'insensitive' } },
        { product_name: { contains: search, mode: 'insensitive' } },
        { product_sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { sub_category: { contains: search, mode: 'insensitive' } },
        { supplier_name: { contains: search, mode: 'insensitive' } },
        { supplier_contact: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (filter.category && filter.category.length > 0) {
      where.category = { in: filter.category };
    }
    if (filter.supplier_name && filter.supplier_name.length > 0) {
      where.supplier_name = { in: filter.supplier_name };
    }
    if (filter.stock_range) {
      where.stock_quantity = {
        gte: filter.stock_range.min,
        lte: filter.stock_range.max,
      };
    }
    
    const data = await prisma.inventory.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    
    // Format data for export
    const exportData = data.map(row => ({
      'Product ID': row.product_id,
      'Product Name': row.product_name,
      'Product SKU': row.product_sku,
      'Category': row.category,
      'Sub Category': row.sub_category,
      'Stock Quantity': row.stock_quantity,
      'Reserved Quantity': row.reserved_quantity,
      'Reorder Level': row.reorder_level,
      'Unit Cost': row.unit_cost.toString(),
      'Selling Price': row.selling_price.toString(),
      'Supplier Name': row.supplier_name,
      'Supplier Contact': row.supplier_contact,
      'Last Restocked': row.last_restocked.toISOString().split('T')[0],
      'Expiry Date': row.expiry_date.toISOString().split('T')[0],
    }));
    
    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
    
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Inventory export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
