import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuideTab } from "@/components/settings/GuideTab";

describe("GuideTab", () => {
  it("使い方ガイドの導線が近日公開プレースホルダとして表示される", () => {
    render(<GuideTab />);
    expect(screen.getByText("ホーム画面ガイド")).toBeInTheDocument();
    expect(screen.getByText("管理設定ガイド")).toBeInTheDocument();
    expect(screen.getAllByText("近日公開")).toHaveLength(2);
  });

  it("診断のしくみは初期状態で閉じている", () => {
    render(<GuideTab />);
    expect(screen.getByRole("button", { name: /投資余力診断のしくみ/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("ちなみに、どう計算している？")).not.toBeInTheDocument();
  });

  it("診断のしくみをタップすると「ちなみに」補足が開閉する", async () => {
    render(<GuideTab />);
    const toggle = screen.getByRole("button", { name: /投資余力診断のしくみ/ });
    fireEvent.click(toggle);
    expect(await screen.findByText("ちなみに、どう計算している？")).toBeInTheDocument();
    expect(
      screen.getByText(/生活費 6 ヶ月分の備え/),
    ).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
