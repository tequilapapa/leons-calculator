// types/model-viewer.d.ts
import type * as React from 'react';

declare global {
  // For classic JSX lookup (what the TS error mentions)
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }

  // For React 19’s react-jsx runtime (some setups look here)
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': any;
      }
    }
  }
}
export {};