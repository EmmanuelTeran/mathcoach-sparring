import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from '../src/App';

describe('App Component Integration Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy' }),
        });
      }
      if (url.includes('/dashboard/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            dueCount: 2,
            dueByCategory: { technique: 1, application: 1, proof: 0 },
            criticalTracks: [],
            nextRecommended: null,
            topics: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn(() => []),
        }),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });
  });

  it('AC-1: monta un único componente RoundSession en la pestaña de entrenar', async () => {
    render(<App />);

    // El botón #btn-finish-round o #round-header debe existir en la pestaña entrenar
    expect(await screen.findByRole('button', { name: /ya terminé, capturar/i })).toBeInTheDocument();
    expect(document.querySelectorAll('#round-header')).toHaveLength(1);
  });

  it('AC-4: sólo contiene las pestañas "Entrenar" y "Panel"', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /entrenar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /panel/i })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /coding playground/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /soft skill/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hard skill/i })).not.toBeInTheDocument();
  });

  it('AC-1 & AC-4: alterna correctamente entre la pestaña Entrenar y Panel', async () => {
    const { container } = render(<App />);

    // Cambiar a panel
    const panelTabBtn = container.querySelector('#tab-dashboard');
    fireEvent.click(panelTabBtn);

    expect(await screen.findByText(/panel de control diario/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ya terminé, capturar/i })).not.toBeInTheDocument();

    // Cambiar de vuelta a Entrenar
    const trainTabBtn = container.querySelector('#tab-math-vision');
    fireEvent.click(trainTabBtn);

    expect(await screen.findByRole('button', { name: /ya terminé, capturar/i })).toBeInTheDocument();
  });
});

