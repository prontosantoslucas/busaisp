'use client';

import React from 'react';
import { CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export default function MoovitPassagens() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Header */}
      <div style={{ background: '#1C1E24', border: '1px solid #2D313C', borderRadius: '16px', padding: '16px 18px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
          Passagens & Tarifas SP
        </h3>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Informações oficiais de integração tarifária da SPTrans e EMTU/Metrô
        </p>
      </div>

      {/* Card Bilhete Único */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7F1D1D, #1C1E24)',
          border: '1px solid #E30613',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 6px 20px rgba(227, 6, 19, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase' }}>
            São Paulo Transporte (SPTrans)
          </span>
          <span style={{ background: '#E30613', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
            MUNICIPAL
          </span>
        </div>

        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF' }}>
            R$ 5,30
          </div>
          <div style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '2px' }}>
            Bilhete Único Comum
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#E5E7EB', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34D399" />
            <span>Até <strong>4 viagens de ônibus</strong> no período de <strong>3 horas</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34D399" />
            <span>Integração com Metrô/CPTM com desconto especial.</span>
          </div>
        </div>
      </div>

      {/* Card Cartão TOP */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7A0912, #1C1E24)',
          border: '1px solid var(--moovit-sptrans-red)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase' }}>
            Metrô / CPTM & EMTU
          </span>
          <span style={{ background: 'var(--moovit-sptrans-red)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
            ESTADUAL
          </span>
        </div>

        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF' }}>
            R$ 5,00
          </div>
          <div style={{ fontSize: '12px', color: '#93C5FD', marginTop: '2px' }}>
            Cartão TOP / Bilhete Digital QR Code
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#E5E7EB', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="var(--moovit-sptrans-red)" />
            <span>Válido em todas as linhas de Metrô e CPTM.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
