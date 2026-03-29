'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SPECIES_OPTIONS = [
  { value: 'white-oak', label: 'White Oak' },
  { value: 'red-oak', label: 'Red Oak' },
  { value: 'walnut', label: 'Walnut' },
  { value: 'hickory', label: 'Hickory' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'maple', label: 'Maple' },
  { value: 'pine', label: 'Pine' },
  { value: 'bamboo', label: 'Bamboo' },
  { value: 'vinyl', label: 'Vinyl' },
];

const SPECIES_GRADE_OPTIONS = {
  'white-oak': [
    { value: 'select', label: 'Select' },
    { value: 'no1-common', label: '#1 Common' },
    { value: 'character', label: 'Character' },
  ],
  'red-oak': [
    { value: 'select', label: 'Select' },
    { value: 'no1-common', label: '#1 Common' },
    { value: 'character', label: 'Character' },
  ],
  walnut: [
    { value: 'select', label: 'Select' },
    { value: 'character', label: 'Character' },
    { value: 'rustic', label: 'Rustic' },
  ],
  hickory: [
    { value: 'select', label: 'Select' },
    { value: 'character', label: 'Character' },
    { value: 'rustic', label: 'Rustic' },
  ],
  cherry: [
    { value: 'select', label: 'Select' },
    { value: 'premium', label: 'Premium' },
    { value: 'character', label: 'Character' },
  ],
  maple: [
    { value: 'select', label: 'Select' },
    { value: 'premium', label: 'Premium' },
    { value: 'character', label: 'Character' },
  ],
  pine: [
    { value: 'clear', label: 'Clear' },
    { value: 'knotty', label: 'Knotty' },
    { value: 'rustic', label: 'Rustic' },
  ],
  bamboo: [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' },
    { value: 'strand', label: 'Strand Woven' },
  ],
  vinyl: [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'rigid-core', label: 'Rigid Core' },
  ],
};

const STAIN_OPTIONS = [
  { value: 'natural', label: 'Natural' },
  { value: 'light', label: 'Light' },
  { value: 'golden', label: 'Golden' },
  { value: 'honey', label: 'Honey' },
  { value: 'medium-brown', label: 'Medium Brown' },
  { value: 'dark-walnut', label: 'Dark Walnut' },
  { value: 'espresso', label: 'Espresso' },
  { value: 'charcoal', label: 'Charcoal' },
  { value: 'whitewashed', label: 'Whitewashed' },
];

const FINISH_OPTIONS = [
  { value: 'matte', label: 'Matte' },
  { value: 'satin', label: 'Satin' },
  { value: 'gloss', label: 'Gloss' },
];

const LAYOUT_OPTIONS = [
  { value: 'plank', label: 'Plank' },
  { value: 'herringbone', label: 'Herringbone' },
  { value: 'chevron', label: 'Chevron' },
  { value: 'versailles', label: 'Versailles' },
];

function waitForVideoReady(video) {
  return new Promise((resolve, reject) => {
    if (!video) {
      reject(new Error('Video element not ready.'));
      return;
    }

    if (video.readyState >= 2) {
      resolve();
      return;
    }

    const onLoaded = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error('Video metadata failed to load.'));
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}

function getCameraErrorMessage(error) {
  const name = error?.name || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera permission was denied. Please allow access and try again.';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera was found on this device.';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera is busy or unavailable. Close other apps using the camera and try again.';
  }

  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'This camera does not support the requested settings.';
  }

  if (!window.isSecureContext) {
    return 'Camera access requires HTTPS.';
  }

  return error?.message || 'Unable to access the camera.';
}

