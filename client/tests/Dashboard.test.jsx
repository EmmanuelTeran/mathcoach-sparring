import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../src/components/Dashboard';

describe('Dashboard Component Tests (MATH-US-14)', () => {
  const mockOnStartTraining = vi.fn();

  const sampleSummary = {
    dueCount: 4,
    dueByCategory: {
      technique: 2,
      application: 1,
      proof: 1,
    },
    nextRecommended: {
      trackId: 'track123',
      topic: {
        _id: 'topic1',
        title: 'Factorización y Fracciones',
      },
      category: 'technique',
      difficulty: 1,
    },
    criticalTracks: [
      {
        topic: {
          _id: 'topic2',
          title: 'Ecuaciones Cuadráticas',
        },
        category: 'application',
        difficulty: 2,
        lastRoundScore: 2.5,
      },
    ],
    topics: [
      {
        _id: 'topic1',
        title: 'Factorización y Fracciones',
        area: 'algebra',
        tracks: [
          {
            category: 'technique',
            difficulty: 1,
            dueDate: new Date(Date.now() - 3600 * 1000).toISOString(),
            lastRoundScore: 4.5,
          },
          {
            category: 'application',
            difficulty: 2,
            dueDate: new Date(Date.now() + 86400 * 1000).toISOString(),
            lastRoundScore: null,
          },
          {
            category: 'proof',
            difficulty: 3,
            dueDate: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
            lastRoundScore: 3.2,
          },
        ],
      },
      {
        _id: 'topic2',
        title: 'Ecuaciones Cuadráticas',
        area: 'algebra',
        tracks: [
          {
            category: 'application',
            difficulty: 2,
            dueDate: new Date(Date.now() - 7200 * 1000).toISOString(),
            lastRoundScore: 2.5,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Muestra estado de carga y maneja errores con reintento', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard onStartTraining={mockOnStartTraining} />);

    expect(screen.getByText(/analizando estado de retención y prioridades srs/i)).toBeInTheDocument();

    expect(await screen.findByText(/no se pudo conectar con el servidor para obtener las métricas/i)).toBeInTheDocument();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => sampleSummary,
    });

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText(/panel de control diario/i)).toBeInTheDocument();
  });

  it('2. AC-1: Renderiza tarjetas de repasos pendientes por categoría con IDs requeridos', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => sampleSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#dashboard-view')).toBeInTheDocument();
    });

    // Tarjeta Técnica
    expect(container.querySelector('#card-due-technique')).toBeInTheDocument();
    expect(container.querySelector('#metric-due-technique').textContent).toBe('2');

    // Tarjeta Aplicación
    expect(container.querySelector('#card-due-application')).toBeInTheDocument();
    expect(container.querySelector('#metric-due-application').textContent).toBe('1');

    // Tarjeta Demostración
    expect(container.querySelector('#card-due-proof')).toBeInTheDocument();
    expect(container.querySelector('#metric-due-proof').textContent).toBe('1');
  });

  it('3. AC-3: Acción "Entrenar ahora" con recomendación SRS abre la ronda de práctica', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => sampleSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#btn-train-now')).toBeInTheDocument();
    });

    const recommendedTitle = container.querySelector('#recommended-topic-title');
    expect(recommendedTitle.textContent).toContain('Factorización y Fracciones');
    expect(recommendedTitle.textContent).toContain('Técnica');

    const trainNowBtn = container.querySelector('#btn-train-now');
    expect(trainNowBtn).not.toBeDisabled();

    fireEvent.click(trainNowBtn);

    expect(mockOnStartTraining).toHaveBeenCalledTimes(1);
    expect(mockOnStartTraining).toHaveBeenCalledWith('math-vision', {
      _id: 'topic1',
      title: 'Factorización y Fracciones',
      category: 'technique',
    });
  });

  it('4. AC-3: Deshabilita el botón "Entrenar ahora" si no hay recomendaciones pendientes', async () => {
    const noDueSummary = {
      ...sampleSummary,
      dueCount: 0,
      dueByCategory: { technique: 0, application: 0, proof: 0 },
      nextRecommended: null,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => noDueSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#btn-train-now')).toBeInTheDocument();
    });

    const trainNowBtn = container.querySelector('#btn-train-now');
    expect(trainNowBtn).toBeDisabled();
    expect(container.querySelector('#recommended-topic-title').textContent).toContain('Todos los repasos están al día');
  });

  it('5. AC-2: Matriz Tema × Categoría con indicadores visuales y navegación por clic en celda', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => sampleSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#topics-matrix')).toBeInTheDocument();
    });

    expect(container.querySelector('#matrix-row-topic1')).toBeInTheDocument();
    expect(container.querySelector('#matrix-row-topic2')).toBeInTheDocument();

    const cellTopic1Tech = container.querySelector('#matrix-cell-topic1-technique');
    expect(cellTopic1Tech).toBeInTheDocument();
    expect(cellTopic1Tech.textContent).toContain('4.5/5');
    expect(cellTopic1Tech.textContent).toContain('Vencido');

    // Clic en la celda debe invocar onStartTraining para esa pista
    fireEvent.click(cellTopic1Tech);
    expect(mockOnStartTraining).toHaveBeenCalledWith('math-vision', {
      _id: 'topic1',
      title: 'Factorización y Fracciones',
      category: 'technique',
    });

    // Clic en celda de Demostración
    const cellTopic1Proof = container.querySelector('#matrix-cell-topic1-proof');
    fireEvent.click(cellTopic1Proof);
    expect(mockOnStartTraining).toHaveBeenCalledWith('math-vision', {
      _id: 'topic1',
      title: 'Factorización y Fracciones',
      category: 'proof',
    });
  });

  it('6. AC-4: Sección de "Áreas críticas" con pistas score < 3 y botón para repasar', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => sampleSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#critical-tracks-section')).toBeInTheDocument();
    });

    expect(container.querySelector('#critical-tracks-list')).toBeInTheDocument();
    expect(container.querySelector('#critical-tracks-list').textContent).toContain('Ecuaciones Cuadráticas');
    expect(container.querySelector('#critical-tracks-list').textContent).toContain('Score 2.5/5');

    const reviewBtn = container.querySelector('#btn-practice-critical-topic2-application');
    expect(reviewBtn).toBeInTheDocument();

    fireEvent.click(reviewBtn);
    expect(mockOnStartTraining).toHaveBeenCalledWith('math-vision', {
      _id: 'topic2',
      title: 'Ecuaciones Cuadráticas',
      category: 'application',
    });
  });

  it('7. AC-4: Muestra mensaje de felicitación (#no-critical-tracks-msg) cuando no hay áreas críticas', async () => {
    const cleanSummary = {
      ...sampleSummary,
      criticalTracks: [],
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => cleanSummary,
    });

    const { container } = render(<Dashboard onStartTraining={mockOnStartTraining} />);

    await waitFor(() => {
      expect(container.querySelector('#no-critical-tracks-msg')).toBeInTheDocument();
    });

    expect(container.querySelector('#critical-tracks-list')).not.toBeInTheDocument();
    expect(container.querySelector('#no-critical-tracks-msg').textContent).toContain('¡Sin áreas críticas activas!');
  });
});
