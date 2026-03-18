export const DEFAULT_NOVEL_SHELL_DRAWER_WIDTH = 360
export const MIN_NOVEL_SHELL_DRAWER_WIDTH = 280
export const MAX_NOVEL_SHELL_DRAWER_WIDTH = 800

export function clampNovelShellDrawerWidth(nextWidth: number) {
  return Math.max(MIN_NOVEL_SHELL_DRAWER_WIDTH, Math.min(MAX_NOVEL_SHELL_DRAWER_WIDTH, nextWidth))
}
