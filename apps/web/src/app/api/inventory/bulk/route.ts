import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const BulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()),
});

const BulkUpdateSchema = z.object({
  ids: z.array(z.number().int().positive()),
  data: z.object({
    category: z.string().optional(),
    sub_category: z.string().optional(),
    stock_quantity: z.number().min(0).optional(),
    reorder_level: z.number().min(0).optional(),
    unit_cost: z.number().min(0).optional(),
    selling_price: z.number().min(0).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'delete':
        const deleteData = BulkDeleteSchema.parse(body);
        const deleteResult = await prisma.inventory.deleteMany({
          where: {
            id: { in: deleteData.ids },
          },
        });
        return NextResponse.json({ 
          message: `${deleteResult.count} inventory items deleted successfully`,
          count: deleteResult.count 
        });
        
      case 'update':
        const updateData = BulkUpdateSchema.parse(body);
        const updateResult = await prisma.inventory.updateMany({
          where: {
            id: { in: updateData.ids },
          },
          data: updateData.data,
        });
        return NextResponse.json({ 
          message: `${updateResult.count} inventory items updated successfully`,
          count: updateResult.count 
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, update' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Inventory bulk operation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}
