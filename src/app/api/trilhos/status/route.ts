import { NextResponse } from 'next/server';
import { getRailsStatus } from '@/lib/trilhos';

export async function GET() {
  try {
    const data = await getRailsStatus();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API /api/trilhos/status] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar status dos trilhos'
      },
      { status: 500 }
    );
  }
}
