import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MathVisionUploader } from '../src/components/MathVisionUploader';

describe('MathVisionUploader Integration & Unit Tests', () => {
  let mockMediaStream;
  let mockTrack;

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
          { kind: 'videoinput', deviceId: 'cam2', label: 'Back' },
        ]),
      },
    });

    // Mock HTMLMediaElement play / pause
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    window.HTMLMediaElement.prototype.pause = vi.fn();

    // Mock HTMLCanvasElement
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mockbase64jpegstring');

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AC-1: renderiza estado inicial IDLE sin activar la cámara', async () => {
    render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    expect(await screen.findByRole('button', { name: /activar cámara/i })).toBeInTheDocument();
    expect(global.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('AC-1: solicita permisos con constraints correctos al hacer clic en Activar Cámara', async () => {
    render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    const activateBtn = screen.getByRole('button', { name: /activar cámara/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    });

    // Debe mostrar controles en vivo
    expect(await screen.findByRole('button', { name: /tomar foto/i })).toBeInTheDocument();
  });

  it('AC-1: maneja permisos denegados mostrando mensaje y fallback de archivo', async () => {
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    global.navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(error);

    render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    const activateBtn = screen.getByRole('button', { name: /activar cámara/i });
    fireEvent.click(activateBtn);

    expect(
      await screen.findByText(/acceso a la cámara bloqueado/i)
    ).toBeInTheDocument();

    const fileInput = screen.getByTestId('camera-fallback-file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('AC-1: limpia y detiene los tracks del stream al desmontar el componente', async () => {
    const { unmount } = render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    fireEvent.click(screen.getByRole('button', { name: /activar cámara/i }));
    await screen.findByRole('button', { name: /tomar foto/i });

    unmount();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('AC-2 & AC-3: captura imagen con canvas, detiene el stream y entra en estado preview', async () => {
    render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    fireEvent.click(screen.getByRole('button', { name: /activar cámara/i }));
    const captureBtn = await screen.findByRole('button', { name: /tomar foto/i });

    fireEvent.click(captureBtn);

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: /repetir foto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evaluar con ia/i })).toBeInTheDocument();
  });

  it('AC-3: permite repetir la foto y volver al stream de video en vivo', async () => {
    render(<MathVisionUploader topic={{ _id: '123', title: 'Álgebra' }} />);

    fireEvent.click(screen.getByRole('button', { name: /activar cámara/i }));
    const captureBtn = await screen.findByRole('button', { name: /tomar foto/i });
    fireEvent.click(captureBtn);

    const repeatBtn = await screen.findByRole('button', { name: /repetir foto/i });
    fireEvent.click(repeatBtn);

    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('button', { name: /tomar foto/i })).toBeInTheDocument();
  });

  it('AC-4, AC-5 & AC-6: envía POST /api/evaluate-math y muestra los resultados y badge pedagógico', async () => {
    const mockApiResponse = {
      success: true,
      score: 4,
      feedback_paso_a_paso: 'Paso 1: Planteamiento y factorización correctos. Paso 2: Error menor.',
      hint: 'Recuerda que (a - b) = -(b - a) antes de cancelar factores comunes.',
      srs: {
        repetition: 2,
        interval: 6,
        efactor: 2.6,
        dueDate: '2026-10-15T07:15:00.000Z',
      },
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const onEvaluationComplete = vi.fn();

    render(
      <MathVisionUploader
        topic={{ _id: '651a2b3c4d5e6f7a8b9c0d1e', title: 'Factorización', level: 1, source: 'CONAMAT' }}
        onEvaluationComplete={onEvaluationComplete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /activar cámara/i }));
    const captureBtn = await screen.findByRole('button', { name: /tomar foto/i });
    fireEvent.click(captureBtn);

    const evalBtn = await screen.findByRole('button', { name: /evaluar con ia/i });
    fireEvent.click(evalBtn);

    // Debe mostrar estado analizando
    expect(screen.getByText(/el profesor de ia está evaluando tus deducciones matemáticas/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/evaluate-math', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    // Validar payload enviado
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.problemId).toBe('651a2b3c4d5e6f7a8b9c0d1e');
    expect(requestBody.image).toBe('data:image/jpeg;base64,mockbase64jpegstring');

    // Validar que se muestren los resultados
    expect(await screen.findByText(/4 \/ 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Planteamiento y factorización correctos/i)).toBeInTheDocument();
    expect(screen.getByText(/Recuerda que \(a - b\) = -\(b - a\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reprogramado para repaso en 6 días/i)).toBeInTheDocument();
    expect(onEvaluationComplete).toHaveBeenCalledWith(mockApiResponse);
  });

  it('AC-5: gestiona error en respuesta del backend y permite reintentar', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Error interno en Gemini' }),
    });

    render(
      <MathVisionUploader
        topic={{ _id: '651a2b3c4d5e6f7a8b9c0d1e', title: 'Factorización' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /activar cámara/i }));
    const captureBtn = await screen.findByRole('button', { name: /tomar foto/i });
    fireEvent.click(captureBtn);

    const evalBtn = await screen.findByRole('button', { name: /evaluar con ia/i });
    fireEvent.click(evalBtn);

    expect(await screen.findByText(/error al evaluar con la ia/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /reintentar envío/i });
    expect(retryBtn).toBeInTheDocument();
  });

  it('AC-1 fallback: permite seleccionar archivo si no hay cámara y procesa a Base64', async () => {
    render(
      <MathVisionUploader
        topic={{ _id: '651a2b3c4d5e6f7a8b9c0d1e', title: 'Factorización' }}
      />
    );

    // Provocamos fallback o usamos botón de subida manual
    const manualBtn = screen.getByRole('button', { name: /subir foto manualmente/i });
    fireEvent.click(manualBtn);

    const fileInput = screen.getByTestId('camera-fallback-file-input');
    const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(function () {
        this.onload({ target: { result: 'data:image/jpeg;base64,fromfile' } });
      }),
      onload: null,
    };
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByRole('button', { name: /evaluar con ia/i })).toBeInTheDocument();
  });
});
