import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const InventorySchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  product_sku: z.string(),
  category: z.string(),
  sub_category: z.string(),
  stock_quantity: z.number().int().min(0),
  reserved_quantity: z.number().int().min(0),
  reorder_level: z.number().int().min(0),
  unit_cost: z.number().positive(),
  selling_price: z.number().positive(),
  supplier_name: z.string(),
  supplier_contact: z.string(),
  last_restocked: z.string().transform(str => new Date(str)),
  expiry_date: z.string().transform(str => new Date(str)),
});

const QuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('50'),
  search: z.string().optional(),
  sort: z.string().optional(),
  filter: z.string().optional().transform(str => str ? JSON.parse(str) : {}),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    const { page, pageSize, search, sort, filter } = query;
    const skip = (page - 1) * pageSize;
    
    let where: any = {};
    
    // Global search across all fields
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
    
    // Apply filters
    if (filter.category && filter.category.length > 0) {
      where.category = { in: filter.category };
    }
    if (filter.sub_category && filter.sub_category.length > 0) {
      where.sub_category = { in: filter.sub_category };
    }
    if (filter.low_stock) {
      where.stock_quantity = { lte: prisma.inventory.fields.reorder_level };
    }
    
    // Parse sort
    let orderBy: any = { id: 'desc' };
    if (sort) {
      const [field, direction] = sort.split('.');
      orderBy = { [field]: direction || 'asc' };
    }
    
    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.inventory.count({ where }),
    ]);
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = InventorySchema.parse(body);
    
    const item = await prisma.inventory.create({
      data: validatedData,
    });
    
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Inventory POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
