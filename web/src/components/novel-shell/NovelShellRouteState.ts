import { matchPath } from 'react-router-dom'
import type {
  CopilotReviewKind,
  CopilotSuggestionTarget,
} from '@/types/copilot'

export type NovelShellSurface = 'studio' | 'atlas'
export type NovelShellStage =
  | 'chapter'
  | 'write'
  | 'results'
  | 'entity'
  | 'relationship'
  | 'system'
  | 'review'

export type NovelShellEntry = 'studio_host' | 'results_compat' | 'atlas' | null
export type AtlasWorkbenchTab = 'systems' | 'entities' | 'relationships' | 'review'
export type NovelShellArtifactPanel = 'assistant' | 'injection_summary'
export type NovelShellInjectionCategory = 'entities' | 'relationships' | 'systems'

export interface NovelShellRouteState {
  surface: NovelShellSurface | null
  stage: NovelShellStage | null
  entry: NovelShellEntry
  novelId: number | null
  chapterNum: number | null
  entityId: number | null
  relationshipId: number | null
  systemId: number | null
  worldTab: AtlasWorkbenchTab | null
  reviewKind: CopilotReviewKind | null
}

export interface ResultsProvenance {
  chapterNum: number
  continuations: string
  totalVariants: number | null
}

export interface NovelShellArtifactPanelState {
  panel: NovelShellArtifactPanel
  injectionCategory: NovelShellInjectionCategory | null
}

export interface AtlasStudioOriginState {
  stage: NovelShellStage
  chapterNum: number | null
  entityId: number | null
  systemId: number | null
  reviewKind: CopilotReviewKind | null
  resultsProvenance: ResultsProvenance | null
  artifactPanelState: NovelShellArtifactPanelState | null
}

