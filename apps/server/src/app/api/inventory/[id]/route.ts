import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const InventoryUpdateSchema = z.object({
  product_id: z.string().optional(),
  product_name: z.string().optional(),
  product_sku: z.string().optional(),
  category: z.string().optional(),
  sub_category: z.string().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  reserved_quantity: z.number().int().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
  unit_cost: z.number().positive().optional(),
  selling_price: z.number().positive().optional(),
  supplier_name: z.string().optional(),
  supplier_contact: z.string().optional(),
  last_restocked: z.string().transform(str => new Date(str)).optional(),
  expiry_date: z.string().transform(str => new Date(str)).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    const item = await prisma.inventory.findUnique({
      where: { id },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Inventory GET by ID error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
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
    const validatedData = InventoryUpdateSchema.parse(body);
    
    const item = await prisma.inventory.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Inventory PUT error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
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
    
    await prisma.inventory.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Inventory DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
