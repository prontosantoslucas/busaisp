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
        background: 'rgba(0, 0, 0, 0.5)',
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
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
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
                borderRadius: 'var(--bus-radius-sm)'
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h3 className="bus-display" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>Conexão & API SPTrans</h3>
              <p style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                Configuração do Olho Vivo e Serviços ao Vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--bus-text-secondary)', cursor: 'pointer' }}
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
              borderRadius: 'var(--bus-radius-md)',
              background: authStatus?.authenticated ? 'var(--bus-emerald-soft)' : 'var(--bus-live-soft)',
              border: `1px solid ${authStatus?.authenticated ? 'var(--bus-emerald)' : 'var(--bus-live)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {authStatus?.authenticated ? (
              <CheckCircle2 size={22} color="var(--bus-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={22} color="var(--bus-live)" style={{ marginTop: '2px', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bus-text-primary)' }}>
                {authStatus?.authenticated
                  ? 'API Olho Vivo Conectada em Tempo Real'
                  : 'Aguardando Conexão com a API SPTrans'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--bus-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                {authStatus?.authenticated
                  ? 'Sua chave de desenvolvedor está validada. Posições e previsões são consultadas diretamente da SPTrans.'
                  : 'Para ativar o rastreamento em tempo real com toda a frota municipal da SPTrans:'}
              </p>
            </div>
          </div>

          {/* Passo a Passo */}
          <div
            style={{
              background: 'var(--bus-surface-sunken)',
              borderRadius: 'var(--bus-radius-md)',
              border: '1px solid var(--bus-border-subtle)',
              padding: '14px'
            }}
          >
            <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '8px', color: 'var(--bus-text-primary)' }}>
              Como obter seu Token SPTrans (100% Gratuito):
            </h4>
            <ol
              style={{
                fontSize: '12px',
                color: 'var(--bus-text-secondary)',
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
                  style={{ color: 'var(--bus-violet)', textDecoration: 'underline' }}
                >
                  SPTrans Desenvolvedores <ExternalLink size={11} style={{ display: 'inline' }} />
                </a>
              </li>
              <li>Cadastre-se e gere seu <strong style={{ color: 'var(--bus-text-primary)' }}>Token de Acesso</strong>.</li>
              <li>
                Adicione no arquivo <code>.env.local</code>:
                <pre
                  className="bus-num"
                  style={{
                    background: 'var(--bus-bg)',
                    padding: '6px 10px',
                    borderRadius: 'var(--bus-radius-sm)',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: 'var(--bus-emerald)',
                    border: '1px solid var(--bus-border-subtle)'
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
              background: 'var(--bus-violet-soft)',
              border: '1px solid var(--bus-border-highlight)',
              borderRadius: 'var(--bus-radius-md)',
              fontSize: '11.5px',
              color: 'var(--bus-text-secondary)'
            }}
          >
            <ShieldCheck size={18} color="var(--bus-violet)" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: 'var(--bus-text-primary)' }}>100% Seguro:</strong> O token é mantido exclusivamente no backend protegido da aplicação.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--bus-border-subtle)', paddingTop: '12px' }}>
          <button
            onClick={checkConnection}
            className="bus-pill"
            style={{ fontSize: '12px' }}
            disabled={isChecking}
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            <span>Testar Conexão</span>
          </button>
          <button onClick={onClose} className="bus-btn-primary" style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: 'var(--bus-radius-sm)' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
