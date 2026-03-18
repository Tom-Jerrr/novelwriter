import { describe, expect, it } from 'vitest'
import {
  parseInjectedRelationshipLabel,
  resolveInjectionSummaryNavigationTarget,
} from '@/lib/injectionSummaryNavigation'

describe('injectionSummaryNavigation', () => {
  const entities = [
    { id: 1, name: '云澈' },
    { id: 2, name: '楚月仙' },
  ] as const
  const systems = [
    { id: 11, name: '修炼体系' },
    { id: 12, name: '宗门律令' },
  ] as const

  it('parses labeled relationship debug strings', () => {
    expect(parseInjectedRelationshipLabel('云澈 --师徒--> 楚月仙')).toEqual({
      sourceName: '云澈',
      relationshipLabel: '师徒',
      targetName: '楚月仙',
    })
  })

  it('routes entity labels to studio entity stage when the name resolves uniquely', () => {
    expect(resolveInjectionSummaryNavigationTarget({
      category: 'entities',
      label: '云澈',
      entities: entities as never,
      systems: systems as never,
    })).toEqual({
      kind: 'studio_entity',
      entityId: 1,
    })
  })

  it('routes relationship labels to studio relationship stage when the source entity resolves uniquely', () => {
    expect(resolveInjectionSummaryNavigationTarget({
      category: 'relationships',
      label: '云澈 --师徒--> 楚月仙',
      entities: entities as never,
      systems: systems as never,
    })).toEqual({
      kind: 'studio_relationship',
      entityId: 1,
    })
  })

  it('falls back to atlas tabs when it cannot resolve a stable target', () => {
    expect(resolveInjectionSummaryNavigationTarget({
      category: 'entities',
      label: '不存在的人物',
      entities: entities as never,
      systems: systems as never,
    })).toEqual({
      kind: 'atlas_tab',
      tab: 'entities',
    })

    expect(resolveInjectionSummaryNavigationTarget({
      category: 'systems',
      label: '不存在的体系',
      entities: entities as never,
      systems: systems as never,
    })).toEqual({
      kind: 'atlas_tab',
      tab: 'systems',
    })
  })

  it('routes uniquely matched system labels to the studio system stage', () => {
    expect(resolveInjectionSummaryNavigationTarget({
      category: 'systems',
      label: '修炼体系',
      entities: entities as never,
      systems: systems as never,
    })).toEqual({
      kind: 'studio_system',
      systemId: 11,
    })
  })
})
