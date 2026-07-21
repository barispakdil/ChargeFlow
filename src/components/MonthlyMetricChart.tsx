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

function getYAxisDomain(values: number[]) {
  const minimumValue = Math.min(...values);
  const maximumValue = Math.max(...values);

  // Kullanıcının istediği ölçek: minimumun %10 altı, maksimumun %10 üstü.
  let minimum = minimumValue - Math.abs(minimumValue) * 0.1;
  let maximum = maximumValue + Math.abs(maximumValue) * 0.1;

  // Çok küçük ya da teorik olarak aynı sınırlara düşen değerlerde grafiği koru.
  if (maximum <= minimum) {
    const padding = Math.max(Math.abs(maximumValue) * 0.1, 1);
    minimum = minimumValue - padding;
    maximum = maximumValue + padding;
  }

  return { minimum, maximum };
}

interface PositionedPoint extends MetricChartPoint {
  x: number;
  y: number;
}

function createSmoothPath(points: PositionedPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const smoothing = 0.18;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;

    const controlPointOneX = current.x + (next.x - previous.x) * smoothing;
    const controlPointOneY = current.y + (next.y - previous.y) * smoothing;
    const controlPointTwoX = next.x - (afterNext.x - current.x) * smoothing;
    const controlPointTwoY = next.y - (afterNext.y - current.y) * smoothing;

    path += ` C ${controlPointOneX} ${controlPointOneY}, ${controlPointTwoX} ${controlPointTwoY}, ${next.x} ${next.y}`;
  }

  return path;
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

  // 0 değerleri hem ölçekten hem de çizimden çıkarılır.
  const normalizedPoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.value) && point.value !== 0),
    [points],
  );

  const chartWidth = Math.max(
    330,
    PADDING_LEFT + PADDING_RIGHT + Math.max(normalizedPoints.length - 1, 1) * 78,
  );
  const plotWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;

  const domain = normalizedPoints.length
    ? getYAxisDomain(normalizedPoints.map((point) => point.value))
    : { minimum: 0, maximum: 1 };
  const domainRange = domain.maximum - domain.minimum;

  const plottedPoints: PositionedPoint[] = normalizedPoints.map((point, index) => {
    const x =
      normalizedPoints.length === 1
        ? PADDING_LEFT + plotWidth / 2
        : PADDING_LEFT + (index / (normalizedPoints.length - 1)) * plotWidth;
    const normalizedValue = (point.value - domain.minimum) / domainRange;
    const y = PADDING_TOP + PLOT_HEIGHT - normalizedValue * PLOT_HEIGHT;
    return { ...point, x, y };
  });

  const linePath = createSmoothPath(plottedPoints);
  const baselineY = PADDING_TOP + PLOT_HEIGHT;
  const areaPath = plottedPoints.length
    ? `${linePath} L ${plottedPoints[plottedPoints.length - 1].x} ${baselineY} L ${plottedPoints[0].x} ${baselineY} Z`
    : "";

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return {
      value: domain.maximum - domainRange * ratio,
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
        <div className="metric-chart-empty">
          <span aria-hidden="true">⌁</span>
          <strong>Henüz yeterli veri yok</strong>
          <small>Sıfırdan farklı kayıtlar eklendikçe grafik burada oluşacak.</small>
        </div>
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
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
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
              y1={baselineY}
              y2={baselineY}
            />

            {areaPath && (
              <path className="metric-chart-area" d={areaPath} fill={`url(#${gradientId})`} />
            )}
            {plottedPoints.length > 1 && (
              <path className="metric-chart-line-glow" d={linePath} filter={`url(#${glowId})`} />
            )}
            {plottedPoints.length > 1 && (
              <path className="metric-chart-line" d={linePath} />
            )}

            {plottedPoints.map((point, index) => {
              const isLastPoint = index === plottedPoints.length - 1;
              return (
                <g
                  className={`metric-chart-point${isLastPoint ? " metric-chart-point-last" : ""}`}
                  key={point.key}
                >
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
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

export default MonthlyMetricChart;