function parseNumberParam(raw: string | undefined | null) {
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function parseRequiredString(raw: string | null): string | null {
  if (!raw) return null
  const value = raw.trim()
  return value.length > 0 ? value : null
}

function parseInjectionCategory(raw: string | null): NovelShellInjectionCategory | null {
  if (raw === 'entities' || raw === 'relationships' || raw === 'systems') return raw
  return null
}

function parseArtifactPanelValue(raw: string | null): NovelShellArtifactPanel {
  return raw === 'injection_summary' ? 'injection_summary' : 'assistant'
}

export function readNovelShellArtifactPanelSearchParams(
  current: URLSearchParams,
): NovelShellArtifactPanelState {
  const panel = current.get('artifactPanel') === 'injection_summary'
    ? 'injection_summary'
    : 'assistant'

  return {
    panel,
    injectionCategory: panel === 'injection_summary'
      ? parseInjectionCategory(current.get('summaryCategory'))
      : null,
  }
}

export function setNovelShellArtifactPanelSearchParams(
  current: URLSearchParams,
  nextState: NovelShellArtifactPanelState | null,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (!nextState || nextState.panel === 'assistant') {
    next.delete('artifactPanel')
    next.delete('summaryCategory')
    return next
  }

  next.set('artifactPanel', 'injection_summary')
  if (nextState.injectionCategory) next.set('summaryCategory', nextState.injectionCategory)
  else next.delete('summaryCategory')
  return next
}

export function readAtlasStudioOriginSearchParams(current: URLSearchParams): AtlasStudioOriginState | null {
  const rawStage = current.get('originStage')
  if (!rawStage) return null

  const stage = parseStudioStage(rawStage)
  const chapterNum = parseNumberParam(current.get('originChapter'))
  const entityId = parseNumberParam(current.get('originEntity'))
  const systemId = parseNumberParam(current.get('originSystem'))
  const reviewKind = stage === 'review'
    ? parseAtlasReviewKind(current.get('originReviewKind'))
    : null
  const resultsProvenance = readResultsProvenanceSearchParams(new URLSearchParams([
    ['resultsChapter', current.get('originResultsChapter') ?? ''],
    ['resultsContinuations', current.get('originResultsContinuations') ?? ''],
    ['resultsTotalVariants', current.get('originResultsTotalVariants') ?? ''],
  ]))
  const artifactPanel = parseArtifactPanelValue(current.get('originArtifactPanel'))
  const injectionCategory = parseInjectionCategory(current.get('originSummaryCategory'))

  return {
    stage,
    chapterNum,
    entityId,
    systemId,
    reviewKind,
    resultsProvenance,
    artifactPanelState: artifactPanel === 'assistant' && injectionCategory === null
      ? null
      : {
          panel: artifactPanel,
          injectionCategory: artifactPanel === 'injection_summary' ? injectionCategory : null,
        },
  }
}

export function setAtlasStudioOriginSearchParams(
  current: URLSearchParams,
  origin: AtlasStudioOriginState | null,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (!origin) {
    next.delete('originStage')
    next.delete('originChapter')
    next.delete('originEntity')
    next.delete('originSystem')
    next.delete('originReviewKind')
    next.delete('originResultsChapter')
    next.delete('originResultsContinuations')
    next.delete('originResultsTotalVariants')
    next.delete('originArtifactPanel')
    next.delete('originSummaryCategory')
    return next
  }

  next.set('originStage', origin.stage)
  if (origin.chapterNum == null) next.delete('originChapter')
  else next.set('originChapter', String(origin.chapterNum))
  if (origin.entityId == null) next.delete('originEntity')
  else next.set('originEntity', String(origin.entityId))
  if (origin.systemId == null) next.delete('originSystem')
  else next.set('originSystem', String(origin.systemId))
  if (origin.stage === 'review' && origin.reviewKind) next.set('originReviewKind', origin.reviewKind)
  else next.delete('originReviewKind')

  if (origin.resultsProvenance) {
    next.set('originResultsChapter', String(origin.resultsProvenance.chapterNum))
    next.set('originResultsContinuations', origin.resultsProvenance.continuations)
    if (origin.resultsProvenance.totalVariants !== null) next.set('originResultsTotalVariants', String(origin.resultsProvenance.totalVariants))
    else next.delete('originResultsTotalVariants')
  } else {
    next.delete('originResultsChapter')
    next.delete('originResultsContinuations')
    next.delete('originResultsTotalVariants')
  }

  if (origin.artifactPanelState?.panel === 'injection_summary') {
    next.set('originArtifactPanel', 'injection_summary')
    if (origin.artifactPanelState.injectionCategory) next.set('originSummaryCategory', origin.artifactPanelState.injectionCategory)
    else next.delete('originSummaryCategory')
  } else {
    next.delete('originArtifactPanel')
    next.delete('originSummaryCategory')
  }

  return next
}

export function parseAtlasReviewKind(raw: string | null): CopilotReviewKind {
  if (raw === 'entities' || raw === 'relationships' || raw === 'systems') return raw
  return 'entities'
}

function parseStudioStage(raw: string | null): NovelShellStage {
  if (
    raw === 'chapter' ||
    raw === 'write' ||
    raw === 'results' ||
    raw === 'entity' ||
    raw === 'relationship' ||
    raw === 'system' ||
    raw === 'review'
  ) {
    return raw
  }
  return 'chapter'
}

export function parseAtlasTab(raw: string | null): AtlasWorkbenchTab {
  if (raw === 'entities' || raw === 'relationships' || raw === 'review' || raw === 'systems') {
    return raw
  }
  return 'systems'
}

function atlasTabToStage(tab: AtlasWorkbenchTab): NovelShellStage {
  if (tab === 'entities') return 'entity'
  if (tab === 'relationships') return 'relationship'
  if (tab === 'review') return 'review'
  return 'system'
}

export function setStudioStageSearchParams(
  current: URLSearchParams,
  nextStage: NovelShellStage,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (nextStage === 'chapter') next.delete('stage')
  else next.set('stage', nextStage)

  if (nextStage !== 'review') {
    next.delete('reviewKind')
    next.delete('kind')
  }
  return next
}

export function setStudioChapterSearchParams(
  current: URLSearchParams,
  chapterNumber: number | null | undefined,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'chapter')
  if (chapterNumber == null) next.delete('chapter')
  else next.set('chapter', String(chapterNumber))
  return next
}

export function setStudioReviewKindSearchParams(
  current: URLSearchParams,
  reviewKind: CopilotReviewKind,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'review')
  next.delete('kind')
  next.set('reviewKind', reviewKind)
  return next
}

export function setStudioResultsStageSearchParams(
  current: URLSearchParams,
  chapterNumber: number | null | undefined,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'results')
  if (chapterNumber == null) next.delete('chapter')
  else next.set('chapter', String(chapterNumber))
  return next
}

export function setNovelShellEntitySearchParams(
  current: URLSearchParams,
  entityId: number | null | undefined,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (entityId == null) next.delete('entity')
  else next.set('entity', String(entityId))
  return next
}

export function setNovelShellSystemSearchParams(
  current: URLSearchParams,
  systemId: number | null | undefined,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (systemId == null) next.delete('system')
  else next.set('system', String(systemId))
  return next
}

export function setStudioEntityStageSearchParams(
  current: URLSearchParams,
  entityId: number | null | undefined,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'entity')
  return setNovelShellEntitySearchParams(next, entityId)
}

export function setStudioRelationshipStageSearchParams(
  current: URLSearchParams,
  entityId: number | null | undefined,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'relationship')
  return setNovelShellEntitySearchParams(next, entityId)
}

