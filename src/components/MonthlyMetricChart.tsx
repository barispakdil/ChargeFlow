import { useId, useMemo } from "react";
import type { GroupedMonth } from "../utils/statistics";

type MetricKey =
  | "totalEnergy"
  | "averageConsumption"
  | "totalDistance"
  | "totalCost";

interface MonthlyMetricChartProps {
  title: string;
  eyebrow: string;
  unit: string;
  metric: MetricKey;
  months: GroupedMonth[];
  maximumFractionDigits?: number;
}

interface ChartPoint {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
}

const VIEWBOX_HEIGHT = 230;
const PADDING_TOP = 22;
const PADDING_RIGHT = 18;
const PADDING_BOTTOM = 46;
const PADDING_LEFT = 54;
const PLOT_HEIGHT =
  VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function formatValue(
  value: number,
  maximumFractionDigits: number,
) {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits,
  });
}

function getNiceMaximum(value: number) {
  if (value <= 0) {
    return 1;
  }

  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  let niceNormalized = 1;

  if (normalized > 5) {
    niceNormalized = 10;
  } else if (normalized > 2) {
    niceNormalized = 5;
  } else if (normalized > 1) {
    niceNormalized = 2;
  }

  const step = niceNormalized * magnitude;

  return Math.ceil(value / step) * step;
}

function createShortMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  const monthName = new Intl.DateTimeFormat("tr-TR", {
    month: "short",
  })
    .format(date)
    .replace(".", "")
    .toLocaleUpperCase("tr-TR");

  return `${monthName} ${String(year).slice(-2)}`;
}

function MonthlyMetricChart({
  title,
  eyebrow,
  unit,
  metric,
  months,
  maximumFractionDigits = 1,
}: MonthlyMetricChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const glowId = useId().replace(/:/g, "");

  const points = useMemo<ChartPoint[]>(() => {
    return [...months]
      .sort((first, second) =>
        first.key.localeCompare(second.key),
      )
      .map((month) => ({
        key: month.key,
        label: month.label,
        shortLabel: createShortMonthLabel(month.key),
        value: month[metric],
      }));
  }, [metric, months]);

  const chartWidth = Math.max(
    330,
    PADDING_LEFT +
      PADDING_RIGHT +
      Math.max(points.length - 1, 1) * 78,
  );
  const plotWidth =
    chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const maximumValue = getNiceMaximum(
    Math.max(...points.map((point) => point.value), 0),
  );

  const plottedPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? PADDING_LEFT + plotWidth / 2
        : PADDING_LEFT +
          (index / (points.length - 1)) * plotWidth;

    const y =
      PADDING_TOP +
      PLOT_HEIGHT -
      (point.value / maximumValue) * PLOT_HEIGHT;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePoints = plottedPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPoints =
    plottedPoints.length > 0
      ? `${PADDING_LEFT},${PADDING_TOP + PLOT_HEIGHT} ${linePoints} ${
          plottedPoints[plottedPoints.length - 1].x
        },${PADDING_TOP + PLOT_HEIGHT}`
      : "";

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;

    return {
      value: maximumValue * (1 - ratio),
      y: PADDING_TOP + PLOT_HEIGHT * ratio,
    };
  });

  return (
    <section className="metric-chart-card">
      <div className="metric-chart-header">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>

        <small>{unit}</small>
      </div>

      {points.length === 0 ? (
        <div className="metric-chart-empty">
          Grafik için henüz yeterli kayıt yok.
        </div>
      ) : (
        <div className="metric-chart-scroll">
          <svg
            className="metric-chart"
            viewBox={`0 0 ${chartWidth} ${VIEWBOX_HEIGHT}`}
            role="img"
            aria-label={`${title}, aylara göre ${unit}`}
            style={{ minWidth: `${chartWidth}px` }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0"
                />
              </linearGradient>

              <filter
                id={glowId}
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur
                  stdDeviation="3"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  className="metric-chart-grid-line"
                  x1={PADDING_LEFT}
                  x2={chartWidth - PADDING_RIGHT}
                  y1={tick.y}
                  y2={tick.y}
                />
                <text
                  className="metric-chart-y-label"
                  x={PADDING_LEFT - 9}
                  y={tick.y + 3}
                  textAnchor="end"
                >
                  {formatValue(
                    tick.value,
                    maximumFractionDigits,
                  )}
                </text>
              </g>
            ))}

            <line
              className="metric-chart-axis"
              x1={PADDING_LEFT}
              x2={chartWidth - PADDING_RIGHT}
              y1={PADDING_TOP + PLOT_HEIGHT}
              y2={PADDING_TOP + PLOT_HEIGHT}
            />

            {areaPoints && (
              <polygon
                className="metric-chart-area"
                points={areaPoints}
                fill={`url(#${gradientId})`}
              />
            )}

            {plottedPoints.length > 1 && (
              <polyline
                className="metric-chart-line-glow"
                points={linePoints}
                filter={`url(#${glowId})`}
              />
            )}

            {plottedPoints.length > 1 && (
              <polyline
                className="metric-chart-line"
                points={linePoints}
              />
            )}

            {plottedPoints.map((point) => (
              <g className="metric-chart-point" key={point.key}>
                <circle
                  className="metric-chart-dot-halo"
                  cx={point.x}
                  cy={point.y}
                  r="8"
                />
                <circle
                  className="metric-chart-dot"
                  cx={point.x}
                  cy={point.y}
                  r="4"
                />
                <text
                  className="metric-chart-value"
                  x={point.x}
                  y={Math.max(point.y - 12, 12)}
                  textAnchor="middle"
                >
                  {formatValue(
                    point.value,
                    maximumFractionDigits,
                  )}
                </text>
                <text
                  className="metric-chart-x-label"
                  x={point.x}
                  y={VIEWBOX_HEIGHT - 18}
                  textAnchor="middle"
                >
                  {point.shortLabel}
                </text>
                <title>
                  {`${point.label}: ${formatValue(
                    point.value,
                    maximumFractionDigits,
                  )} ${unit}`}
                </title>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

export default MonthlyMetricChart;
