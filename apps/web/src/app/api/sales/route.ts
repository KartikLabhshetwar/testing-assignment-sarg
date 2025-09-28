import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { dbBreaker } from '@/lib/dbPool';

const SalesSchema = z.object({
  order_id: z.string(),
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_phone: z.string(),
  product_name: z.string(),
  product_sku: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  discount_percentage: z.number().min(0).max(100),
  total_amount: z.number().positive(),
  payment_method: z.string(),
  order_date: z.string().transform(str => new Date(str)),
  delivery_date: z.string().transform(str => new Date(str)),
  region: z.string(),
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
    
    // Apply filters
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
    
    // Parse sort
    let orderBy: any = { id: 'desc' };
    if (sort) {
      const [field, direction] = sort.split('.');
      orderBy = { [field]: direction || 'asc' };
    }
    
    const [data, total] = await Promise.all([
      prisma.sales.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.sales.count({ where }),
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
    console.error('Sales GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SalesSchema.parse(body);
    
    const sale = await prisma.sales.create({
      data: validatedData,
    });
    
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Sales POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
