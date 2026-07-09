import { CATEGORY_ICON_NAMES } from '@budget/common';
import { CATEGORY_ICON_MAP } from '../categoryIcons';

describe('CATEGORY_ICON_MAP', () => {
  it('common の CATEGORY_ICON_NAMES（SSOT）と key が完全一致する', () => {
    expect(Object.keys(CATEGORY_ICON_MAP).sort()).toEqual(Object.keys(CATEGORY_ICON_NAMES).sort());
  });

  it('各 key のアイコンが SSOT のアイコン名と一致する', () => {
    for (const [key, iconName] of Object.entries(CATEGORY_ICON_NAMES)) {
      const component = CATEGORY_ICON_MAP[key] as { displayName?: string; name?: string };
      const actual = component.displayName ?? component.name;
      expect(`${key}:${actual}`).toBe(`${key}:${iconName}`);
    }
  });
});
