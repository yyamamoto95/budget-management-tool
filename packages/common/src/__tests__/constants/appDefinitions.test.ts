import { describe, expect, it } from 'vitest'
import { HOME_CAROUSEL_SLIDES } from '../../constants/appDefinitions'

describe('HOME_CAROUSEL_SLIDES', () => {
    it('キーは一意で、投資余力は末尾（条件付き表示スライド）にある', () => {
        const keys = HOME_CAROUSEL_SLIDES.map((s) => s.key)
        expect(new Set(keys).size).toBe(keys.length)
        expect(keys[keys.length - 1]).toBe('investment-capacity')
    })

    it('Web/モバイルが参照する 4 スライド構成である', () => {
        expect(HOME_CAROUSEL_SLIDES.map((s) => s.key)).toEqual([
            'margin-streak',
            'savings-forecast',
            'monthly-summary',
            'investment-capacity',
        ])
    })
})
