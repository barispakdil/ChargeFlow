import { STATISTIC_CARDS } from "../data/statisticsConfig";
import type {
  GroupedMonth,
  StatisticsSummary,
} from "../utils/statistics";
import MonthlyMetricChart from "./MonthlyMetricChart";
import StatisticCard from "./StatisticCard";

interface StatisticsViewProps {
  summary: StatisticsSummary;
  months: GroupedMonth[];
}

function StatisticsView({
  summary,
  months,
}: StatisticsViewProps) {
  return (
    <section className="statistics-view">
      <div className="section-heading">
        <div>
          <span>GENEL BAKIŞ</span>
          <h2>İstatistikler</h2>
        </div>

        <small>{summary.totalSessions} şarj kaydı</small>
      </div>

      <section className="statistics-grid">
        {STATISTIC_CARDS.map((card) => (
          <StatisticCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            value={summary[card.valueKey]}
            unit={card.unit}
            maximumFractionDigits={
              card.maximumFractionDigits
            }
          />
        ))}
      </section>

      <section className="statistics-chart-stack">
        <MonthlyMetricChart
          eyebrow="AYLIK ENERJİ"
          title="Tüketilen Enerji"
          unit="kWh"
          metric="totalEnergy"
          months={months}
          maximumFractionDigits={1}
        />

        <MonthlyMetricChart
          eyebrow="AYLIK VERİMLİLİK"
          title="Ortalama Tüketim"
          unit="kWh/100 km"
          metric="averageConsumption"
          months={months}
          maximumFractionDigits={1}
        />

        <MonthlyMetricChart
          eyebrow="AYLIK SÜRÜŞ"
          title="Yapılan Mesafe"
          unit="km"
          metric="totalDistance"
          months={months}
          maximumFractionDigits={0}
        />

        <MonthlyMetricChart
          eyebrow="AYLIK MALİYET"
          title="Şarj Faturası"
          unit="₺"
          metric="totalCost"
          months={months}
          maximumFractionDigits={2}
        />
      </section>
    </section>
  );
}

export default StatisticsView;
