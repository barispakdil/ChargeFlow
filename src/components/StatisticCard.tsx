interface StatisticCardProps {
  icon: string;
  title: string;
  value: number;
  unit: string;
  maximumFractionDigits: number;
}

function StatisticCard({
  icon,
  title,
  value,
  unit,
  maximumFractionDigits,
}: StatisticCardProps) {
  return (
    <article className="statistics-card">
      <span className="statistics-card-icon">{icon}</span>
      <small>{title}</small>

      <strong>
        {value.toLocaleString("tr-TR", {
          maximumFractionDigits,
        })}
        <span> {unit}</span>
      </strong>
    </article>
  );
}

export default StatisticCard;
