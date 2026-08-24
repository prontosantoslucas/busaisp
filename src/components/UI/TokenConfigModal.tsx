'use client';

import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface TokenConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TokenConfigModal({ isOpen, onClose }: TokenConfigModalProps) {
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    hasToken: boolean;
    message: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          maxWidth: '520px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#38BDF8',
                padding: '8px',
                borderRadius: '10px'
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC' }}>Conexão & API SPTrans</h3>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                Configuração do Olho Vivo e Serviços ao Vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status Atual do Olho Vivo */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: authStatus?.authenticated
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
              border: authStatus?.authenticated
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {authStatus?.authenticated ? (
              <CheckCircle2 size={22} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={22} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC' }}>
                {authStatus?.authenticated
                  ? 'API Olho Vivo Conectada em Tempo Real'
                  : 'Aguardando Conexão com a API SPTrans'}
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                {authStatus?.authenticated
                  ? 'Sua chave de desenvolvedor está validada. Posições e previsões são consultadas diretamente da SPTrans.'
                  : 'Para ativar o rastreamento em tempo real com toda a frota municipal da SPTrans:'}
              </p>
            </div>
          </div>

          {/* Passo a Passo */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '14px'
            }}
          >
            <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '8px', color: '#F8FAFC' }}>
              Como obter seu Token SPTrans (100% Gratuito):
            </h4>
            <ol
              style={{
                fontSize: '12px',
                color: '#CBD5E1',
                paddingLeft: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                lineHeight: 1.4
              }}
            >
              <li>
                Acesse o portal{' '}
                <a
                  href="http://www.sptrans.com.br/desenvolvedores"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#38BDF8', textDecoration: 'underline' }}
                >
                  SPTrans Desenvolvedores <ExternalLink size={11} style={{ display: 'inline' }} />
                </a>
              </li>
              <li>Cadastre-se e gere seu <strong>Token de Acesso</strong>.</li>
              <li>
                Adicione no arquivo <code>.env.local</code>:
                <pre
                  style={{
                    background: '#07090E',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: '#34D399',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  SPTRANS_TOKEN=seu_token_aqui
                </pre>
              </li>
            </ol>
          </div>

          {/* Segurança */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '10px',
              fontSize: '11.5px',
              color: '#94A3B8'
            }}
          >
            <ShieldCheck size={18} color="#38BDF8" style={{ flexShrink: 0 }} />
            <span>
              <strong>100% Seguro:</strong> O token é mantido exclusivamente no backend protegido da aplicação.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
          <button
            onClick={checkConnection}
            className="bus-pill"
            style={{ fontSize: '12px' }}
            disabled={isChecking}
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            <span>Testar Conexão</span>
          </button>
          <button onClick={onClose} className="bus-btn-primary" style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '8px' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
