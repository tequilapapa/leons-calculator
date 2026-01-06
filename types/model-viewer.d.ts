// types/model-viewer.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string
      'ios-src'?: string
      ar?: boolean | ''
      'ar-modes'?: string
      'ar-scale'?: string
      'camera-controls'?: boolean | ''
      poster?: string
      exposure?: string | number
      'touch-action'?: string
      'interaction-prompt'?: string
      'interaction-prompt-threshold'?: string | number
      slot?: string
    }
  }
}