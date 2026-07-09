import { NAV_ITEM_DEFS } from '@budget/common';
import { NAV_ICON_MAP } from '../navIcons';

describe('NAV_ICON_MAP', () => {
  it('common の NAV_ITEM_DEFS（SSOT）と key・アイコンが一致する', () => {
    expect(Object.keys(NAV_ICON_MAP).sort()).toEqual(NAV_ITEM_DEFS.map((d) => d.key).sort());
    for (const def of NAV_ITEM_DEFS) {
      const component = NAV_ICON_MAP[def.key] as { displayName?: string; name?: string };
      const actual = component.displayName ?? component.name;
      expect(`${def.key}:${actual}`).toBe(`${def.key}:${def.iconName}`);
    }
  });
});
