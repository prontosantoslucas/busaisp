import { NextRequest, NextResponse } from 'next/server';
import { getLiveTrafficIncidents } from '@/lib/trafficService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '-23.5158');
  const lng = parseFloat(searchParams.get('lng') || '-46.6182');
  const radius = parseFloat(searchParams.get('radius') || '25');

  try {
    const data = await getLiveTrafficIncidents(lat, lng, radius);
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API /api/transito/incidentes] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao consultar incidentes' },
      { status: 500 }
    );
  }
}
