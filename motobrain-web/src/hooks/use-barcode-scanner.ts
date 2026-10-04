'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScannerStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'error-permission'
  | 'error-no-camera'
  | 'error-insecure';

interface UseBarcodeScannerOptions {
  /** Mientras sea true, la camara se mantiene abierta (p. ej. todo el escaneo rapido). */
  active: boolean;
  onDetect: (code: string) => void;
  /** No vuelve a avisar el mismo codigo antes de este tiempo. */
  debounceMs?: number;
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf', 'codabar'];

export function useBarcodeScanner({ active, onDetect, debounceMs = 2000 }: UseBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');

  const handleDetected = useCallback(
    (code: string) => {
      const now = Date.now();
      const last = lastCodeRef.current;
      if (last && last.code === code && now - last.at < debounceMs) return;
      lastCodeRef.current = { code, at: now };
      onDetect(code);
    },
    [onDetect, debounceMs],
  );

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('starting');

    async function start() {
      if (typeof window === 'undefined') return;
      if (!window.isSecureContext) {
        setStatus('error-insecure');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error-no-camera');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (err) {
        const e = err as DOMException;
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') setStatus('error-permission');
        else setStatus('error-no-camera');
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // autoplay bloqueado por el navegador: el usuario puede tocar la pantalla
      }
      if (cancelled) return;
      setStatus('scanning');

      const DetectorCtor = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;

      if (DetectorCtor) {
        const detector = new DetectorCtor({ formats: FORMATS });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) handleDetected(codes[0].rawValue);
          } catch {
            // frame invalido todavia (video sin datos), se reintenta solo
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) handleDetected(result.getText());
        });
        if (cancelled) {
          controls.stop();
        } else {
          zxingControlsRef.current = controls;
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, status, stop };
}
