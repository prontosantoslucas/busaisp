'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Map as MapIcon,
  Trash2,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Navigation
} from 'lucide-react';
import { usePWA } from '@/components/PWA/PWAProvider';
import { offlineMapService, OfflineMapInfo, OfflineMapProgress } from '@/lib/offlineMapService';

interface TokenConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isVoiceMuted?: boolean;
  onToggleVoice?: () => void;
  hasGps?: boolean;
}

export default function TokenConfigModal({
  isOpen,
  onClose,
  theme = 'dark',
  onToggleTheme,
  isVoiceMuted = false,
  onToggleVoice,
  hasGps = true
}: TokenConfigModalProps) {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    hasToken: boolean;
    message: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Estado do Mapa Offline
  const [offlineInfo, setOfflineInfo] = useState<OfflineMapInfo>({
    isDownloaded: false,
    tilesCount: 0,
    sizeMb: 0,
    lastUpdated: null
  });
  const [downloadProgress, setDownloadProgress] = useState<OfflineMapProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadOfflineInfo = async () => {
    const info = await offlineMapService.getOfflineStatus();
    setOfflineInfo(info);
  };

  const handleStartDownloadMap = async () => {
    setIsDownloading(true);
    await offlineMapService.startDownload((p) => {
      setDownloadProgress(p);
      if (p.status === 'COMPLETED' || p.status === 'ERROR' || p.status === 'PAUSED') {
        setIsDownloading(false);
        loadOfflineInfo();
      }
    });
  };

  const handleCancelDownload = () => {
    offlineMapService.cancelDownload();
    setIsDownloading(false);
  };

  const handleClearOfflineMap = async () => {
    await offlineMapService.clearCache();
    setDownloadProgress(null);
    await loadOfflineInfo();
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions((v) => !v);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      await installApp();
      setIsInstalling(false);
    }
  };

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/onibus?tipo=status_auth');
      const data = await res.json();
      if (data.success) {
        setAuthStatus({
          authenticated: data.authenticated,
          hasToken: data.hasToken,
          message: data.message
        });
      }
    } catch (e) {
      console.error('Erro ao verificar status:', e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
      loadOfflineInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="bus-glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          scrollbarWidth: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bus-border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'var(--bus-violet-soft)',
                border: '1px solid var(--bus-border-highlight)',
                color: 'var(--bus-violet)',
                padding: '8px',
                borderRadius: 'var(--bus-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 className="bus-display" style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>Configurações</h3>
              <p style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                Personalização, Mapa Offline e Conexão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--bus-text-secondary)', cursor: 'pointer', padding: '4px' }}
            aria-label="Fechar configurações"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* 1. APARÊNCIA & TEMA (DARK / LIGHT) */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--bus-radius-md)',
              background: 'var(--bus-surface-sunken)',
              border: '1px solid var(--bus-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--bus-radius-sm)',
                  background: 'var(--bus-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bus-violet)',
                  flexShrink: 0
                }}
              >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bus-text-primary)' }}>
                  Aparência do Aplicativo
                </div>
                <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                  Tema atual: <strong style={{ color: 'var(--bus-text-primary)' }}>{theme === 'dark' ? 'Modo Escuro (Noturno)' : 'Modo Claro'}</strong>
                </div>
              </div>
            </div>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="bus-pill"
                style={{ padding: '6px 12px', fontSize: '11.5px', gap: '6px', minHeight: '34px' }}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>
            )}
          </div>

          {/* 2. NAVEGAÇÃO POR VOZ */}
          {onToggleVoice && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--bus-radius-md)',
                background: 'var(--bus-surface-sunken)',
                border: '1px solid var(--bus-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--bus-radius-sm)',
                    background: isVoiceMuted ? 'var(--bus-surface-elevated)' : 'var(--bus-emerald-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isVoiceMuted ? 'var(--bus-text-secondary)' : 'var(--bus-emerald)',
                    flexShrink: 0
                  }}
                >
                  {isVoiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bus-text-primary)' }}>
                    Avisos de Navegação por Voz
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                    {isVoiceMuted ? 'Voz desativada durante a viagem' : 'Avisar embarque e chegada por voz'}
                  </div>
                </div>
              </div>

              <button
                onClick={onToggleVoice}
                className={`bus-pill ${!isVoiceMuted ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11.5px', minHeight: '34px' }}
              >
                <span>{isVoiceMuted ? 'Ativar Voz' : 'Voz Ativa'}</span>
              </button>
            </div>
          )}

          {/* 3. MAPA OFFLINE & CACHE INSTANTÂNEO (0ms) */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--bus-radius-md)',
              background: offlineInfo.isDownloaded ? 'var(--bus-emerald-soft)' : 'var(--bus-surface-sunken)',
              border: `1px solid ${offlineInfo.isDownloaded ? 'var(--bus-emerald)' : 'var(--bus-border-highlight)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: offlineInfo.isDownloaded ? 'var(--bus-emerald)' : 'var(--bus-violet-ink)',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--bus-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <MapIcon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bus-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Mapa Offline de São Paulo</span>
                  {offlineInfo.isDownloaded && (
                    <span style={{ fontSize: '9.5px', background: 'var(--bus-emerald)', color: '#fff', padding: '1px 5px', borderRadius: 'var(--bus-radius-sm)', fontWeight: 800 }}>
                      ATIVO (0ms)
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                  {offlineInfo.isDownloaded
                    ? `Tiles de SP salvos na memória (${offlineInfo.tilesCount} tiles · ${offlineInfo.sizeMb} MB). Carregamento instantâneo sem gastar internet.`
                    : 'Baixe o mapa de São Paulo para carregar muito mais rápido e usar sem gastar dados móveis (4G/5G).'}
                </p>
              </div>
            </div>

            {/* Barra de Progresso do Download */}
            {isDownloading && downloadProgress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bus-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--bus-radius-sm)', border: '1px solid var(--bus-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--bus-text-primary)', fontWeight: 600 }}>
                  <span className="bus-num">Baixando tiles: {downloadProgress.downloaded} / {downloadProgress.total}</span>
                  <span className="bus-num">{downloadProgress.percent}% ({downloadProgress.sizeMb} MB)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bus-surface-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${downloadProgress.percent}%`,
                      height: '100%',
                      background: 'var(--bus-emerald)',
                      transition: 'width 0.2s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Ações do Mapa Offline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {!offlineInfo.isDownloaded && !isDownloading && (
                <button
                  onClick={handleStartDownloadMap}
                  className="bus-btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--bus-radius-sm)', flex: 1 }}
                >
                  <Download size={14} />
                  <span>Baixar Mapa de SP (Offline / Rápido)</span>
                </button>
              )}

              {isDownloading && (
                <button
                  onClick={handleCancelDownload}
                  className="bus-pill"
                  style={{ padding: '8px 14px', fontSize: '12px', flex: 1, justifyContent: 'center' }}
                >
                  <span>Pausar Download</span>
                </button>
              )}

              {offlineInfo.isDownloaded && (
                <>
                  <button
                    onClick={handleStartDownloadMap}
                    className="bus-pill"
                    style={{ padding: '7px 12px', fontSize: '11.5px', flex: 1, justifyContent: 'center' }}
                    disabled={isDownloading}
                  >
                    <RefreshCw size={13} className={isDownloading ? 'animate-spin' : ''} />
                    <span>Atualizar</span>
                  </button>
                  <button
                    onClick={handleClearOfflineMap}
                    style={{
                      background: 'var(--bus-red-soft)',
                      border: '1px solid var(--bus-red)',
                      color: 'var(--bus-red)',
                      borderRadius: 'var(--bus-radius-sm)',
                      padding: '7px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Excluir cache offline"
                  >
                    <Trash2 size={13} />
                    <span>Liberar {offlineInfo.sizeMb} MB</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 4. STATUS DA CONEXÃO & SERVIDOR */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--bus-radius-md)',
              background: 'var(--bus-surface-sunken)',
              border: '1px solid var(--bus-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wifi size={16} color="var(--bus-violet)" />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                  Status dos Serviços
                </span>
              </div>

              <button
                onClick={checkConnection}
                className="bus-pill"
                style={{ padding: '4px 10px', fontSize: '11px', minHeight: '30px' }}
                disabled={isChecking}
              >
                <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
                <span>{isChecking ? 'Testando...' : 'Testar Conexão'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {/* Telemetria SPTrans */}
              <div
                style={{
                  background: 'var(--bus-surface-elevated)',
                  border: '1px solid var(--bus-border-subtle)',
                  borderRadius: 'var(--bus-radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: authStatus?.authenticated ? 'var(--bus-emerald)' : 'var(--bus-live)' }} />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>SPTRANS / OLHO VIVO</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: authStatus?.authenticated ? 'var(--bus-emerald)' : 'var(--bus-text-primary)' }}>
                    {authStatus?.authenticated ? 'Conectado (Ao Vivo)' : 'Verificando...'}
                  </div>
                </div>
              </div>

              {/* GPS do Aparelho */}
              <div
                style={{
                  background: 'var(--bus-surface-elevated)',
                  border: '1px solid var(--bus-border-subtle)',
                  borderRadius: 'var(--bus-radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasGps ? 'var(--bus-emerald)' : 'var(--bus-live)' }} />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>GPS DO DISPOSITIVO</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: hasGps ? 'var(--bus-emerald)' : 'var(--bus-live)' }}>
                    {hasGps ? 'GPS Ativo' : 'Buscando GPS...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. APLICATIVO / PWA */}
          {!isInstalled && (isIOS || isInstallable) && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--bus-radius-md)',
                background: 'var(--bus-violet-soft)',
                border: '1px solid var(--bus-border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="var(--bus-violet)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>
                  Instalar Atalho na Tela Inicial
                </span>
              </div>

              <button
                onClick={handleInstallClick}
                className="bus-btn-primary"
                style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: 'var(--bus-radius-sm)' }}
                disabled={isInstalling}
              >
                {isIOS ? <Share size={13} /> : <Download size={13} />}
                <span>{isInstalling ? 'Instalando...' : 'Instalar'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bus-border-subtle)', paddingTop: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--bus-text-dim)' }}>
            Busaí SP • Versão 0.1.0 (Nativo)
          </span>
          <button onClick={onClose} className="bus-btn-primary" style={{ padding: '8px 20px', fontSize: '12.5px', borderRadius: 'var(--bus-radius-sm)' }}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