export function setStudioSystemStageSearchParams(
  current: URLSearchParams,
  systemId: number | null | undefined,
): URLSearchParams {
  const next = setStudioStageSearchParams(current, 'system')
  return setNovelShellSystemSearchParams(next, systemId)
}

export function readResultsProvenanceSearchParams(current: URLSearchParams): ResultsProvenance | null {
  const chapterNum = parseNumberParam(current.get('resultsChapter'))
  const continuations = parseRequiredString(current.get('resultsContinuations'))
  const totalVariants = parseNumberParam(current.get('resultsTotalVariants'))

  if (chapterNum === null || continuations === null) return null

  return {
    chapterNum,
    continuations,
    totalVariants,
  }
}

export function setResultsProvenanceSearchParams(
  current: URLSearchParams,
  provenance: ResultsProvenance | null,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (!provenance) {
    next.delete('resultsChapter')
    next.delete('resultsContinuations')
    next.delete('resultsTotalVariants')
    return next
  }

  next.set('resultsChapter', String(provenance.chapterNum))
  next.set('resultsContinuations', provenance.continuations)
  if (provenance.totalVariants !== null) next.set('resultsTotalVariants', String(provenance.totalVariants))
  else next.delete('resultsTotalVariants')
  return next
}

export function buildResultsCompatibilityPath(
  novelId: number | string,
  provenance: ResultsProvenance,
  artifactPanelState: NovelShellArtifactPanelState | null = null,
): string {
  let nextSearchParams = new URLSearchParams()
  nextSearchParams.set('continuations', provenance.continuations)
  if (provenance.totalVariants !== null) {
    nextSearchParams.set('total_variants', String(provenance.totalVariants))
  }
  nextSearchParams = setNovelShellArtifactPanelSearchParams(nextSearchParams, artifactPanelState)
  const nextSearch = nextSearchParams.toString()
  return `/novel/${novelId}/chapter/${provenance.chapterNum}/results${nextSearch ? `?${nextSearch}` : ''}`
}

export function buildStudioHostPath(
  novelId: number | string,
  origin: AtlasStudioOriginState,
): string {
  let nextSearchParams = new URLSearchParams()

  if (origin.stage === 'write') {
    nextSearchParams = setStudioStageSearchParams(nextSearchParams, 'write')
  } else if (origin.stage === 'results') {
    nextSearchParams = setStudioResultsStageSearchParams(
      nextSearchParams,
      origin.resultsProvenance?.chapterNum ?? origin.chapterNum,
    )
    if (origin.resultsProvenance) {
      nextSearchParams.set('continuations', origin.resultsProvenance.continuations)
      if (origin.resultsProvenance.totalVariants !== null) {
        nextSearchParams.set('total_variants', String(origin.resultsProvenance.totalVariants))
      }
    }
  } else if (origin.stage === 'entity') {
    nextSearchParams = setStudioChapterSearchParams(nextSearchParams, origin.chapterNum)
    nextSearchParams = setStudioEntityStageSearchParams(nextSearchParams, origin.entityId)
  } else if (origin.stage === 'relationship') {
    nextSearchParams = setStudioChapterSearchParams(nextSearchParams, origin.chapterNum)
    nextSearchParams = setStudioRelationshipStageSearchParams(nextSearchParams, origin.entityId)
  } else if (origin.stage === 'system') {
    nextSearchParams = setStudioChapterSearchParams(nextSearchParams, origin.chapterNum)
    nextSearchParams = setStudioSystemStageSearchParams(nextSearchParams, origin.systemId)
  } else if (origin.stage === 'review') {
    nextSearchParams = setStudioChapterSearchParams(nextSearchParams, origin.chapterNum)
    nextSearchParams = setStudioReviewKindSearchParams(nextSearchParams, origin.reviewKind ?? 'entities')
  } else {
    nextSearchParams = setStudioChapterSearchParams(nextSearchParams, origin.chapterNum)
  }

  if (origin.stage !== 'results') {
    nextSearchParams = setResultsProvenanceSearchParams(nextSearchParams, origin.resultsProvenance)
  }
  nextSearchParams = setNovelShellArtifactPanelSearchParams(nextSearchParams, origin.artifactPanelState)

  const nextSearch = nextSearchParams.toString()
  return `/novel/${novelId}${nextSearch ? `?${nextSearch}` : ''}`
}

export function setAtlasTabSearchParams(
  current: URLSearchParams,
  nextTab: AtlasWorkbenchTab,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (nextTab === 'systems') next.delete('tab')
  else next.set('tab', nextTab)

  next.delete('stage')
  if (nextTab !== 'review') next.delete('kind')
  if (nextTab !== 'review') next.delete('highlight')
  if (nextTab !== 'relationships') next.delete('relationship')
  return next
}

