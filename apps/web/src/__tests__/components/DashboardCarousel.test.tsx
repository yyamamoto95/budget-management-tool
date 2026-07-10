import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCarousel, type CarouselSlide } from "@/components/dashboard/DashboardCarousel";

const slides: CarouselSlide[] = [
  { key: "a", label: "スライドA", node: <div>コンテンツA</div> },
  { key: "b", label: "スライドB", node: <div>コンテンツB</div> },
  { key: "c", label: "スライドC", node: <div>コンテンツC</div> },
];

describe("DashboardCarousel", () => {
  it("初期表示: 先頭スライドのみが表示され、ドットが枚数ぶん描画される", () => {
    render(<DashboardCarousel slides={slides} />);
    expect(screen.getByText("コンテンツA")).toBeInTheDocument();
    expect(screen.queryByText("コンテンツB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "スライドA" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "スライドC" })).toBeInTheDocument();
  });

  it("ドットをタップすると該当スライドに切り替わる", async () => {
    render(<DashboardCarousel slides={slides} />);
    fireEvent.click(screen.getByRole("button", { name: "スライドB" }));
    // AnimatePresence(mode=wait) の退場アニメーション完了後に次スライドがマウントされる
    expect(await screen.findByText("コンテンツB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "スライドB" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("＞で次へ、＜で前へ切り替わる", async () => {
    render(<DashboardCarousel slides={slides} />);
    fireEvent.click(screen.getByRole("button", { name: "次のカード" }));
    expect(await screen.findByText("コンテンツB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "前のカード" }));
    expect(await screen.findByText("コンテンツA")).toBeInTheDocument();
  });

  it("先頭で＜が、末尾で＞が disabled になる", () => {
    render(<DashboardCarousel slides={slides} />);
    expect(screen.getByRole("button", { name: "前のカード" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "スライドC" }));
    expect(screen.getByRole("button", { name: "次のカード" })).toBeDisabled();
  });

  it("スライドが空のとき、何も描画しない", () => {
    render(<DashboardCarousel slides={[]} />);
    expect(screen.queryByTestId("dashboard-carousel")).not.toBeInTheDocument();
  });
});
