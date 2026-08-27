import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta o DOM entre testes de componente — sem isso, cada render() se acumula
// no mesmo document.body e queries como getByRole passam a achar múltiplos elementos
// de renders anteriores, quebrando testes que na verdade estão corretos.
afterEach(() => {
  cleanup();
});
