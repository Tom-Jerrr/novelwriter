import type { WindowIndexState } from '@/types/api'

export interface WindowIndexStatusMeta {
  text: string
  tone: 'muted' | 'success' | 'warning'
  requiresFallback: boolean
}

const ACTIVE_JOB_STATUSES = new Set(['queued', 'running'])

export function isWindowIndexRebuilding(state: WindowIndexState | null | undefined): boolean {
  return Boolean(state?.job && ACTIVE_JOB_STATUSES.has(state.job.status))
}

export function getWindowIndexBootstrapStatusMeta(state: WindowIndexState | null | undefined): WindowIndexStatusMeta {
  if (!state) {
    return { text: '正在准备全书内容', tone: 'muted', requiresFallback: false }
  }
  if (isWindowIndexRebuilding(state) && state.status !== 'fresh') {
    return { text: '正在整理章节内容', tone: 'muted', requiresFallback: true }
  }
  switch (state.status) {
    case 'fresh':
      return { text: '已可从全书中查找线索', tone: 'success', requiresFallback: false }
    case 'stale':
      return { text: '章节更新后待同步', tone: 'warning', requiresFallback: true }
    case 'missing':
      return { text: '还在准备全书内容', tone: 'warning', requiresFallback: true }
    case 'failed':
      return { text: '全书检索暂不可用', tone: 'warning', requiresFallback: true }
  }
}

export function getWindowIndexCopilotStatusMeta(state: WindowIndexState | null | undefined): WindowIndexStatusMeta {
  if (!state) {
    return { text: '正在准备全书内容。', tone: 'muted', requiresFallback: false }
  }
  if (isWindowIndexRebuilding(state) && state.status !== 'fresh') {
    return {
      text: '章节有更新，正在整理全书内容；当前会先参考最近几章。',
      tone: 'muted',
      requiresFallback: true,
    }
  }
  switch (state.status) {
    case 'fresh':
      return { text: '已可直接跨章节查找设定、人物与线索。', tone: 'success', requiresFallback: false }
    case 'stale':
      return {
        text: '章节有更新，正在同步全书内容；当前会先参考最近几章。',
        tone: 'warning',
        requiresFallback: true,
      }
    case 'missing':
      return {
        text: '全书内容还在准备中；当前会先参考最近几章。',
        tone: 'warning',
        requiresFallback: true,
      }
    case 'failed':
      return {
        text: '全书内容暂时整理失败；当前会先参考最近几章。',
        tone: 'warning',
        requiresFallback: true,
      }
  }
}
