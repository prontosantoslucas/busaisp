'use client';

import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, X, ShieldCheck, Database, RefreshCw } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(227, 6, 19, 0.15)',
                color: 'var(--accent-sptrans)',
                padding: '8px',
                borderRadius: '10px'
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Conexão & API SPTrans</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Configuração do Olho Vivo e Serviços
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Atual do Olho Vivo */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: authStatus?.authenticated
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              border: authStatus?.authenticated
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {authStatus?.authenticated ? (
              <CheckCircle2 size={22} color="#10B981" style={{ marginTop: '2px' }} />
            ) : (
              <AlertCircle size={22} color="#F59E0B" style={{ marginTop: '2px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                {authStatus?.authenticated
                  ? 'API Olho Vivo Conectada em Tempo Real'
                  : 'Aguardando Conexão com a API SPTrans'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                {authStatus?.authenticated
                  ? 'Sua chave de desenvolvedor está validada. Posições e previsões são consultadas diretamente da SPTrans.'
                  : 'Para ativar o rastreamento em tempo real com toda a frota municipal da SPTrans:'}
              </p>
            </div>
          </div>

          {/* Passo a Passo para Obter o Token Gratuito */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '14px'
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Como obter seu Token SPTrans (100% Gratuito):
            </h4>
            <ol
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                paddingLeft: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
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
              <li>Cadastre-se gratuitamente e crie uma nova aplicação no painel.</li>
              <li>Copie seu <strong>Token de Acesso</strong> gerado.</li>
              <li>
                Cole no arquivo <code>.env.local</code> da aplicação:
                <pre
                  style={{
                    background: '#0B0F17',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#10B981',
                    overflowX: 'auto'
                  }}
                >
                  SPTRANS_TOKEN=seu_token_aqui
                </pre>
              </li>
            </ol>
          </div>

          {/* Segurança & Serverless Proxy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(0, 51, 153, 0.1)',
              border: '1px solid rgba(0, 51, 153, 0.25)',
              borderRadius: '10px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <ShieldCheck size={20} color="#38BDF8" />
            <span>
              <strong>100% Seguro:</strong> O token nunca é exposto no navegador do usuário. Toda autenticação e cache de sessão é gerenciada no servidor.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={checkConnection}
            className="btn-secondary"
            style={{ fontSize: '13px' }}
            disabled={isChecking}
          >
            <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            Testar Conexão
          </button>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: '13px' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
