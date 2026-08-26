import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bus-bg)',
        color: 'var(--bus-text-primary)',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      <h2 className="bus-display" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        Página não encontrada
      </h2>
      <p style={{ color: 'var(--bus-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
        A página solicitada não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="bus-btn-primary"
        style={{
          padding: '10px 22px',
          fontSize: '14px',
          textDecoration: 'none'
        }}
      >
        Voltar para o Início
      </Link>
    </div>
  );
}

