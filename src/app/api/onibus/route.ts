import { NextRequest, NextResponse } from 'next/server';
import {
  buscarLinhas,
  buscarParadas,
  buscarPosicaoLinha,
  buscarPrevisaoParada,
  buscarPrevisaoLinha,
  authenticateSPTrans
} from '@/lib/sptrans';
import { findNearbyStops } from '@/lib/gtfs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'linhas';
  const query = searchParams.get('q') || searchParams.get('termosBusca') || '';
  const codigo = searchParams.get('codigo') || searchParams.get('codigoLinha') || searchParams.get('codigoParada');

  const timestamp = new Date().toISOString();

  try {
    // Diagnóstico temporário: confirma se a variável do CartoDB está mesmo configurada
    // no ambiente de build/runtime da Vercel, sem nunca expor o valor real da chave.
    if (tipo === 'carto_debug') {
      const key = process.env.NEXT_PUBLIC_CARTO_API_KEY || '';
      return NextResponse.json({
        success: true,
        hasCartoKey: key.length > 0,
        keyLength: key.length,
        keyPreview: key.length > 0 ? `${key.slice(0, 6)}...${key.slice(-4)}` : null,
        timestamp
      });
    }

    // 1. Status de Autenticação / Configuração
    if (tipo === 'status_auth') {
      const hasEnvToken = Boolean(process.env.SPTRANS_TOKEN && process.env.SPTRANS_TOKEN.trim().length > 0);
      const cookie = await authenticateSPTrans();
      return NextResponse.json({
        success: true,
        authenticated: Boolean(cookie),
        hasToken: hasEnvToken,
        message: cookie ? 'Conectado à API SPTrans Olho Vivo' : 'Aguardando autenticação SPTrans',
        timestamp
      });
    }

    // 2. Busca de Linhas
    if (tipo === 'linhas') {
      const { linhas, isMock } = await buscarLinhas(query);
      return NextResponse.json({
        success: true,
        data: linhas,
        isMock,
        count: linhas.length,
        timestamp
      });
    }

    // 3. Busca de Paradas
    if (tipo === 'paradas') {
      const { paradas, isMock } = await buscarParadas(query);
      return NextResponse.json({
        success: true,
        data: paradas,
        isMock,
        count: paradas.length,
        timestamp
      });
    }

    // 3b. Parada mais próxima de um ponto do mapa (toque do usuário)
    if (tipo === 'parada_proxima') {
      const lat = parseFloat(searchParams.get('lat') || '');
      const lng = parseFloat(searchParams.get('lng') || '');

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json(
          { success: false, error: 'Parâmetros lat/lng inválidos.' },
          { status: 400 }
        );
      }

      const nearby = await findNearbyStops(lat, lng, 350, 1);
      const stop = nearby[0];

      if (!stop) {
        return NextResponse.json({
          success: true,
          data: null,
          timestamp
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          cp: Number(stop.stopId),
          np: stop.name,
          ed: '',
          py: stop.lat,
          px: stop.lng,
          distanceMeters: stop.distanceMeters
        },
        timestamp
      });
    }

    // 4. Posição dos Ônibus da Linha
    if (tipo === 'posicao' || tipo === 'posicao_linha') {
      const codNum = codigo ? parseInt(codigo, 10) : 1001;
      const letreiroParam = searchParams.get('letreiro') || searchParams.get('linha') || undefined;
      const { posicao, isMock } = await buscarPosicaoLinha(codNum, letreiroParam);
      return NextResponse.json({
        success: true,
        data: posicao,
        isMock,
        timestamp
      });
    }

    // 5. Velocidade nos Corredores e Vias
    if (tipo === 'velocidade' || tipo === 'velocidade_corredor') {
      const { buscarVelocidadeCorredores } = await import('@/lib/sptrans');
      const res = await buscarVelocidadeCorredores();
      return NextResponse.json({
        success: true,
        data: res.data,
        timestamp
      });
    }

    // 5. Previsão de Chegada por Parada
    if (tipo === 'previsao_parada') {
      const codNum = codigo ? parseInt(codigo, 10) : 340015339;
      const { previsao, isMock } = await buscarPrevisaoParada(codNum);
      return NextResponse.json({
        success: true,
        data: previsao,
        isMock,
        timestamp
      });
    }

    // 6. Previsão de Chegada por Linha
    if (tipo === 'previsao_linha') {
      const codNum = codigo ? parseInt(codigo, 10) : 1001;
      const { previsao, isMock } = await buscarPrevisaoLinha(codNum);
      return NextResponse.json({
        success: true,
        data: previsao,
        isMock,
        timestamp
      });
    }

    return NextResponse.json(
      { success: false, error: `Tipo de consulta '${tipo}' inválido.` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API /api/onibus] Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro interno ao processar requisição SPTrans',
        timestamp
      },
      { status: 500 }
    );
  }
}
