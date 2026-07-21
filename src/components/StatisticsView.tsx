import { useMemo, useState } from "react";
import { STATISTIC_CARDS } from "../data/statisticsConfig";
import type { ChargingSession } from "../types/ChargingSession";
import { getSessionDate } from "../utils/date";
import type { StatisticsSummary } from "../utils/statistics";
import MonthlyMetricChart, { type MetricChartPoint } from "./MonthlyMetricChart";
import StatisticCard from "./StatisticCard";

type ChartRange = "sessions" | "weekly" | "monthly" | "yearly";
type MetricKey = "energy" | "consumption" | "distance" | "cost";

interface StatisticsViewProps {
  summary: StatisticsSummary;
  sessions: ChargingSession[];
}

interface AggregatedPoint {
  key: string;
  label: string;
  shortLabel: string;
  energy: number;
  consumption: number;
  distance: number;
  cost: number;
}

const RANGE_OPTIONS: Array<{ id: ChartRange; label: string }> = [
  { id: "sessions", label: "Bütün Şarjlar" },
  { id: "weekly", label: "Haftalık Ort." },
  { id: "monthly", label: "Aylık Ort." },
  { id: "yearly", label: "Yıllık Ort." },
];

function getCost(session: ChargingSession) {
  return Number.isFinite(session.cost)
    ? session.cost
    : session.energy * session.pricePerKwh;
}

function getIsoWeek(date: Date) {
  const working = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = working.getUTCDay() || 7;
  working.setUTCDate(working.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(working.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((working.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: working.getUTCFullYear(), week };
}

function monthShort(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { month: "short" })
    .format(date)
    .replace(".", "")
    .toLocaleUpperCase("tr-TR");
}

function createSessionPoints(sessions: ChargingSession[]): AggregatedPoint[] {
  const ascending = [...sessions].sort(
    (a, b) => getSessionDate(a).getTime() - getSessionDate(b).getTime(),
  );

  return ascending.map((session, index) => {
    const previous = ascending[index - 1];
    const distance = previous ? Math.max(0, session.odometer - previous.odometer) : 0;
    const consumption = distance > 0 ? (session.energy / distance) * 100 : 0;
    const date = getSessionDate(session);
    const fullLabel = new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);

    return {
      key: String(session.id),
      label: fullLabel,
      shortLabel: `${date.getDate()} ${monthShort(date)}`,
      energy: session.energy,
      consumption,
      distance,
      cost: getCost(session),
    };
  });
}

function createGroupedPoints(sessions: ChargingSession[], range: Exclude<ChartRange, "sessions">) {
  const sessionPoints = createSessionPoints(sessions);
  const ascendingSessions = [...sessions].sort(
    (a, b) => getSessionDate(a).getTime() - getSessionDate(b).getTime(),
  );
  const groups = new Map<string, { label: string; shortLabel: string; indexes: number[] }>();

  ascendingSessions.forEach((session, index) => {
    const date = getSessionDate(session);
    let key = "";
    let label = "";
    let shortLabel = "";

    if (range === "weekly") {
      const { year, week } = getIsoWeek(date);
      key = `${year}-W${String(week).padStart(2, "0")}`;
      label = `${year} · ${week}. hafta`;
      shortLabel = `H${week} ${String(year).slice(-2)}`;
    } else if (range === "monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      label = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(date);
      shortLabel = `${monthShort(date)} ${String(date.getFullYear()).slice(-2)}`;
    } else {
      key = String(date.getFullYear());
      label = `${date.getFullYear()} yılı`;
      shortLabel = String(date.getFullYear());
    }

    const current = groups.get(key) ?? { label, shortLabel, indexes: [] };
    current.indexes.push(index);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([key, group]) => {
    const points = group.indexes.map((index) => sessionPoints[index]);
    const count = Math.max(points.length, 1);
    const totalEnergy = points.reduce((sum, point) => sum + point.energy, 0);
    const totalDistance = points.reduce((sum, point) => sum + point.distance, 0);
    const totalCost = points.reduce((sum, point) => sum + point.cost, 0);

    return {
      key,
      label: group.label,
      shortLabel: group.shortLabel,
      energy: totalEnergy / count,
      consumption: totalDistance > 0 ? (totalEnergy / totalDistance) * 100 : 0,
      distance: totalDistance / count,
      cost: totalCost / count,
    };
  });
}

function toMetricPoints(points: AggregatedPoint[], metric: MetricKey): MetricChartPoint[] {
  return points.map((point) => ({
    key: point.key,
    label: point.label,
    shortLabel: point.shortLabel,
    value: point[metric],
  }));
}

function StatisticsView({ summary, sessions }: StatisticsViewProps) {
  const [range, setRange] = useState<ChartRange>("monthly");

  const chartPoints = useMemo(() => {
    if (range === "sessions") return createSessionPoints(sessions);
    return createGroupedPoints(sessions, range);
  }, [range, sessions]);

  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "";
  const averagePrefix = range === "sessions" ? "" : "ORTALAMA ";

  return (
    <section className="statistics-view">
      <div className="section-heading">
        <div>
          <span>GENEL BAKIŞ</span>
          <h2>İstatistikler</h2>
        </div>
        <small>{summary.totalSessions} şarj kaydı</small>
      </div>

      <div className="statistics-range-selector" role="tablist" aria-label="Grafik zaman aralığı">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={range === option.id}
            className={range === option.id ? "active" : ""}
            onClick={() => setRange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="statistics-chart-stack">
        <MonthlyMetricChart
          eyebrow={`${averagePrefix}ENERJİ`}
          title={range === "sessions" ? "Şarj Başına Enerji" : "Ortalama Şarj Enerjisi"}
          unit="kWh"
          points={toMetricPoints(chartPoints, "energy")}
          maximumFractionDigits={1}
          ariaPeriodLabel={rangeLabel}
        />
        <MonthlyMetricChart
          eyebrow={`${averagePrefix}VERİMLİLİK`}
          title="Ortalama Tüketim"
          unit="kWh/100 km"
          points={toMetricPoints(chartPoints, "consumption")}
          maximumFractionDigits={1}
          ariaPeriodLabel={rangeLabel}
        />
        <MonthlyMetricChart
          eyebrow={`${averagePrefix}SÜRÜŞ`}
          title={range === "sessions" ? "Şarjlar Arası Mesafe" : "Ortalama Mesafe"}
          unit="km"
          points={toMetricPoints(chartPoints, "distance")}
          maximumFractionDigits={0}
          ariaPeriodLabel={rangeLabel}
        />
        <MonthlyMetricChart
          eyebrow={`${averagePrefix}MALİYET`}
          title={range === "sessions" ? "Şarj Maliyeti" : "Ortalama Şarj Maliyeti"}
          unit="₺"
          points={toMetricPoints(chartPoints, "cost")}
          maximumFractionDigits={2}
          ariaPeriodLabel={rangeLabel}
        />
      </section>

      <section className="statistics-overview-section">
        <div className="statistics-overview-heading">
          <span>TOPLAM DEĞERLER</span>
          <small>Tüm kayıtlar</small>
        </div>
        <section className="statistics-grid">
          {STATISTIC_CARDS.map((card) => (
            <StatisticCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              value={summary[card.valueKey]}
              unit={card.unit}
              maximumFractionDigits={card.maximumFractionDigits}
            />
          ))}
        </section>
      </section>
    </section>
  );
}

export default StatisticsView;
