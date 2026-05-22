'use client';

// app/halal-scanner/components/BarcodeScanner.tsx
// Live camera barcode + QR code scanner using ZXing (free, open source)

import { useEffect, useRef, useState, useCallback } from 'react';

interface BarcodeScannerProps {
  onResult: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

export default function BarcodeScanner({ onResult, onError, isActive }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastResultRef = useRef<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [ZXing, setZXing] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);

  // Dynamically load ZXing
  useEffect(() => {
    if (!isActive) return;

    const loadZXing = async () => {
      try {
        // @ts-ignore
        const zxing = await import('@zxing/browser');
        // @ts-ignore
        const lib = await import('@zxing/library');
        setZXing({ browser: zxing, library: lib });

        const hints = new Map();
        hints.set(lib.DecodeHintType.TRY_HARDER, true);
        hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, [
          lib.BarcodeFormat.EAN_13,
          lib.BarcodeFormat.EAN_8,
          lib.BarcodeFormat.UPC_A,
          lib.BarcodeFormat.UPC_E,
          lib.BarcodeFormat.CODE_128,
          lib.BarcodeFormat.CODE_39,
          lib.BarcodeFormat.QR_CODE,
          lib.BarcodeFormat.DATA_MATRIX,
        ]);

        const r = new zxing.BrowserMultiFormatReader(hints);
        setReader(r);
      } catch {
        // Fallback: use BarcodeDetector API (Chrome/Edge native)
        setZXing({ native: true });
      }
    };

    loadZXing();
  }, [isActive]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
    if (reader) {
      try { reader.reset(); } catch {}
    }
  }, [reader]);

  const handleScanResult = useCallback(
    (value: string) => {
      if (!value || value === lastResultRef.current) return;
      lastResultRef.current = value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        stopCamera();
        setStatus('idle');
        onResult(value);
      }, 300);
    },
    [onResult, stopCamera]
  );

  const scanWithNative = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanWithNative);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // @ts-ignore
      if (typeof BarcodeDetector === 'undefined') throw new Error('BarcodeDetector not available');
      // @ts-ignore
      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix'],
      });
      // @ts-ignore
      const barcodes = await detector.detect(canvas);
      if (barcodes.length > 0) {
        handleScanResult(barcodes[0].rawValue);
      }
    } catch {
      if (ZXing?.native) {
        setErrorMessage('Native barcode scanning is not supported by this browser.');
      }
    }

    animFrameRef.current = requestAnimationFrame(scanWithNative);
  }, [ZXing?.native, handleScanResult]);

  const startCamera = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    lastResultRef.current = '';

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(Boolean(capabilities?.torch));
      setTorchOn(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('scanning');

      if (reader && ZXing && !ZXing.native && videoRef.current) {
        try {
          const deviceId = track.getSettings?.()?.deviceId;
          const callback = (result: any) => {
            if (!result) return;
            const value = typeof result.getText === 'function' ? result.getText() : result;
            handleScanResult(value);
          };

          if (deviceId && typeof reader.decodeFromVideoDevice === 'function') {
            reader.decodeFromVideoDevice(deviceId, videoRef.current, callback);
          } else if (typeof reader.decodeFromVideoElementContinuously === 'function') {
            reader.decodeFromVideoElementContinuously(videoRef.current, callback);
          } else if (typeof reader.decodeFromVideoElement === 'function') {
            reader.decodeFromVideoElement(videoRef.current, callback);
          } else if (typeof reader.decodeFromStream === 'function') {
            reader.decodeFromStream(stream, videoRef.current, (result: any) => callback(result));
          } else {
            scanWithNative();
          }
        } catch {
          scanWithNative();
        }
      } else {
        scanWithNative();
      }
    } catch (err: any) {
      setStatus('error');
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`;
      setErrorMessage(msg);
      onError?.(msg);
    }
  }, [reader, ZXing, onError, scanWithNative, handleScanResult]);

  useEffect(() => {
    if (isActive && (reader || ZXing?.native)) {
      startCamera();
    } else if (!isActive) {
      stopCamera();
      setStatus('idle');
    }
    return () => stopCamera();
  }, [isActive, reader, ZXing, startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities?.torch) {
      setErrorMessage('Flash is not supported on this device.');
      return;
    }
    try {
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState } as any] });
      setTorchOn(newState);
    } catch {
      setErrorMessage('Unable to toggle flash on this device.');
    }
  };

  if (!isActive) return null;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Corner brackets */}
            <div className="relative w-56 h-56">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              {/* Scan line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 opacity-80 animate-scan-line" />
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white text-sm font-medium">Starting camera...</p>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-red-400 font-semibold mb-2">Camera Error</p>
            <p className="text-white/70 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Torch button */}
        {status === 'scanning' && (
          <button
            onClick={toggleTorch}
            disabled={!torchSupported}
            className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              torchOn ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white hover:bg-white/30'
            } ${!torchSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={torchSupported ? 'Toggle flashlight' : 'Flash not supported'}
          >
            🔦
          </button>
        )}
      </div>

      {/* Instruction */}
      {status === 'scanning' && (
        <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-3 font-medium">
          Point your camera at any barcode or QR code
        </p>
      )}

      {/* CSS for scan line animation */}
      <style jsx>{`
        @keyframes scan-line {
          0% { top: 8px; }
          50% { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}