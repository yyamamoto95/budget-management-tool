import { describe, expect, it } from "vitest";
import { CATEGORY_ICON_NAMES } from "@budget/common";
import { getCategoryIcon } from "@/lib/categoryTokens";

describe("getCategoryIcon", () => {
  it("common の CATEGORY_ICON_NAMES（SSOT）と各 key のアイコンが一致する", () => {
    for (const [key, iconName] of Object.entries(CATEGORY_ICON_NAMES)) {
      const component = getCategoryIcon(key) as { displayName?: string; name?: string };
      const actual = component.displayName ?? component.name;
      expect(`${key}:${actual}`).toBe(`${key}:${iconName}`);
    }
  });

  it("未知の key は Tag にフォールバックする", () => {
    const component = getCategoryIcon("unknown-key") as { displayName?: string; name?: string };
    expect(component.displayName ?? component.name).toBe("Tag");
  });
});
