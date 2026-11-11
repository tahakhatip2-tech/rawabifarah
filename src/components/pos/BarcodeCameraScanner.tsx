"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Flashlight,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  Keyboard,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export interface ScanLookupOutcome {
  ok: boolean;
  label?: string;
  price?: number;
  message?: string;
}

interface BarcodeCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanCode: (code: string) => Promise<ScanLookupOutcome>;
  cartCount: number;
  grandTotal: number;
}

type FeedbackState = {
  ok: boolean;
  code: string;
  label?: string;
  price?: number;
  message: string;
  at: number;
} | null;

function playBeep(kind: "success" | "error") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "success" ? "sine" : "triangle";
    if (kind === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(210, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch {
    // Audio playback may be blocked by browser autoplay policy
  }
}

export function BarcodeCameraScanner({
  isOpen,
  onClose,
  onScanCode,
  cartCount,
  grandTotal,
}: BarcodeCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onScanRef = useRef(onScanCode);
  const soundEnabledRef = useRef(true);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const inFlightRef = useRef(false);

  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "starting" | "scanning" | "error"
  >("idle");
  const [engineName, setEngineName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [manualCode, setManualCode] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    onScanRef.current = onScanCode;
  }, [onScanCode]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        // Ignore cleanup errors
      }
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const handleDetectedCode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    if (
      lastScanRef.current.code === code &&
      now - lastScanRef.current.at < 1350
    ) {
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    lastScanRef.current = { code, at: now };

    try {
      const outcome = await onScanRef.current(code);
      if (soundEnabledRef.current) {
        playBeep(outcome.ok ? "success" : "error");
      }
      setFeedback({
        ok: outcome.ok,
        code,
        label: outcome.label,
        price: outcome.price,
        message:
          outcome.message ||
          (outcome.ok ? "تمت الإضافة إلى التذكرة" : "الصنف غير مسجل"),
        at: Date.now(),
      });
    } catch {
      if (soundEnabledRef.current) playBeep("error");
      setFeedback({
        ok: false,
        code,
        message: "تعذر قراءة بيانات الصنف",
        at: Date.now(),
      });
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    let controls: IScannerControls | null = null;
    let timerId: number | null = null;

    const startCamera = async () => {
      setStatus("starting");
      setErrorMessage(null);

      if (
        typeof window === "undefined" ||
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        const insecure =
          typeof window !== "undefined" && window.isSecureContext === false;
        setStatus("error");
        setErrorMessage(
          insecure
            ? "يتطلب تشغيل الكاميرا فتح الموقع عبر اتصال آمن (HTTPS أو localhost)."
            : "هذا المتصفح لا يدعم تشغيل الكاميرا مباشرة."
        );
        return;
      }

      try {
        stopStream();
        const videoConstraints: MediaTrackConstraints = selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
          return;
        }

        streamRef.current = stream;

        const videoEl = videoRef.current;
        if (!videoEl) {
          stopStream();
          return;
        }

        videoEl.srcObject = stream;
        await videoEl.play().catch(() => {});

        // Populate available video cameras after permission grant
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = allDevices
            .filter((d) => d.kind === "videoinput")
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `كاميرا ${idx + 1}`,
            }));
          if (!cancelled) {
            setCameras(videoInputs);
            const activeTrack = stream.getVideoTracks()[0];
            const activeId = activeTrack?.getSettings?.().deviceId;
            if (!selectedDeviceId && activeId) {
              setSelectedDeviceId(activeId);
            }
            const caps = activeTrack?.getCapabilities?.() as
              | (MediaTrackCapabilities & { torch?: boolean })
              | undefined;
            setTorchSupported(Boolean(caps && "torch" in caps && caps.torch));
          }
        } catch {
          // Device enumeration optional
        }

        // Check native BarcodeDetector support first
        const NativeBarcodeDetector = (
          window as unknown as {
            BarcodeDetector?: {
              new (opts?: { formats?: string[] }): {
                detect: (
                  src: HTMLVideoElement
                ) => Promise<Array<{ rawValue?: string }>>;
              };
              getSupportedFormats?: () => Promise<string[]>;
            };
          }
        ).BarcodeDetector;

        let useNative = false;
        if (NativeBarcodeDetector) {
          try {
            const supported = NativeBarcodeDetector.getSupportedFormats
              ? await NativeBarcodeDetector.getSupportedFormats()
              : ["ean_13", "ean_8", "code_128", "upc_a"];
            if (supported.includes("ean_13") || supported.includes("code_128")) {
              useNative = true;
            }
          } catch {
            useNative = false;
          }
        }

        if (cancelled) return;

        if (useNative && NativeBarcodeDetector) {
          setEngineName("BarcodeDetector");
          setStatus("scanning");
          const detector = new NativeBarcodeDetector({
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "qr_code",
            ],
          });

          const tick = async () => {
            if (cancelled) return;
            try {
              if (
                videoEl.readyState >= 2 &&
                videoEl.videoWidth > 0 &&
                !inFlightRef.current
              ) {
                const results = await detector.detect(videoEl);
                const hit = results.find((r) => Boolean(r.rawValue?.trim()));
                if (hit?.rawValue) {
                  await handleDetectedCode(hit.rawValue);
                }
              }
            } catch {
              // Ignore single-frame detection errors
            }
            if (!cancelled) {
              timerId = window.setTimeout(tick, 180);
            }
          };
          timerId = window.setTimeout(tick, 180);
          return;
        }

        // Fallback to ZXing WASM/JS decoder (works on Safari, Firefox, Desktop)
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([
            import("@zxing/browser"),
            import("@zxing/library"),
          ]);

        if (cancelled) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 180,
          delayBetweenScanSuccess: 900,
        });

        setEngineName("ZXing Scanner");
        setStatus("scanning");

        controls = await reader.decodeFromStream(stream, videoEl, (result) => {
          if (cancelled || !result) return;
          const text = result.getText();
          if (text) {
            void handleDetectedCode(text);
          }
        });
      } catch (err) {
        if (cancelled) return;
        stopStream();
        setStatus("error");
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setErrorMessage(
            "تم رفض إذن الكاميرا. يرجى السماح للمتصفح بالوصول إلى الكاميرا من إعدادات العنوان ثم إعادة المحاولة."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setErrorMessage(
            "لم يتم العثور على كاميرا متصلة بهذا الجهاز. يمكنك إدخال رقم الباركود يدوياً أدناه."
          );
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setErrorMessage(
            "الكاميرا مشغولة حالياً بتطبيق آخر. أغلِق التطبيق الآخر ثم اضغط إعادة المحاولة."
          );
        } else {
          setErrorMessage(
            "تعذر تشغيل الكاميرا. يمكنك التحقق من الأذونات أو إدخال الباركود يدوياً أدناه."
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      if (controls) {
        try {
          controls.stop();
        } catch {
          // Ignore controls stop errors
        }
      }
      stopStream();
    };
  }, [isOpen, selectedDeviceId, retryToken, handleDetectedCode, stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // Torch constraint rejected on this hardware
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.trim();
    if (!cleaned) return;
    await handleDetectedCode(cleaned);
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="ماسح الباركود بالكاميرا"
    >
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>ماسح الباركود بالكاميرا</span>
                {status === "scanning" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    جاهز للمسح
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-400">
                وجّه ملصق الباركود أمام الكاميرا لإضافة المنتج تلقائياً إلى الفاتورة
                {engineName ? ` (${engineName})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl border text-xs transition ${
                  torchOn
                    ? "bg-amber-500 text-stone-950 border-amber-400"
                    : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                }`}
                title="تشغيل/إطفاء الفلاش"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition"
              title={soundEnabled ? "كتم صوت التنبيه" : "تفعيل صوت التنبيه"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-red-900/60 border border-stone-700 text-stone-300 hover:text-white transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Selector (when multiple cameras exist) */}
        {cameras.length > 1 && (
          <div className="px-4 py-2 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-400 shrink-0">اختيار الكاميرا:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="flex-1 max-w-xs px-2.5 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-amber-500"
            >
              {cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Viewport */}
        <div className="relative bg-black aspect-[16/10] sm:aspect-video w-full overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Aiming Overlay when scanning */}
          {status === "scanning" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-72 max-w-[82%] h-36 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]">
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
              </div>
            </div>
          )}

          {/* Starting Indicator */}
          {status === "starting" && (
            <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center gap-2 text-stone-300 text-xs">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
              <span>جاري تشغيل الكاميرا وتهيئة قارئ الباركود...</span>
            </div>
          )}

          {/* Error Overlay */}
          {status === "error" && (
            <div className="absolute inset-0 bg-stone-950/95 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <CameraOff className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-red-200 max-w-md leading-relaxed">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => setRetryToken((t) => t + 1)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة محاولة تشغيل الكاميرا</span>
              </button>
            </div>
          )}

          {/* Last Scan Toast */}
          {feedback && (
            <div
              key={feedback.at}
              className={`absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-xl border backdrop-blur-md flex items-center justify-between gap-2 text-xs shadow-lg ${
                feedback.ok
                  ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100"
                  : "bg-red-950/90 border-red-500/50 text-red-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {feedback.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {feedback.label ? `${feedback.label} — ` : ""}
                    {feedback.message}
                  </div>
                  <div className="text-[10px] opacity-75 font-mono" dir="ltr">
                    {feedback.code}
                  </div>
                </div>
              </div>
              {feedback.ok && typeof feedback.price === "number" && (
                <span className="font-mono font-black text-amber-400 shrink-0">
                  {formatCurrency(feedback.price)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Manual Barcode Fallback + Live Ticket Status */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                dir="ltr"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="إدخال رقم الباركود يدوياً (مثال: 200...)"
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs font-mono text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 text-right"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shrink-0 transition"
            >
              إضافة
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-stone-800/80 text-xs">
            <div className="flex items-center gap-2 text-stone-300">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>
                الأصناف بالتذكرة:{" "}
                <strong className="font-mono text-white">{cartCount}</strong>
              </span>
              <span className="text-stone-600">|</span>
              <span>
                الإجمالي:{" "}
                <strong className="font-mono text-amber-400">
                  {formatCurrency(grandTotal)}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition"
            >
              العودة للفاتورة والدفع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

