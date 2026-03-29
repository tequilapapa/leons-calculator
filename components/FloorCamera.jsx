'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FloorOverlayEngine from '@/lib/camera/overlay-engine';

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

function humanize(value) {
  if (!value) return '—';
  return value
    .split('-')
    .map((part) => {
      if (part === 'no1') return '#1';
      if (part === 'qs') return 'QS';
      if (part === 'ls') return 'LS';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))].map((value) => ({
    value,
    label: humanize(value),
  }));
}

export default function FloorCamera({
  initialLeadContext = {},
  initialSelections = {},
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const floorGuideCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const overlayEngineRef = useRef(null);
  const sessionSyncTimeoutRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [controlsOpen, setControlsOpen] = useState(true);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureMessage, setCaptureMessage] = useState('');
  const [lastCapturePreview, setLastCapturePreview] = useState('');

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [arSessionId, setArSessionId] = useState('');
  const [sessionSaveState, setSessionSaveState] = useState('idle');

  const [species, setSpecies] = useState(initialSelections.species || '');
  const [cutType, setCutType] = useState(initialSelections.cutType || '');
  const [grade, setGrade] = useState(initialSelections.grade || '');
  const [stain, setStain] = useState(initialSelections.stain || '');
  const [finish, setFinish] = useState(initialSelections.finish || '');
  const [layout, setLayout] = useState(initialSelections.layout || 'plank');

  const [floorPolygon, setFloorPolygon] = useState([
    { x: 0.18, y: 0.78 },
    { x: 0.82, y: 0.78 },
    { x: 0.92, y: 0.98 },
    { x: 0.08, y: 0.98 },
  ]);

  const activeProfiles = useMemo(() => {
    return profiles.filter((profile) => profile.is_active !== false);
  }, [profiles]);

  const speciesOptions = useMemo(() => {
    return uniqueOptions(activeProfiles.map((profile) => profile.species || profile.wood_type));
  }, [activeProfiles]);

  const cutOptions = useMemo(() => {
    return uniqueOptions(
      activeProfiles
        .filter((profile) => (profile.species || profile.wood_type) === species)
        .map((profile) => profile.cut_type)
    );
  }, [activeProfiles, species]);

  const gradeOptions = useMemo(() => {
    return uniqueOptions(
      activeProfiles
        .filter(
          (profile) =>
            (profile.species || profile.wood_type) === species &&
            (!cutType || profile.cut_type === cutType)
        )
        .map((profile) => profile.grade)
    );
  }, [activeProfiles, species, cutType]);

  const stainOptions = useMemo(() => {
    return uniqueOptions(
      activeProfiles
        .filter(
          (profile) =>
            (profile.species || profile.wood_type) === species &&
            (!cutType || profile.cut_type === cutType) &&
            (!grade || profile.grade === grade)
        )
        .map((profile) => profile.stain || profile.color)
    );
  }, [activeProfiles, species, cutType, grade]);

  const finishOptions = useMemo(() => {
    return uniqueOptions(
      activeProfiles
        .filter(
          (profile) =>
            (profile.species || profile.wood_type) === species &&
            (!cutType || profile.cut_type === cutType) &&
            (!grade || profile.grade === grade) &&
            (!stain || (profile.stain || profile.color) === stain)
        )
        .map((profile) => profile.finish_type || profile.finish)
    );
  }, [activeProfiles, species, cutType, grade, stain]);

  const layoutOptions = useMemo(() => {
    if (!patterns.length) {
      return [{ value: 'plank', label: 'Plank' }];
    }

    return patterns.map((pattern) => ({
      value: pattern.code,
      label: pattern.name,
    }));
  }, [patterns]);

  const selectedProfile = useMemo(() => {
    const exact = activeProfiles.find((profile) => {
      const profileSpecies = profile.species || profile.wood_type;
      const profileStain = profile.stain || profile.color;
      const profileFinish = profile.finish_type || profile.finish;

      return (
        profileSpecies === species &&
        profile.cut_type === cutType &&
        profile.grade === grade &&
        profileStain === stain &&
        profileFinish === finish
      );
    });

    if (exact) return exact;

    return (
      activeProfiles.find((profile) => {
        const profileSpecies = profile.species || profile.wood_type;
        return (
          profileSpecies === species &&
          profile.cut_type === cutType &&
          profile.grade === grade
        );
      }) || null
    );
  }, [activeProfiles, cutType, finish, grade, species, stain]);

  const selectedPattern = useMemo(() => {
    return patterns.find((pattern) => pattern.code === layout) || null;
  }, [patterns, layout]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setCatalogLoading(true);
        setCatalogError('');

        const response = await fetch('/api/camera/catalog', {
          method: 'GET',
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Failed to load catalog.');
        }

        setProfiles(result.profiles || []);
        setPatterns(result.patterns || []);
      } catch (error) {
        console.error('Catalog load failed:', error);
        setCatalogError(error?.message || 'Failed to load catalog.');
      } finally {
        setCatalogLoading(false);
      }
    }

    loadCatalog();
  }, []);

  useEffect(() => {
    if (!activeProfiles.length) return;

    const initialSpecies =
      (initialSelections.species &&
        activeProfiles.find(
          (profile) => (profile.species || profile.wood_type) === initialSelections.species
        ) &&
        initialSelections.species) ||
      species ||
      activeProfiles[0].species ||
      activeProfiles[0].wood_type ||
      '';

    if (!species) {
      setSpecies(initialSpecies);
      return;
    }

    const speciesStillValid = activeProfiles.some(
      (profile) => (profile.species || profile.wood_type) === species
    );

    if (!speciesStillValid) {
      setSpecies(initialSpecies);
    }
  }, [activeProfiles, initialSelections.species, species]);

  useEffect(() => {
    if (!cutOptions.length) {
      setCutType('');
      return;
    }

    const preferredCut =
      (initialSelections.cutType &&
        cutOptions.some((option) => option.value === initialSelections.cutType) &&
        initialSelections.cutType) ||
      (cutOptions.some((option) => option.value === cutType) ? cutType : cutOptions[0].value);

    if (preferredCut !== cutType) {
      setCutType(preferredCut);
    }
  }, [cutOptions, cutType, initialSelections.cutType]);

  useEffect(() => {
    if (!gradeOptions.length) {
      setGrade('');
      return;
    }

    const preferredGrade =
      (initialSelections.grade &&
        gradeOptions.some((option) => option.value === initialSelections.grade) &&
        initialSelections.grade) ||
      (gradeOptions.some((option) => option.value === grade) ? grade : gradeOptions[0].value);

    if (preferredGrade !== grade) {
      setGrade(preferredGrade);
    }
  }, [grade, gradeOptions, initialSelections.grade]);

  useEffect(() => {
    if (!stainOptions.length) {
      setStain('');
      return;
    }

    const preferredStain =
      (initialSelections.stain &&
        stainOptions.some((option) => option.value === initialSelections.stain) &&
        initialSelections.stain) ||
      (stainOptions.some((option) => option.value === stain) ? stain : stainOptions[0].value);

    if (preferredStain !== stain) {
      setStain(preferredStain);
    }
  }, [initialSelections.stain, stain, stainOptions]);

  useEffect(() => {
    if (!finishOptions.length) {
      setFinish('');
      return;
    }

    const preferredFinish =
      (initialSelections.finish &&
        finishOptions.some((option) => option.value === initialSelections.finish) &&
        initialSelections.finish) ||
      (finishOptions.some((option) => option.value === finish) ? finish : finishOptions[0].value);

    if (preferredFinish !== finish) {
      setFinish(preferredFinish);
    }
  }, [finish, finishOptions, initialSelections.finish]);

  useEffect(() => {
    if (!layoutOptions.length) {
      setLayout('plank');
      return;
    }

    const preferredLayout =
      (initialSelections.layout &&
        layoutOptions.some((option) => option.value === initialSelections.layout) &&
        initialSelections.layout) ||
      (layoutOptions.some((option) => option.value === layout) ? layout : layoutOptions[0].value);

    if (preferredLayout !== layout) {
      setLayout(preferredLayout);
    }
  }, [initialSelections.layout, layout, layoutOptions]);

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

  useEffect(() => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const engine = new FloorOverlayEngine({
      canvas: overlayCanvasRef.current,
      video: videoRef.current,
      debug: false,
    });

    overlayEngineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      overlayEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function syncOverlay() {
      if (!overlayEngineRef.current) return;

      if (selectedProfile) {
        await overlayEngineRef.current.setProfile(selectedProfile);
        overlayEngineRef.current.setPattern(layout);
        overlayEngineRef.current.setFloorPolygon(floorPolygon);
        overlayEngineRef.current.setMaterialState({
          finish,
          stain,
        });
      } else {
        overlayEngineRef.current.clear();
      }
    }

    syncOverlay();
  }, [selectedProfile, layout, floorPolygon, finish, stain]);

  useEffect(() => {
    if (catalogLoading || catalogError || !selectedProfile || arSessionId) return;

    async function createSession() {
      try {
        setSessionSaveState('saving');

        const response = await fetch('/api/camera/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: initialLeadContext.leadId || null,
            sourceApp: initialLeadContext.source || 'quote',
            projectType: 'quote',
            selectedProfileId: selectedProfile.id,
            selectedPatternCode: layout,
            selectedSpecies: species,
            selectedCutType: cutType,
            selectedGrade: grade,
            selectedStain: stain,
            selectedFinishType: finish,
            roomDimensions: {},
            measurements: {},
            rendererState: {
              floorPolygon,
              mode: 'camera-foundation',
            },
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Failed to create AR session.');
        }

        setArSessionId(result.session.id);
        setSessionSaveState('saved');
      } catch (error) {
        console.error('AR session create failed:', error);
        setSessionSaveState('error');
      }
    }

    createSession();
  }, [
    arSessionId,
    catalogError,
    catalogLoading,
    cutType,
    finish,
    floorPolygon,
    grade,
    initialLeadContext.leadId,
    initialLeadContext.source,
    layout,
    selectedProfile,
    species,
    stain,
  ]);

  useEffect(() => {
    if (!arSessionId || !selectedProfile) return;

    if (sessionSyncTimeoutRef.current) {
      clearTimeout(sessionSyncTimeoutRef.current);
    }

    sessionSyncTimeoutRef.current = setTimeout(async () => {
      try {
        setSessionSaveState('saving');

        const response = await fetch('/api/camera/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: arSessionId,
            leadId: initialLeadContext.leadId || null,
            sourceApp: initialLeadContext.source || 'quote',
            projectType: 'quote',
            selectedProfileId: selectedProfile.id,
            selectedPatternCode: layout,
            selectedSpecies: species,
            selectedCutType: cutType,
            selectedGrade: grade,
            selectedStain: stain,
            selectedFinishType: finish,
            rendererState: {
              floorPolygon,
              mode: 'camera-foundation',
            },
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Failed to sync AR session.');
        }

        setSessionSaveState('saved');
      } catch (error) {
        console.error('AR session sync failed:', error);
        setSessionSaveState('error');
      }
    }, 450);

    return () => {
      if (sessionSyncTimeoutRef.current) {
        clearTimeout(sessionSyncTimeoutRef.current);
      }
    };
  }, [
    arSessionId,
    cutType,
    finish,
    floorPolygon,
    grade,
    initialLeadContext.leadId,
    initialLeadContext.source,
    layout,
    selectedProfile,
    species,
    stain,
  ]);

  useEffect(() => {
    const canvas = floorGuideCanvasRef.current;

    if (!canvas || status !== 'live') return;

    const drawGuide = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const points = floorPolygon.map((point) => ({
        x: point.x * rect.width,
        y: point.y * rect.height,
      }));

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
      });
    };

    drawGuide();
    window.addEventListener('resize', drawGuide);

    return () => {
      window.removeEventListener('resize', drawGuide);
    };
  }, [floorPolygon, status]);

  const nudgeFloorPoint = useCallback((index, axis, delta) => {
    setFloorPolygon((current) =>
      current.map((point, pointIndex) => {
        if (pointIndex !== index) return point;
        return {
          ...point,
          [axis]: Math.max(0.02, Math.min(0.98, point[axis] + delta)),
        };
      })
    );
  }, []);

  const handleCapture = useCallback(async () => {
    try {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;

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
        arSessionId: arSessionId || null,
        woodProfileId: selectedProfile?.id || null,
        patternCode: layout,
        lead: initialLeadContext,
        selections: {
          species,
          cutType,
          grade,
          stain,
          finish,
          layout,
          profileId: selectedProfile?.id || null,
          profileSku: selectedProfile?.sku || null,
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
          floorPolygon,
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
  }, [
    arSessionId,
    cutType,
    finish,
    floorPolygon,
    grade,
    initialLeadContext,
    layout,
    selectedProfile,
    species,
    stain,
    status,
  ]);

  const activeSpeciesLabel = humanize(species);
  const activeCutLabel = humanize(cutType);
  const activeGradeLabel = humanize(grade);
  const activeStainLabel = humanize(stain);
  const activeFinishLabel = humanize(finish);
  const activeLayoutLabel = selectedPattern?.name || humanize(layout);

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

        <canvas ref={captureCanvasRef} className="hidden" />

        <canvas
          ref={overlayCanvasRef}
          className="pointer-events-none absolute inset-0 z-[9] h-full w-full"
        />

        <canvas
          ref={floorGuideCanvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap gap-2 md:inset-x-6">
          <Tag>{activeSpeciesLabel}</Tag>
          <Tag>{activeCutLabel}</Tag>
          <Tag>{activeGradeLabel}</Tag>
          <Tag>{activeStainLabel}</Tag>
          <Tag>{activeFinishLabel}</Tag>
          <Tag>{activeLayoutLabel}</Tag>
        </div>

        {status !== 'live' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/65 p-6 text-center shadow-2xl backdrop-blur-xl">
              {status === 'loading' && (
                <>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  <p className="text-sm font-medium text-white">Starting your camera…</p>
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
            <div className="pointer-events-none absolute inset-x-8 bottom-36 z-10 text-center">
              <p className="text-xs font-medium text-white">
                Calibrate the floor guide, then capture or keep going into overlay mode.
              </p>
              <p className="mt-1 text-[11px] text-neutral-300">
                This guide polygon is the foundation for the first real floor overlay pass.
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
                  {catalogLoading
                    ? 'Loading Supabase catalog…'
                    : catalogError
                    ? catalogError
                    : sessionSaveState === 'saving'
                    ? 'Saving AR session…'
                    : sessionSaveState === 'saved'
                    ? 'Selections synced to Supabase'
                    : 'Mobile-friendly selections synced to Supabase'}
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

            <div className="grid grid-cols-1 gap-3 px-4 pb-6 sm:grid-cols-2">
              <SelectField
                label="Wood species"
                value={species}
                onChange={setSpecies}
                options={speciesOptions}
              />

              <SelectField
                label="Cut"
                value={cutType}
                onChange={setCutType}
                options={cutOptions}
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
                options={stainOptions}
              />

              <SelectField
                label="Finish"
                value={finish}
                onChange={setFinish}
                options={finishOptions}
              />

              <SelectField
                label="Layout"
                value={layout}
                onChange={setLayout}
                options={layoutOptions}
              />
            </div>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Floor guide
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {floorPolygon.map((point, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 text-xs font-semibold text-white">
                      Point {index + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => nudgeFloorPoint(index, 'x', -0.02)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeFloorPoint(index, 'x', 0.02)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      >
                        Right
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeFloorPoint(index, 'y', -0.02)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgeFloorPoint(index, 'y', 0.02)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                      >
                        Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-neutral-400">
                Current profile: {selectedProfile?.name || 'No matching profile'}
              </div>
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
              disabled={status !== 'live' || captureBusy || !selectedProfile}
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

function Tag({ children }) {
  return (
    <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
      {children}
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
        {(options || []).map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}