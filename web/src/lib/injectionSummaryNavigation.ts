import type { ContinueDebugSummary, WorldEntity, WorldSystem } from '@/types/api'

export type InjectionSummaryCategory = 'entities' | 'relationships' | 'systems'

export type InjectionSummaryNavigationTarget =
  | { kind: 'studio_entity'; entityId: number }
  | { kind: 'studio_relationship'; entityId: number }
  | { kind: 'studio_system'; systemId: number }
  | { kind: 'atlas_tab'; tab: InjectionSummaryCategory }

export function pickInitialInjectionSummaryCategory(
  debug: Pick<ContinueDebugSummary, 'injected_entities' | 'injected_relationships' | 'injected_systems'>,
): InjectionSummaryCategory {
  if (debug.injected_entities.length > 0) return 'entities'
  if (debug.injected_systems.length > 0) return 'systems'
  if (debug.injected_relationships.length > 0) return 'relationships'
  return 'entities'
}

function normalizeLabel(value: string) {
  return value.trim()
}

function findUniqueEntityIdByName(entities: WorldEntity[], name: string): number | null {
  const normalized = normalizeLabel(name)
  if (!normalized) return null
  const matches = entities.filter((entity) => normalizeLabel(entity.name) === normalized)
  if (matches.length !== 1) return null
  return matches[0].id
}

function findUniqueSystemIdByName(systems: WorldSystem[], name: string): number | null {
  const normalized = normalizeLabel(name)
  if (!normalized) return null
  const matches = systems.filter((system) => normalizeLabel(system.name) === normalized)
  if (matches.length !== 1) return null
  return matches[0].id
}

export function parseInjectedRelationshipLabel(label: string): {
  sourceName: string
  relationshipLabel: string | null
  targetName: string
} | null {
  const normalized = normalizeLabel(label)
  if (!normalized) return null

  const labeledMatch = normalized.match(/^(.*?)\s+--(.*?)-->\s*(.*)$/)
  if (labeledMatch) {
    const [, sourceName, relationshipLabel, targetName] = labeledMatch
    if (!sourceName.trim() || !targetName.trim()) return null
    return {
      sourceName: sourceName.trim(),
      relationshipLabel: relationshipLabel.trim() || null,
      targetName: targetName.trim(),
    }
  }

  const unlabeledMatch = normalized.match(/^(.*?)\s+-->\s*(.*)$/)
  if (unlabeledMatch) {
    const [, sourceName, targetName] = unlabeledMatch
    if (!sourceName.trim() || !targetName.trim()) return null
    return {
      sourceName: sourceName.trim(),
      relationshipLabel: null,
      targetName: targetName.trim(),
    }
  }

  return null
}

export function resolveInjectionSummaryNavigationTarget(args: {
  category: InjectionSummaryCategory
  label: string
  entities: WorldEntity[]
  systems: WorldSystem[]
}): InjectionSummaryNavigationTarget {
  const { category, label, entities, systems } = args

  if (category === 'entities') {
    const entityId = findUniqueEntityIdByName(entities, label)
    if (entityId !== null) {
      return { kind: 'studio_entity', entityId }
    }
    return { kind: 'atlas_tab', tab: 'entities' }
  }

  if (category === 'relationships') {
    const parsed = parseInjectedRelationshipLabel(label)
    if (!parsed) {
      return { kind: 'atlas_tab', tab: 'relationships' }
    }
    const entityId = findUniqueEntityIdByName(entities, parsed.sourceName)
    if (entityId !== null) {
      return { kind: 'studio_relationship', entityId }
    }
    return { kind: 'atlas_tab', tab: 'relationships' }
  }

  const systemId = findUniqueSystemIdByName(systems, label)
  if (systemId !== null) {
    return { kind: 'studio_system', systemId }
  }

  return { kind: 'atlas_tab', tab: 'systems' }
}
