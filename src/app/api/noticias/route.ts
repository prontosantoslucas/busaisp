import { NextResponse } from 'next/server';
import { getUnifiedLiveNews } from '@/lib/newsService';

export async function GET() {
  try {
    const items = await getUnifiedLiveNews();
    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API /api/noticias] Erro ao carregar notícias:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar notícias'
      },
      { status: 500 }
    );
  }
}