export default function FloorCamera({
  initialLeadContext = {},
  initialSelections = {},
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | loading | live | error
  const [errorMsg, setErrorMsg] = useState('');
  const [controlsOpen, setControlsOpen] = useState(true);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('');
  const [lastCapturePreview, setLastCapturePreview] = useState('');

  const [species, setSpecies] = useState(initialSelections.species || 'white-oak');
  const [grade, setGrade] = useState(initialSelections.grade || '');
  const [stain, setStain] = useState(initialSelections.stain || 'natural');
  const [finish, setFinish] = useState(initialSelections.finish || 'matte');
  const [layout, setLayout] = useState(initialSelections.layout || 'plank');

  const gradeOptions = useMemo(() => {
    return SPECIES_GRADE_OPTIONS[species] || [];
  }, [species]);

  useEffect(() => {
    if (!gradeOptions.length) {
      setGrade('');
      return;
    }

    const exists = gradeOptions.some((option) => option.value === grade);
    if (!exists) {
      setGrade(gradeOptions[0].value);
    }
  }, [grade, gradeOptions]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      setCaptureMessage('');

      if (typeof window === 'undefined') return;

      if (!window.isSecureContext) {
        throw new Error('Camera access requires HTTPS.');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this browser.');
      }

      stopCamera();

      const tryConstraints = [
        {
          audio: false,
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        {
          audio: false,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        {
          audio: false,
          video: true,
        },
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of tryConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError || new Error('Unable to start camera.');
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not available.');
      }

      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;
      video.srcObject = stream;

      await waitForVideoReady(video);

      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        await playPromise;
      }

      setStatus('live');
    } catch (error) {
      console.error('Camera start failed:', error);
      stopCamera();
      setErrorMsg(getCameraErrorMessage(error));
      setStatus('error');
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        stopCamera();
        return;
      }

      if (!document.hidden && status !== 'loading') {
        await startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startCamera, status, stopCamera]);

  const handleCapture = useCallback(async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || status !== 'live') {
        setCaptureMessage('Camera is not ready yet.');
        return;
      }

      setCaptureBusy(true);
      setCaptureMessage('');

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas is not available.');
      }

      ctx.drawImage(video, 0, 0, width, height);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setLastCapturePreview(imageDataUrl);

      const payload = {
        imageDataUrl,
        lead: initialLeadContext,
        selections: {
          species,
          grade,
          stain,
          finish,
          layout,
        },
        metadata: {
          source: 'camera',
          captureType: 'manual',
          capturedAt: new Date().toISOString(),
          pagePath: '/camera',
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
          },
          userAgent: navigator.userAgent,
        },
      };

      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || 'Capture upload failed.');
      }

      setCaptureMessage('Capture saved successfully.');
    } catch (error) {
      console.error('Capture failed:', error);
      setCaptureMessage(error?.message || 'Capture failed.');
    } finally {
      setCaptureBusy(false);
    }
  }, [finish, grade, initialLeadContext, layout, species, stain, status]);

  const activeSpeciesLabel =
    SPECIES_OPTIONS.find((option) => option.value === species)?.label || species;

  const activeGradeLabel =
    gradeOptions.find((option) => option.value === grade)?.label || grade || '—';

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[10px] uppercase tracking-[0.25em] text-neutral-400">
              Leon&apos;s Hardwood Flooring
            </div>
            <div className="truncate text-sm font-semibold md:text-base">
              Live Floor Camera
            </div>
          </div>

          <button
            type="button"
            onClick={() => setControlsOpen((prev) => !prev)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
          >
            {controlsOpen ? 'Hide options' : 'Show options'}
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            status === 'live' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <canvas ref={canvasRef} className="hidden" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap gap-2 md:inset-x-6">
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {activeSpeciesLabel}
          </div>
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {activeGradeLabel}
          </div>
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {STAIN_OPTIONS.find((option) => option.value === stain)?.label}
          </div>
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {FINISH_OPTIONS.find((option) => option.value === finish)?.label}
          </div>
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
            {LAYOUT_OPTIONS.find((option) => option.value === layout)?.label}
          </div>
        </div>

        {status !== 'live' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/65 p-6 text-center shadow-2xl backdrop-blur-xl">
              {status === 'loading' && (
                <>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  <p className="text-sm font-medium text-white">
                    Starting your camera…
                  </p>
                  <p className="mt-2 text-xs text-neutral-300">
                    Allow camera permission if your browser asks for it.
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <p className="text-sm font-semibold text-red-200">
                    We couldn&apos;t access the camera.
                  </p>
                  <p className="mt-2 text-xs text-neutral-300">{errorMsg}</p>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-4 inline-flex rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {status === 'live' && (
          <>
            <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-white/20" />
            <div className="pointer-events-none absolute inset-x-8 bottom-32 z-10 text-center">
              <p className="text-xs font-medium text-white">
                Point the camera toward the floor area.
              </p>
              <p className="mt-1 text-[11px] text-neutral-300">
                Live floor mapping plugs into this camera foundation next.
              </p>
            </div>
          </>
        )}

        <div
          className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 ${
            controlsOpen ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'
          }`}
        >
          <div className="rounded-t-[28px] border-t border-white/10 bg-black/75 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-sm font-semibold">Floor options</div>
                <div className="text-[11px] text-neutral-400">
                  Mobile-friendly selections ready for Supabase sync
                </div>
              </div>

              <button
                type="button"
                onClick={() => setControlsOpen((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-white"
              >
                {controlsOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 pb-24 sm:grid-cols-2">
              <SelectField
                label="Wood species"
                value={species}
                onChange={setSpecies}
                options={SPECIES_OPTIONS}
              />

              <SelectField
                label="Grade"
                value={grade}
                onChange={setGrade}
                options={gradeOptions}
              />

              <SelectField
                label="Stain"
                value={stain}
                onChange={setStain}
                options={STAIN_OPTIONS}
              />

              <SelectField
                label="Finish"
                value={finish}
                onChange={setFinish}
                options={FINISH_OPTIONS}
              />

              <SelectField
                label="Layout"
                value={layout}
                onChange={setLayout}
                options={LAYOUT_OPTIONS}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-neutral-200">
              {status === 'live' ? 'Camera live' : 'Camera not ready'}
            </div>
            <div className="truncate text-[11px] text-neutral-400">
              {captureMessage || 'Use capture to save the current room view.'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastCapturePreview ? (
              <img
                src={lastCapturePreview}
                alt="Latest capture"
                className="h-11 w-11 rounded-xl border border-white/15 object-cover"
              />
            ) : null}

            <button
              type="button"
              onClick={handleCapture}
              disabled={status !== 'live' || captureBusy}
              className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/40 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Capture current camera frame"
            >
              <span className="h-9 w-9 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}