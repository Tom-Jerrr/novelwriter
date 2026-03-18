export type PerformanceMode = 'default' | 'lite'
export type RouteSurfaceKind = 'marketing' | 'workspace'

export const PERFORMANCE_MODE_STORAGE_KEY = 'novwr_perf_mode'

export function normalizePerformanceMode(value: string | null | undefined): PerformanceMode | null {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'lite' || normalized === 'low') return 'lite'
  if (normalized === 'default' || normalized === 'full' || normalized === 'off') return 'default'
  return null
}

export function readPerformanceModeFromSearch(search: string): PerformanceMode | null {
  try {
    return normalizePerformanceMode(new URLSearchParams(search).get('perf'))
  } catch {
    return null
  }
}

export function readStoredPerformanceMode(): PerformanceMode {
  if (typeof window === 'undefined') return 'default'
  try {
    return normalizePerformanceMode(localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY)) ?? 'default'
  } catch {
    return 'default'
  }
}

export function persistPerformanceMode(mode: PerformanceMode): void {
  if (typeof window === 'undefined') return
  try {
    if (mode === 'lite') {
      localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, mode)
    } else {
      localStorage.removeItem(PERFORMANCE_MODE_STORAGE_KEY)
    }
  } catch {
    // Ignore storage-denied environments; the current tab can still use the mode.
  }
}

export function applyPerformanceModeToDocument(mode: PerformanceMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (mode === 'lite') {
    root.dataset.perfMode = mode
  } else {
    delete root.dataset.perfMode
  }
}

export function resolveRouteSurface(pathname: string): RouteSurfaceKind {
  switch (pathname) {
    case '/':
    case '/login':
    case '/terms':
    case '/privacy':
    case '/copyright':
      return 'marketing'
    default:
      return 'workspace'
  }
}

export function applyRouteSurfaceToDocument(surface: RouteSurfaceKind): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.routeSurface = surface
}
