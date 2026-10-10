import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoundSession } from '../src/components/RoundSession';

const SAMPLE_ROUND_PAYLOAD = {
  roundId: '651a2b3c4d5e6f7a8b9c0d99',
  topic: {
    _id: '651a2b3c4d5e6f7a8b9c0d1e',
    title: 'Factorización y Fracciones Algebraicas',
    slug: 'factorizacion-fracciones',
  },
  category: 'technique',
  difficulty: 1,
  totalExpertMinutes: 15,
  exercises: [
    {
      order: 1,
      statement: 'Simplifica la fracción: $$\\frac{x^2 - 9}{x + 3}$$',
      expertMinutes: 5,
    },
    {
      order: 2,
      statement: 'Resuelve la ecuación cuadrática: $$x^2 - 5x + 6 = 0$$',
      expertMinutes: 10,
    },
  ],
};

const SAMPLE_EVALUATION_SUCCESS = {
  roundScore: 4.5,
  passRate: 1.0,
  promoted: true,
  previousDifficulty: 1,
  newDifficulty: 2,
  nextReviewAt: '2026-10-15T12:00:00.000Z',
  results: [
    {
      order: 1,
      score: 5,
      feedback_paso_a_paso: 'Excelente simplificación factorizando diferencia de cuadrados.',
      hint: 'Continúa aplicando el producto notable.',
    },
    {
      order: 2,
      score: 4,
      feedback_paso_a_paso: 'Factorización correcta (x-2)(x-3)=0 con raíces x=2 y x=3.',
      hint: 'Recuerda comprobar las raíces en la ecuación original.',
    },
  ],
  overall_feedback: 'Dominio sólido de los métodos algebraicos elementales.',
};