export const setAtlasEntitySearchParams =
  setNovelShellEntitySearchParams

export const setAtlasSystemSearchParams =
  setNovelShellSystemSearchParams

export function setAtlasReviewKindSearchParams(
  current: URLSearchParams,
  reviewKind: CopilotReviewKind,
): URLSearchParams {
  const next = setAtlasTabSearchParams(current, 'review')
  next.set('kind', reviewKind)
  next.delete('highlight')
  return next
}

export function setAtlasRelationshipSearchParams(
  current: URLSearchParams,
  relationshipId: number | null | undefined,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (relationshipId == null) next.delete('relationship')
  else next.set('relationship', String(relationshipId))
  return next
}

export function setAtlasHighlightSearchParams(
  current: URLSearchParams,
  highlightId: number | null | undefined,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (highlightId == null) next.delete('highlight')
  else next.set('highlight', String(highlightId))
  return next
}

export function setAtlasSuggestionTargetSearchParams(
  current: URLSearchParams,
  target: CopilotSuggestionTarget,
): URLSearchParams {
  if (target.tab === 'review') {
    const next = setAtlasReviewKindSearchParams(current, target.review_kind ?? 'entities')
    return setAtlasHighlightSearchParams(next, target.highlight_id ?? target.resource_id)
  }
  if (target.tab === 'entities' || target.tab === 'relationships') {
    let next = setAtlasTabSearchParams(current, target.tab)
    next = setAtlasEntitySearchParams(next, target.entity_id ?? target.resource_id)
    if (target.tab === 'relationships' && target.resource === 'relationship') {
      next = setAtlasRelationshipSearchParams(next, target.highlight_id ?? target.resource_id)
    }
    return next
  }
  const next = setAtlasTabSearchParams(current, 'systems')
  return setAtlasSystemSearchParams(next, target.resource_id)
}

export function parseNovelShellRouteState(pathname: string, search = ''): NovelShellRouteState {
  const [normalizedPathname, inlineSearch = ''] = pathname.split('?')
  const searchParams = new URLSearchParams(search || inlineSearch)

  const resultsMatch = matchPath('/novel/:novelId/chapter/:chapterNum/results', normalizedPathname)
  if (resultsMatch) {
    return {
      surface: 'studio',
      stage: 'results',
      entry: 'results_compat',
      novelId: parseNumberParam(resultsMatch.params.novelId),
      chapterNum: parseNumberParam(resultsMatch.params.chapterNum),
      entityId: parseNumberParam(searchParams.get('entity')),
      relationshipId: null,
      systemId: parseNumberParam(searchParams.get('system')),
      worldTab: null,
      reviewKind: null,
    }
  }

  const studioMatch = matchPath('/novel/:novelId', normalizedPathname)
  if (studioMatch) {
    const stage = parseStudioStage(searchParams.get('stage'))
    return {
      surface: 'studio',
      stage,
      entry: 'studio_host',
      novelId: parseNumberParam(studioMatch.params.novelId),
      chapterNum: parseNumberParam(searchParams.get('chapter')),
      entityId: parseNumberParam(searchParams.get('entity')),
      relationshipId: null,
      systemId: parseNumberParam(searchParams.get('system')),
      worldTab: null,
      reviewKind: stage === 'review'
        ? parseAtlasReviewKind(searchParams.get('reviewKind') ?? searchParams.get('kind'))
        : null,
    }
  }

  const atlasMatch = matchPath('/world/:novelId', normalizedPathname)
  if (atlasMatch) {
    const worldTab = parseAtlasTab(searchParams.get('tab') ?? searchParams.get('stage'))
    const stage = atlasTabToStage(worldTab)
    return {
      surface: 'atlas',
      stage,
      entry: 'atlas',
      novelId: parseNumberParam(atlasMatch.params.novelId),
      chapterNum: null,
      entityId: parseNumberParam(searchParams.get('entity')),
      relationshipId: stage === 'relationship'
        ? parseNumberParam(searchParams.get('relationship'))
        : null,
      systemId: parseNumberParam(searchParams.get('system')),
      worldTab,
      reviewKind: stage === 'review'
        ? parseAtlasReviewKind(searchParams.get('reviewKind') ?? searchParams.get('kind'))
        : null,
    }
  }

  return {
    surface: null,
    stage: null,
    entry: null,
    novelId: null,
    chapterNum: null,
    entityId: null,
    relationshipId: null,
    systemId: null,
    worldTab: null,
    reviewKind: null,
  }
}
