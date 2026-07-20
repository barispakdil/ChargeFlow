import type { StatisticsSummary } from "../utils/statistics";

export type StatisticValueKey = keyof StatisticsSummary;

export interface StatisticCardConfig {
  id: string;
  icon: string;
  title: string;
  valueKey: StatisticValueKey;
  unit: string;
  maximumFractionDigits: number;
}

/*
 * İstatistik kartlarını buradan yönetebilirsin.
 *
 * Kartı kaldırmak:
 * İlgili nesneyi bu diziden sil.
 *
 * Kart sırasını değiştirmek:
 * Nesnelerin sırasını değiştir.
 *
 * Yeni kart eklemek:
 * Önce StatisticsSummary içine hesaplanan alanı ekle,
 * sonra aşağıdaki diziye yeni bir nesne ekle.
 */
export const STATISTIC_CARDS: StatisticCardConfig[] = [
  {
    id: "energy",
    icon: "⚡",
    title: "Toplam Enerji",
    valueKey: "totalEnergy",
    unit: "kWh",
    maximumFractionDigits: 1,
  },
  {
    id: "distance",
    icon: "🚘",
    title: "Toplam Mesafe",
    valueKey: "totalDistance",
    unit: "km",
    maximumFractionDigits: 0,
  },
  {
    id: "consumption",
    icon: "⌁",
    title: "Ortalama Tüketim",
    valueKey: "averageConsumption",
    unit: "kWh/100 km",
    maximumFractionDigits: 1,
  },
  {
    id: "sessions",
    icon: "▣",
    title: "Toplam Şarj",
    valueKey: "totalSessions",
    unit: "işlem",
    maximumFractionDigits: 0,
  },
];
