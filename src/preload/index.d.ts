import type { DemoFrameAPI } from './index'

declare global {
  interface Window {
    api: DemoFrameAPI
  }
}
