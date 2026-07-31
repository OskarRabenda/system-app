import { useEffect, useRef, useState } from "react";

type Props = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  /** Shown under the viewfinder — lookup progress or an error. */
  status?: string | null;
};

const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
] as const;

type DetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

/**
 * Camera barcode scanner.
 *
 * Uses the native BarcodeDetector where it exists (Chrome, Edge, Android) and
 * falls back to ZXing elsewhere (Safari, Firefox), which is why the decoder is
 * imported lazily — most users never download it.
 */
export default function BarcodeScanner({ onDetected, onClose, status }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<string>("starting");
  const doneRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null;
    let raf = 0;
    let stopZxing: (() => void) | null = null;
    let cancelled = false;

    const hit = (code: string) => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      onDetected(code);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) return;
        video.srcObject = stream;
        await video.play();

        const Native = (
          window as unknown as {
            BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike;
          }
        ).BarcodeDetector;

        if (Native) {
          setEngine("native");
          const detector = new Native({ formats: [...FORMATS] });
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const found = await detector.detect(video);
              if (found[0]?.rawValue) {
                hit(found[0].rawValue);
                return;
              }
            } catch {
              // A frame can fail to decode; keep going.
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          setEngine("zxing");
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          if (cancelled) return;
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoElement(
            video,
            (result) => {
              if (result) hit(result.getText());
            },
          );
          stopZxing = () => controls.stop();
        }
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission denied. Allow it in your browser to scan."
            : name === "NotFoundError"
              ? "No camera found on this device."
              : "Could not start the camera.",
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopZxing?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="scan">
      <div className="scan-view">
        <video ref={videoRef} playsInline muted />
        <span className="scan-frame" aria-hidden="true" />
      </div>
      <p className="sheet-hint">
        {error ??
          status ??
          (engine === "starting"
            ? "Starting camera…"
            : "Point at the barcode on the packet.")}
      </p>
      <button type="button" className="ghost-btn wide" onClick={onClose}>
        Back to search
      </button>
    </div>
  );
}
