export type Fill = number

declare module 'claude-code' {
  interface PluginState {
    'fireside-snow': { fill: Fill }
  }
}
