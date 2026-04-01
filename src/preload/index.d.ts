import type { DrekiAPI } from './index'

declare global {
  interface Window {
    api: DrekiAPI
  }
}
