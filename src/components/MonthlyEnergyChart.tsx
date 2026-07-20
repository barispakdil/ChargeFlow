import type { GroupedMonth } from "../utils/statistics";

interface MonthlyEnergyChartProps {
  months: GroupedMonth[];
}

function MonthlyEnergyChart({
  months,
}: MonthlyEnergyChartProps) {
  const highestEnergy = Math.max(
    ...months.map((month) => month.totalEnergy),
    1,
  );

  return (
    <section className="monthly-chart-card">
      <div className="monthly-chart-header">
        <div>
          <span>AYLIK KARŞILAŞTIRMA</span>
          <h3>Enerji Kullanımı</h3>
        </div>

        <small>kWh</small>
      </div>

      <div className="monthly-chart-list">
        {months.map((month) => {
          const barWidth =
            (month.totalEnergy / highestEnergy) * 100;

          return (
            <div
              className="monthly-chart-row"
              key={month.key}
            >
              <span>{month.label}</span>

              <div className="monthly-chart-track">
                <div
                  className="monthly-chart-fill"
                  style={{
                    width: `${barWidth}%`,
                  }}
                />
              </div>

              <strong>
                {month.totalEnergy.toLocaleString("tr-TR", {
                  maximumFractionDigits: 1,
                })}
              </strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default MonthlyEnergyChart;
