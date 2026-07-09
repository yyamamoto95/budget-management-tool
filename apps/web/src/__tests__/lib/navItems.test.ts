import { describe, expect, it } from "vitest";
import { NAV_ITEM_DEFS } from "@budget/common";
import { NAV_ITEMS } from "@/components/layout/navItems";

describe("NAV_ITEMS", () => {
  it("common の NAV_ITEM_DEFS（SSOT）とラベル・パス・アイコンが一致する", () => {
    expect(NAV_ITEMS).toHaveLength(NAV_ITEM_DEFS.length);
    NAV_ITEM_DEFS.forEach((def, i) => {
      expect(NAV_ITEMS[i].label).toBe(def.label);
      expect(NAV_ITEMS[i].href).toBe(def.webPath);
      const icon = NAV_ITEMS[i].icon as { displayName?: string; name?: string };
      expect(icon.displayName ?? icon.name).toBe(def.iconName);
    });
  });
});