describe('RoundSession Component Integration & Finite State Machine Tests', () => {
  let mockTrack;
  let mockMediaStream;

  beforeEach(() => {
    mockTrack = {
      stop: vi.fn(),
      kind: 'video',
    };
    mockMediaStream = {
      getTracks: vi.fn(() => [mockTrack]),
    };

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'cam1', label: 'Front' },
        ]),
      },
    });

    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    window.HTMLMediaElement.prototype.pause = vi.fn();

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mockcapturedata');

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AC-1 & AC-7: Estado LOADING inicial llama a POST /api/rounds y renderiza spinner', async () => {
    global.fetch.mockReturnValueOnce(new Promise(() => {})); // Suspende la respuesta

    render(<RoundSession topicId="651a2b3c4d5e6f7a8b9c0d1e" category="technique" />);

    expect(screen.getByText(/Preparando ronda personalizada de ejercicios/i)).toBeInTheDocument();
    expect(screen.queryByText(/Factorización y Fracciones Algebraicas/i)).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/rounds', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: '651a2b3c4d5e6f7a8b9c0d1e',
        category: 'technique',
      }),
    }));
  });

  it('AC-1, AC-2 & AC-6: Estado PRACTICING renderiza #round-header, cronómetro y ejercicios KaTeX', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_ROUND_PAYLOAD,
    });

    const { container } = render(
      <RoundSession topicId="651a2b3c4d5e6f7a8b9c0d1e" category="technique" />
    );

    // 1. #round-header
    await waitFor(() => {
      expect(container.querySelector('#round-header')).toBeInTheDocument();
    });
    expect(screen.getByText(/Factorización y Fracciones Algebraicas/i)).toBeInTheDocument();
    expect(screen.getByText(/Técnica/i)).toBeInTheDocument();
    expect(screen.getByText(/Dificultad 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Un experto lo resuelve en ~15 min/i)).toBeInTheDocument();

    // 2. Cronómetro no bloqueante
    expect(container.querySelector('#round-timer')).toBeInTheDocument();
    expect(screen.getByText(/Tiempo transcurrido: 00:00/i)).toBeInTheDocument();

    // 3. Contenedores de ejercicios ordenados (#round-exercise-1, #round-exercise-2)
    const ex1 = container.querySelector('#round-exercise-1');
    const ex2 = container.querySelector('#round-exercise-2');
    expect(ex1).toBeInTheDocument();
    expect(ex2).toBeInTheDocument();
    expect(ex1).toHaveTextContent(/Ejercicio #1/i);
    expect(ex2).toHaveTextContent(/Ejercicio #2/i);

    // 4. Botón de transición a captura (#btn-finish-round)
    const finishBtn = container.querySelector('#btn-finish-round');
    expect(finishBtn).toBeInTheDocument();
    expect(finishBtn).toHaveTextContent(/Ya terminé, capturar/i);
  });

  it('AC-3: Transiciona a CAPTURING al pulsar #btn-finish-round y valida galería de 1 a 6 fotos', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_ROUND_PAYLOAD,
    });

    const { container } = render(
      <RoundSession topicId="651a2b3c4d5e6f7a8b9c0d1e" category="technique" />
    );

    const finishBtn = await screen.findByRole('button', { name: /ya terminé, capturar/i });
    fireEvent.click(finishBtn);

    // En estado CAPTURING
    expect(screen.getByText(/Captura fotográfica de tu libreta \(1 a 6 fotos\)/i)).toBeInTheDocument();
    expect(container.querySelector('#photo-capture-gallery')).toBeInTheDocument();

    const submitBtn = container.querySelector('#btn-submit-round');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled(); // 0 fotos deshabilitado

    // Activar cámara y capturar 1 foto
    const activateCameraBtn = screen.getByRole('button', { name: /activar cámara/i });
    fireEvent.click(activateCameraBtn);

    const takePhotoBtn = await screen.findByRole('button', { name: /📸 tomar foto/i });
    fireEvent.click(takePhotoBtn);

    // Ahora hay 1 foto: #btn-submit-round se habilita
    expect(submitBtn).toBeEnabled();
    expect(screen.getByText(/1 de 6 fotos agregadas/i)).toBeInTheDocument();

    // Eliminar la foto individual
    const deleteBtn = screen.getByLabelText(/eliminar foto 1/i);
    fireEvent.click(deleteBtn);

    // Vuelve a estar en 0 fotos y submit deshabilitado
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/0 de 6 fotos agregadas/i)).toBeInTheDocument();
  });

  it('AC-4: Maneja respuesta 422 en RECOVERY_422 mostrando alerta y permitiendo reenviar', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => SAMPLE_ROUND_PAYLOAD,
      })
      .mockResolvedValueOnce({
        status: 422,
        ok: false,
        json: async () => ({
          error: 'exercises_not_found',
          missing: [2],
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => SAMPLE_EVALUATION_SUCCESS,
      });

    const { container } = render(
      <RoundSession topicId="651a2b3c4d5e6f7a8b9c0d1e" category="technique" />
    );

    // Pasar a captura
    fireEvent.click(await screen.findByRole('button', { name: /ya terminé, capturar/i }));

    // Simular archivo subido
    const fileInput = screen.getByTestId('camera-fallback-file-input');
    const file = new File(['dummy'], 'cuaderno.jpg', { type: 'image/jpeg' });
    class MockFileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,page1' } });
          }
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Enviar a evaluar
    const submitBtn = await screen.findByRole('button', { name: /enviar a evaluar/i });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    fireEvent.click(submitBtn);

    // Debe mostrar la alerta 422 (#alert-missing-exercises)
    await waitFor(() => {
      expect(container.querySelector('#alert-missing-exercises')).toBeInTheDocument();
    });
    expect(screen.getByText(/#2/i)).toBeInTheDocument();
    expect(screen.getByText(/La IA no encontró el procedimiento de los siguientes ejercicios/i)).toBeInTheDocument();

    // Las fotos previas deben preservarse (1 foto)
    expect(screen.getByText(/1 de 6 fotos agregadas/i)).toBeInTheDocument();

    // Agregar segunda foto (hoja faltante)
    const currentFileInput = container.querySelector('#camera-fallback-file-input');
    const file2 = new File(['dummy2'], 'cuaderno_pag2.jpg', { type: 'image/jpeg' });
    class MockFileReader2 {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,page2' } });
          }
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader2);
    fireEvent.change(currentFileInput, { target: { files: [file2] } });

    await waitFor(() => {
      expect(screen.getByText(/2 de 6 fotos agregadas/i)).toBeInTheDocument();
    });

    // Reenviar a evaluar
    const currentSubmitBtn = container.querySelector('#btn-submit-round');
    fireEvent.click(currentSubmitBtn);

    // Debe llegar a la pantalla de resultados (#round-results)
    await waitFor(() => {
      expect(container.querySelector('#round-results')).toBeInTheDocument();
    });
  });

  it('AC-5 & AC-6: Renderiza RoundResults con #round-results, #round-progression y badges', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => SAMPLE_ROUND_PAYLOAD,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => SAMPLE_EVALUATION_SUCCESS,
      });

    const { container } = render(
      <RoundSession topicId="651a2b3c4d5e6f7a8b9c0d1e" category="technique" />
    );

    // Ir a captura
    fireEvent.click(await screen.findByRole('button', { name: /ya terminé, capturar/i }));

    // Simular subida de foto
    const fileInput = screen.getByTestId('camera-fallback-file-input');
    const file = new File(['dummy'], 'cuaderno.jpg', { type: 'image/jpeg' });
    class MockFileReaderFull {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,fullsolution' } });
          }
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReaderFull);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Enviar evaluación
    const submitBtn = await screen.findByRole('button', { name: /enviar a evaluar/i });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    fireEvent.click(submitBtn);

    // Verificar contenedor #round-results
    await waitFor(() => {
      expect(container.querySelector('#round-results')).toBeInTheDocument();
    });

    // Verificar dictamen adaptativo (#round-progression)
    const progressionEl = container.querySelector('#round-progression');
    expect(progressionEl).toBeInTheDocument();
    expect(progressionEl).toHaveTextContent(/¡Felicidades! Subes a dificultad 2 en Técnica para el próximo repaso/i);

    // Verificar scores y desglose
    expect(screen.getByText(/4.5 \/ 5.0/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument(); // passRate 1.0

    // Ejercicios individuales
    expect(container.querySelector('#round-exercise-result-1')).toBeInTheDocument();
    expect(container.querySelector('#round-exercise-result-2')).toBeInTheDocument();
    expect(screen.getByText(/Excelente simplificación factorizando diferencia de cuadrados/i)).toBeInTheDocument();
    expect(screen.getByText(/Continúa aplicando el producto notable/i)).toBeInTheDocument();
  });
});
