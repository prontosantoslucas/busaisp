// @vitest-environment jsdom
/**
 * Testes reais de renderização: monta o componente LiveMap de verdade (com Leaflet
 * mockado, já que jsdom não implementa canvas/WebGL) e simula cliques reais nos
 * botões flutuantes do mapa — não mocks testando a si mesmos. Isto teria pego o bug
 * real de "handleLocateMe" declarado duas vezes (erro de compilação) e também pega
 * regressões de wiring futuras (botão ligado à função errada, sem handler, etc.).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LiveMap, { LiveMapProps } from './LiveMap';

// Mock mínimo e fiel da API do Leaflet realmente usada por LiveMap.tsx — cada
// método devolve um stub encadeável (addTo/on/bindPopup retornam a própria instância).
function createChainableStub() {
  const stub: any = {};
  const chain = () => stub;
  Object.assign(stub, {
    addTo: chain,
    on: chain,
    off: chain,
    remove: vi.fn(),
    setView: vi.fn(),
    fitBounds: vi.fn(),
    setUrl: vi.fn(),
    setLatLng: chain,
    setRadius: chain,
    bindPopup: chain,
    bindTooltip: chain,
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
    remove_layer: vi.fn()
  });
  return stub;
}

vi.mock('leaflet', () => {
  const mapInstance = createChainableStub();
  const L = {
    map: vi.fn(() => mapInstance),
    tileLayer: vi.fn(() => createChainableStub()),
    control: { zoom: vi.fn(() => createChainableStub()) },
    layerGroup: vi.fn(() => createChainableStub()),
    marker: vi.fn(() => createChainableStub()),
    divIcon: vi.fn(() => ({})),
    polyline: vi.fn(() => createChainableStub()),
    circle: vi.fn(() => createChainableStub()),
    circleMarker: vi.fn(() => createChainableStub()),
    latLngBounds: vi.fn(() => ({})),
    DomEvent: {
      disableClickPropagation: vi.fn(),
      disableScrollPropagation: vi.fn()
    }
  };
  return { default: L, ...L };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Evita chamadas de rede reais do modal de "linhas neste ponto" — não é o alvo deste teste.
vi.mock('@/components/Map/StopArrivalsModal', () => ({
  default: () => null
}));

function renderLiveMap(overrides: Partial<LiveMapProps> = {}) {
  const props: LiveMapProps = {
    selectedLine: null,
    veiculos: [],
    paradas: [],
    onSelectParada: vi.fn(),
    isLoading: false,
    onRefresh: vi.fn(),
    isMapFullscreen: true,
    ...overrides
  };
  const result = render(<LiveMap {...props} />);
  return { result, props };
}

describe('LiveMap — botões de ação flutuantes (renderização real)', () => {
  let getCurrentPositionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getCurrentPositionMock = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock, watchPosition: vi.fn(), clearWatch: vi.fn() },
      configurable: true
    });
  });

  it('renderiza o mapa sem lançar erro (regressão do bug real: handleLocateMe declarado duas vezes)', () => {
    // Se houvesse uma redeclaração de const no módulo, isto falharia no import/parse,
    // não em runtime — mas qualquer TypeError de wiring quebrado apareceria aqui.
    expect(() => renderLiveMap()).not.toThrow();
  });

  it('botão "Minha Localização GPS" aciona geolocalização real ao clicar', () => {
    renderLiveMap();
    const locateButton = screen.getByRole('button', { name: /localização atual/i });
    fireEvent.click(locateButton);
    expect(getCurrentPositionMock).toHaveBeenCalledTimes(1);
  });

  it('botão "Atualizar posições dos ônibus" chama onRefresh ao clicar', () => {
    const onRefresh = vi.fn();
    renderLiveMap({ onRefresh });
    const refreshButton = screen.getByRole('button', { name: /atualizar posições/i });
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('botão de incidentes de trânsito alterna a camada ao clicar (sem lançar erro)', () => {
    renderLiveMap();
    const incidentsButton = screen.getByRole('button', { name: /incidentes de trânsito/i });
    expect(() => fireEvent.click(incidentsButton)).not.toThrow();
  });

  it('botão de mapa de calor de trânsito alterna a camada ao clicar (sem lançar erro)', () => {
    renderLiveMap();
    const heatmapButton = screen.getByRole('button', { name: /mapa de calor de trânsito/i });
    expect(() => fireEvent.click(heatmapButton)).not.toThrow();
  });

  it('botões flutuantes não aparecem fora do modo mapa em tela cheia', () => {
    renderLiveMap({ isMapFullscreen: false });
    expect(screen.queryByRole('button', { name: /localização atual/i })).not.toBeInTheDocument();
  });
});
