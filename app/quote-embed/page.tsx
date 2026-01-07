"use client";

import { useEffect } from "react";

export default function QuoteEmbedPage() {
  useEffect(() => {
    // 1) Send height to parent (Wix) so iframe fits content
    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      window.parent?.postMessage(
        { type: "LEONS_SET_HEIGHT", height },
        "*"
      );
    };

    // 2) ResizeObserver: fires when UI expands/collapses (steps, accordions)
    const ro = new ResizeObserver(() => sendHeight());
    ro.observe(document.documentElement);

    // 3) Also send on load & after short delays to prevent initial “jump”
    const onLoad = () => {
      sendHeight();
      window.parent?.postMessage({ type: "LEONS_READY" }, "*");
      setTimeout(sendHeight, 200);
      setTimeout(sendHeight, 600);
      setTimeout(sendHeight, 1200);
    };

    window.addEventListener("load", onLoad);
    sendHeight();

    // 4) Receive context from Wix (mobile/desktop)
    const onMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.type === "LEONS_CONTEXT") {
        // Example: toggle mobile UI classes
        document.documentElement.dataset.formfactor = msg.data.formFactor;
        sendHeight();
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <main style={{ width: "100%", margin: 0 }}>
      {/* your quote UI */}
    </main>
  );
}

