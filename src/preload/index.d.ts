import type { OrbitAPI } from '../shared/electron'

declare global {
  interface Window {
    orbit: OrbitAPI
  }
}
