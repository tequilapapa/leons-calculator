'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Star } from 'lucide-react';

type Props = {
  variant?: 'inline' | 'floating';
  title?: string;
  // you can override the widget URL if needed
  src?: string;
};

const DEFAULT_SRC =
  'https://calendar.leonshardwood.com/reputation/widgets/review_widget/xPGp97UEGHbh48A0Th2k';

export default function ReviewsWidget({
  variant = 'floating',
  title = 'What our customers say',
  src = DEFAULT_SRC,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showFrame, setShowFrame] = useState(variant === 'inline'); // inline renders immediately
  const triggerRef = useRef<HTMLDivElement | null>(null);

  // Lazy-show for floating: only render iframe once the trigger is on screen or modal is opened
  useEffect(() => {
    if (variant === 'inline') return;
    const el = triggerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setShowFrame(true);
        });
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  // When modal opens, ensure frame is there
  useEffect(() => {
    if (open) setShowFrame(true);
  }, [open]);

  return (
    <>
      {/* 3rd party script that may auto-size/style the widget */}
      <Script
        src="https://calendar.leonshardwood.com/reputation/assets/review-widget.js"
        strategy="afterInteractive"
      />

      {variant === 'inline' ? (
        <Card className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
          </div>

          {showFrame ? (
            <iframe
              className="lc_reviews_widget block w-full"
              src={src}
              loading="lazy"
              frameBorder="0"
              scrolling="no"
              // adaptive height: good defaults for mobile/desktop
              style={{
                width: '100%',
                minWidth: '100%',
                height: 'clamp(380px, 50vh, 560px)',
              }}
            />
          ) : (
            <div className="grid h-[420px] place-items-center text-sm text-gray-500">
              Loading reviews…
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Floating trigger */}
          <div
            ref={triggerRef}
            className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6"
          >
            <Button
              onClick={() => setOpen(true)}
              className="rounded-full bg-white/90 px-4 py-2 text-gray-900 shadow-lg ring-1 ring-gray-200 backdrop-blur transition hover:bg-white"
              aria-label="Open customer reviews"
            >
              <Star className="mr-2 h-4 w-4 text-yellow-500" />
              Reviews
            </Button>
          </div>

          {/* Modal */}
          {open && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-base font-medium text-gray-900">{title}</h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {showFrame ? (
                  <iframe
                    className="lc_reviews_widget block w-full"
                    src={src}
                    loading="lazy"
                    frameBorder="0"
                    scrolling="no"
                    style={{
                      width: '100%',
                      minWidth: '100%',
                      height: 'min(70vh, 700px)',
                    }}
                  />
                ) : (
                  <div className="grid h-[60vh] place-items-center text-sm text-gray-500">
                    Loading reviews…
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
