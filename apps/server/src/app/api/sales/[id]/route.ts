import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const SalesUpdateSchema = z.object({
  order_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  product_name: z.string().optional(),
  product_sku: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  unit_price: z.number().positive().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  total_amount: z.number().positive().optional(),
  payment_method: z.string().optional(),
  order_date: z.string().transform(str => new Date(str)).optional(),
  delivery_date: z.string().transform(str => new Date(str)).optional(),
  region: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    const sale = await prisma.sales.findUnique({
      where: { id },
    });
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Sales GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const validatedData = SalesUpdateSchema.parse(body);
    
    const sale = await prisma.sales.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Sales PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    await prisma.sales.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Sales DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    );
  }
}
