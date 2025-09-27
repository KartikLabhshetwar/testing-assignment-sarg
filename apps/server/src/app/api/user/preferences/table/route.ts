import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const PreferencesSchema = z.object({
  tableId: z.string(),
  prefs: z.object({
    columnWidths: z.record(z.number()).optional(),
    hiddenColumns: z.array(z.string()).optional(),
    columnOrder: z.array(z.string()).optional(),
    pinnedColumns: z.object({
      left: z.array(z.string()).optional(),
      right: z.array(z.string()).optional(),
    }).optional(),
    density: z.enum(['compact', 'normal', 'comfortable']).optional(),
    pageSize: z.number().int().positive().optional(),
    filters: z.record(z.any()).optional(),
    sorting: z.array(z.object({
      id: z.string(),
      desc: z.boolean(),
    })).optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, prefs } = PreferencesSchema.parse(body);
    
    // For now, we'll use a default userId. In production, get from auth session
    const userId = 'default-user';
    
    const preference = await prisma.userPreferences.upsert({
      where: {
        userId_tableId: {
          userId,
          tableId,
        },
      },
      update: {
        prefs,
      },
      create: {
        userId,
        tableId,
        prefs,
      },
    });
    
    return NextResponse.json(preference);
  } catch (error) {
    console.error('User preferences POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');
    
    if (!tableId) {
      return NextResponse.json(
        { error: 'tableId is required' },
        { status: 400 }
      );
    }
    
    // For now, we'll use a default userId. In production, get from auth session
    const userId = 'default-user';
    
    const preference = await prisma.userPreferences.findUnique({
      where: {
        userId_tableId: {
          userId,
          tableId,
        },
      },
    });
    
    return NextResponse.json(preference?.prefs || {});
  } catch (error) {
    console.error('User preferences GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
