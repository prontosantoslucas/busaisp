import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, calculateRoute, searchAddressSuggestions, RouteLocation } from '@/lib/routing';
import { supabase } from '@/lib/supabase';

const DEFAULT_POPULAR_DESTINATIONS = [
  'Shopping Center Norte',
  'Metrô / Terminal Tucuruvi',
  'Avenida Paulista, 1578',
  'Metrô / Terminal Santana',
  'Rua Flor de Maio, 40'
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const query = searchParams.get('q');

  // 1. Destinos Mais Procurados em tempo real (com fallback resiliente)
  if (tipo === 'destinos_populares') {
    try {
      const { data, error } = await supabase.rpc('get_popular_destinations', { limit_count: 6 });
      if (!error && Array.isArray(data) && data.length > 0) {
        const destinations = data.map((row: any) => row.destination_name);
        return NextResponse.json({
          success: true,
          data: destinations
        });
      }
    } catch (err) {
      console.warn('[API /api/rotas] Fallback para destinos populares padrão:', err);
    }

    return NextResponse.json({
      success: true,
      data: DEFAULT_POPULAR_DESTINATIONS
    });
  }

  // 2. Sugestões de autocomplete enquanto digita
  if (tipo === 'sugestoes' && query) {
    const suggestions = await searchAddressSuggestions(query);
    return NextResponse.json({
      success: true,
      data: suggestions
    });
  }

  const origemStr = searchParams.get('origem') || 'Minha Localização';
  const destinoStr = searchParams.get('destino') || 'Rua Flor de Maio, 40';
  const origLat = searchParams.get('origLat') || searchParams.get('lat');
  const origLng = searchParams.get('origLng') || searchParams.get('lng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  // Minutos a partir de agora para o horário de saída planejado (0 = "sair agora").
  // O cliente calcula esse deslocamento a partir do horário de relógio escolhido.
  const partidaMinutosParam = searchParams.get('partidaMinutos');
  const targetOffsetMinutes = partidaMinutosParam ? Math.max(0, parseInt(partidaMinutosParam, 10) || 0) : 0;

  try {
    let originLoc: RouteLocation;
    let destLoc: RouteLocation;

    if (origLat && origLng && !isNaN(parseFloat(origLat)) && !isNaN(parseFloat(origLng))) {
      originLoc = {
        name: origemStr === 'Local atual' ? 'Minha Localização' : origemStr,
        addressDetails: 'Localização atual pelo GPS',
        lat: parseFloat(origLat),
        lng: parseFloat(origLng)
      };
    } else {
      originLoc = await geocodeAddress(origemStr);
    }

    if (destLat && destLng && !isNaN(parseFloat(destLat)) && !isNaN(parseFloat(destLng))) {
      destLoc = {
        name: destinoStr,
        addressDetails: 'Endereço selecionado',
        lat: parseFloat(destLat),
        lng: parseFloat(destLng)
      };
    } else {
      destLoc = await geocodeAddress(destinoStr);
    }

    const routeResult = await calculateRoute(originLoc, destLoc, targetOffsetMinutes);

    // Registra o evento de busca de forma assíncrona (não bloqueia a resposta)
    try {
      supabase.from('search_events').insert({
        origin_name: originLoc.name,
        origin_lat: originLoc.lat,
        origin_lng: originLoc.lng,
        destination_name: destLoc.name,
        destination_lat: destLoc.lat,
        destination_lng: destLoc.lng
      }).then(({ error }) => {
        if (error) console.warn('[SearchEvents] Aviso ao registrar busca:', error.message);
      });
    } catch (e) {
      // Ignora erro de telemetria
    }

    return NextResponse.json({
      success: true,
      data: routeResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const message = error.message || 'Erro ao calcular rota de transporte';

    // "Nenhuma rota encontrada" é um resultado legítimo da busca (não achou linha
    // conectando os pontos), não uma falha do servidor — não deve virar HTTP 500.
    const isNoRouteFound =
      message.includes('Nenhuma linha encontrada') || message.includes('Nenhuma parada de ônibus encontrada');

    if (!isNoRouteFound) {
      console.error('[API /api/rotas] Erro ao calcular rota:', error);
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: isNoRouteFound ? 200 : 500 }
    );
  }
}
