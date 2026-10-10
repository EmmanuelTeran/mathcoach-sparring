import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoundResults } from '../src/components/RoundResults';

const SAMPLE_ROUND = {
  roundId: 'round-123',
  category: 'technique',
  difficulty: 1,
  topic: {
    title: 'Factorización Cuadrática',
  },
  exercises: [
    { order: 1, statement: 'Factoriza $$x^2 - 4$$' },
    { order: 2, statement: 'Simplifica $$\\frac{x^2 - 1}{x - 1}$$' },
  ],
};

const SAMPLE_EVALUATION_PROMOTED = {
  roundScore: 4.8,
  passRate: 1.0,
  promoted: true,
  previousDifficulty: 1,
  newDifficulty: 2,
  nextReviewAt: '2026-10-18T10:00:00.000Z',
  overall_feedback: 'Excelente rigor y uso de identidades algebraicas.',
  results: [
    {
      order: 1,
      score: 5,
      feedback_paso_a_paso: 'Identificación correcta de diferencia de cuadrados (x+2)(x-2).',
      hint: 'Continúa aplicando el método.',
    },
    {
      order: 2,
      score: 4,
      feedback_paso_a_paso: 'Factorización y cancelación limpia, especificando restricción x != 1.',
      hint: 'Recuerda enfatizar el dominio.',
    },
  ],
};

const SAMPLE_EVALUATION_NOT_PROMOTED = {
  roundScore: 2.2,
  passRate: 0.5,
  promoted: false,
  previousDifficulty: 1,
  newDifficulty: 1,
  nextReviewAt: '2026-10-11T10:00:00.000Z',
  overall_feedback: 'Se detectaron fallos en la simplificación algebraica.',
  results: [
    {
      order: 1,
      score: 3,
      feedback_paso_a_paso: 'Planteamiento inicial aceptable con error de signos al final.',
      hint: 'Revisa leyes de signos.',
    },
  ],
};

describe('RoundResults Component Unit Tests', () => {
  it('AC-5 & AC-6: renderiza contenedor #round-results, dictamen de ascenso en #round-progression y fecha SRS', () => {
    const { container } = render(
      <RoundResults round={SAMPLE_ROUND} evaluation={SAMPLE_EVALUATION_PROMOTED} />
    );

    expect(container.querySelector('#round-results')).toBeInTheDocument();
    
    // Progresión con ascenso
    const progressionEl = container.querySelector('#round-progression');
    expect(progressionEl).toBeInTheDocument();
    expect(progressionEl).toHaveTextContent(/¡Felicidades! Subes a dificultad 2 en Técnica para el próximo repaso/i);
    expect(progressionEl).toHaveTextContent(/Repaso agendado:/i);

    // Score y Aprobación
    expect(screen.getByText(/4.8 \/ 5.0/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument();

    // Desglose por ejercicio
    expect(container.querySelector('#round-exercise-result-1')).toBeInTheDocument();
    expect(container.querySelector('#round-exercise-result-2')).toBeInTheDocument();
    expect(screen.getByText(/Identificación correcta de diferencia de cuadrados/i)).toBeInTheDocument();
    expect(screen.getByText(/Recuerda enfatizar el dominio/i)).toBeInTheDocument();
  });

  it('AC-5: renderiza dictamen de permanencia cuando promoted es false', () => {
    const { container } = render(
      <RoundResults round={SAMPLE_ROUND} evaluation={SAMPLE_EVALUATION_NOT_PROMOTED} />
    );

    const progressionEl = container.querySelector('#round-progression');
    expect(progressionEl).toBeInTheDocument();
    expect(progressionEl).toHaveTextContent(/Te mantienes en dificultad 1 en Técnica/i);
    expect(screen.getByText(/2.2 \/ 5.0/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('dispara onRestart y onGoToDashboard cuando se pulsan los botones correspondientes', () => {
    const onRestartMock = vi.fn();
    const onDashboardMock = vi.fn();

    render(
      <RoundResults
        round={SAMPLE_ROUND}
        evaluation={SAMPLE_EVALUATION_PROMOTED}
        onRestart={onRestartMock}
        onGoToDashboard={onDashboardMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /iniciar nueva práctica/i }));
    expect(onRestartMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /volver al panel/i }));
    expect(onDashboardMock).toHaveBeenCalledTimes(1);
  });
});
