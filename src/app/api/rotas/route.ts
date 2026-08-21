import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, calculateRoute, searchAddressSuggestions, RouteLocation } from '@/lib/routing';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const query = searchParams.get('q');

  // Sugestões de autocomplete enquanto digita
  if (tipo === 'sugestoes' && query) {
    const suggestions = await searchAddressSuggestions(query);
    return NextResponse.json({
      success: true,
      data: suggestions
    });
  }

  const origemStr = searchParams.get('origem') || 'Minha Localização';
  const destinoStr = searchParams.get('destino') || 'Shopping Center Norte';
  const origLat = searchParams.get('origLat');
  const origLng = searchParams.get('origLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  try {
    let originLoc: RouteLocation;
    let destLoc: RouteLocation;

    if (origLat && origLng) {
      originLoc = {
        name: origemStr,
        addressDetails: 'Localização atual pelo GPS',
        lat: parseFloat(origLat),
        lng: parseFloat(origLng)
      };
    } else {
      originLoc = await geocodeAddress(origemStr);
    }

    if (destLat && destLng) {
      destLoc = {
        name: destinoStr,
        addressDetails: 'Endereço selecionado',
        lat: parseFloat(destLat),
        lng: parseFloat(destLng)
      };
    } else {
      destLoc = await geocodeAddress(destinoStr);
    }

    const routeResult = await calculateRoute(originLoc, destLoc);

    return NextResponse.json({
      success: true,
      data: routeResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API /api/rotas] Erro ao calcular rota:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao calcular rota de transporte'
      },
      { status: 500 }
    );
  }
}
