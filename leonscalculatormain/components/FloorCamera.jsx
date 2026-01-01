import { useEffect, useRef, useState } from "react";

export default function FloorCamera() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | live | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let stream;

    async function startCamera() {
      try {
        setStatus("loading");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported on this device/browser.");
        }

        // Prefer rear camera on mobile
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("live");
      } catch (err) {
        console.error("Camera error:", err);
        setErrorMsg(err.message || "Unable to access camera.");
        setStatus("error");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-md border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Leon&apos;s Hardwood Floors
          </span>
          <span className="text-sm font-semibold">
            Visualize Your New Floors
          </span>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 text-neutral-300">
          Beta • Camera Preview
        </span>
      </header>

      {/* Camera area */}
      <main className="relative flex-1 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          // iOS needs these:
          autoPlay
          playsInline
          muted
          className={`
            w-full h-full object-cover
            ${status === "live" ? "opacity-100" : "opacity-0"}
            transition-opacity duration-300
          `}
        />

        {/* Gradient overlay for luxury feel */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

        {/* Center overlay text */}
        {status !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {status === "loading" && (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin mb-4" />
                <p className="text-sm text-neutral-200">
                  Initializing camera…  
                  <span className="block text-xs text-neutral-400 mt-1">
                    If prompted, allow camera access to preview your floors.
                  </span>
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <p className="text-sm font-medium text-red-200 mb-2">
                  We couldn&apos;t access your camera.
                </p>
                <p className="text-xs text-neutral-300 mb-4">
                  Check browser permissions and make sure you&apos;re using a
                  modern mobile browser over HTTPS.
                </p>
                {errorMsg && (
                  <p className="text-[11px] text-neutral-400 max-w-xs">
                    Technical detail: {errorMsg}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Simple framing guides */}
        {status === "live" && (
          <div className="pointer-events-none absolute inset-8 border border-white/20 rounded-3xl">
            <div className="absolute inset-x-10 bottom-6 text-center text-[11px] text-neutral-200">
              Point your camera at your existing floors.  
              <span className="block text-[10px] text-neutral-400 mt-1">
                We&apos;ll soon map Leon&apos;s floor profiles onto this view.
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="text-[11px] text-neutral-300">
          <div className="font-medium">
            Step 1 of 2: Capture your room
          </div>
          <div className="text-[10px] text-neutral-400">
            Next: Choose a Leon&apos;s floor profile to overlay.
          </div>
        </div>

        {/* Capture button placeholder (we can wire this later) */}
        <button
          type="button"
          className="relative w-12 h-12 rounded-full border border-white/40 flex items-center justify-center active:scale-95 transition"
        >
          <span className="w-8 h-8 rounded-full bg-white" />
        </button>
      </footer>
    </div>
  );
}
