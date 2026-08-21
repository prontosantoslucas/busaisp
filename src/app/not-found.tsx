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
        backgroundColor: '#0B0F17',
        color: '#F8FAFC',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
        Página não encontrada
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
        A página solicitada não existe ou foi movida.
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#E30613',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '14px'
        }}
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
