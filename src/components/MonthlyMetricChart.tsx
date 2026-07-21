import { useId, useMemo } from "react";

export interface MetricChartPoint {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
}

interface MonthlyMetricChartProps {
  title: string;
  eyebrow: string;
  unit: string;
  points: MetricChartPoint[];
  maximumFractionDigits?: number;
  ariaPeriodLabel?: string;
}

const VIEWBOX_HEIGHT = 230;
const PADDING_TOP = 22;
const PADDING_RIGHT = 18;
const PADDING_BOTTOM = 46;
const PADDING_LEFT = 54;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

function formatValue(value: number, maximumFractionDigits: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits });
}

function getNiceMaximum(value: number) {
  if (value <= 0) return 1;

  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  let niceNormalized = 1;

  if (normalized > 5) niceNormalized = 10;
  else if (normalized > 2) niceNormalized = 5;
  else if (normalized > 1) niceNormalized = 2;

  const step = niceNormalized * magnitude;
  return Math.ceil(value / step) * step;
}

function MonthlyMetricChart({
  title,
  eyebrow,
  unit,
  points,
  maximumFractionDigits = 1,
  ariaPeriodLabel = "zamana",
}: MonthlyMetricChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const glowId = useId().replace(/:/g, "");

  const normalizedPoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.value)),
    [points],
  );

  const chartWidth = Math.max(
    330,
    PADDING_LEFT + PADDING_RIGHT + Math.max(normalizedPoints.length - 1, 1) * 78,
  );
  const plotWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const maximumValue = getNiceMaximum(
    Math.max(...normalizedPoints.map((point) => point.value), 0),
  );

  const plottedPoints = normalizedPoints.map((point, index) => {
    const x =
      normalizedPoints.length === 1
        ? PADDING_LEFT + plotWidth / 2
        : PADDING_LEFT + (index / (normalizedPoints.length - 1)) * plotWidth;
    const y = PADDING_TOP + PLOT_HEIGHT - (point.value / maximumValue) * PLOT_HEIGHT;
    return { ...point, x, y };
  });

  const linePoints = plottedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = plottedPoints.length
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

      {normalizedPoints.length === 0 ? (
        <div className="metric-chart-empty">Grafik için henüz yeterli kayıt yok.</div>
      ) : (
        <div className="metric-chart-scroll">
          <svg
            className="metric-chart"
            viewBox={`0 0 ${chartWidth} ${VIEWBOX_HEIGHT}`}
            role="img"
            aria-label={`${title}, ${ariaPeriodLabel} göre ${unit}`}
            style={{ minWidth: `${chartWidth}px` }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
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
                  {formatValue(tick.value, maximumFractionDigits)}
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
              <polygon className="metric-chart-area" points={areaPoints} fill={`url(#${gradientId})`} />
            )}
            {plottedPoints.length > 1 && (
              <polyline className="metric-chart-line-glow" points={linePoints} filter={`url(#${glowId})`} />
            )}
            {plottedPoints.length > 1 && (
              <polyline className="metric-chart-line" points={linePoints} />
            )}

            {plottedPoints.map((point) => (
              <g className="metric-chart-point" key={point.key}>
                <circle className="metric-chart-dot-halo" cx={point.x} cy={point.y} r="8" />
                <circle className="metric-chart-dot" cx={point.x} cy={point.y} r="4" />
                <text
                  className="metric-chart-value"
                  x={point.x}
                  y={Math.max(point.y - 12, 12)}
                  textAnchor="middle"
                >
                  {formatValue(point.value, maximumFractionDigits)}
                </text>
                <text
                  className="metric-chart-x-label"
                  x={point.x}
                  y={VIEWBOX_HEIGHT - 18}
                  textAnchor="middle"
                >
                  {point.shortLabel}
                </text>
                <title>{`${point.label}: ${formatValue(point.value, maximumFractionDigits)} ${unit}`}</title>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

export default MonthlyMetricChart;
