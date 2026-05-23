type Slice = {
  name: string;
  color: string;
  amount: number;
};

type ArcSlice = Slice & {
  startAngle: number;
  endAngle: number;
  pct: number;
};

const CX = 100;
const CY = 100;
const OUTER_R = 80;
const INNER_R = 50;

// eslint-disable-next-line max-params -- SVG幾何計算ユーティリティ; 4引数はすべて意味的に独立している
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcs(slices: Slice[], total: number): ArcSlice[] {
  let angle = -90;
  return slices.map((sl) => {
    const sweep = (sl.amount / total) * 360;
    const startAngle = angle;
    const endAngle = angle + Math.min(sweep, 359.9999);
    angle += sweep;
    return {
      ...sl,
      startAngle,
      endAngle,
      pct: Math.round((sl.amount / total) * 100),
    };
  });
}

function ArcPath({ arc }: { arc: ArcSlice }) {
  const outerStart = polarToCartesian(CX, CY, OUTER_R, arc.startAngle);
  const outerEnd = polarToCartesian(CX, CY, OUTER_R, arc.endAngle);
  const innerStart = polarToCartesian(CX, CY, INNER_R, arc.startAngle);
  const innerEnd = polarToCartesian(CX, CY, INNER_R, arc.endAngle);
  const largeArc = arc.endAngle - arc.startAngle > 180 ? 1 : 0;
  const d = [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
  return <path d={d} fill={arc.color} stroke="white" strokeWidth="2" />;
}

export function CategoryDonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, sl) => s + sl.amount, 0);
  if (total === 0) return null;

  const arcs = buildArcs(slices, total);

  return (
    <div>
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-44 h-44"
          role="img"
          aria-label="カテゴリ別支出円グラフ"
        >
          {arcs.map((arc) => (
            <ArcPath key={arc.name} arc={arc} />
          ))}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#1c1410"
            opacity="0.5"
          >
            支出合計
          </text>
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fontSize="13"
            fontWeight="900"
            fill="#1c1410"
          >
            ¥{total.toLocaleString()}
          </text>
        </svg>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {arcs.map((arc) => (
          <li
            key={arc.name}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-[#1c1410]/10"
                style={{ backgroundColor: arc.color }}
              />
              <span className="font-bold text-[#1c1410]">{arc.name}</span>
            </span>
            <span className="font-bold tabular-nums text-[#1c1410]/60">
              ¥{arc.amount.toLocaleString()}{' '}
              <span className="text-xs">({arc.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
