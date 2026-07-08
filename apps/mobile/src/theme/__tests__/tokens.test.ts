import { colors, insightUi, spendStatusUi, statusTone } from '../tokens';

/** 実カラー値（hex / rgb(a)）であること = var() 参照が残っていないことの検証 */
function isConcreteColor(value: string): boolean {
  return /^(#[0-9a-fA-F]{3,8}|rgba?\()/.test(value);
}

describe('theme/tokens', () => {
  it('colors はすべて実カラー値で解決されている', () => {
    Object.entries(colors).forEach(([key, value]) => {
      expect({ key, ok: isConcreteColor(value) }).toEqual({ key, ok: true });
    });
  });

  it('statusTone / spendStatusUi / insightUi はすべて実カラー値で解決されている', () => {
    Object.values(statusTone).forEach((tone) =>
      Object.values(tone).forEach((value) => expect(isConcreteColor(value)).toBe(true)),
    );
    Object.values(spendStatusUi).forEach((ui) =>
      Object.values(ui).forEach((value) => expect(isConcreteColor(value)).toBe(true)),
    );
    Object.values(insightUi).forEach((ui) =>
      Object.values(ui).forEach((value) => expect(isConcreteColor(value)).toBe(true)),
    );
  });

  it('背景色は Web の --background と同値（手動転記時代の乖離 #faf6f2 が再発していない）', () => {
    expect(colors.background).toBe('#fffdf5');
  });
});
