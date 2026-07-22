import type { ChargingSession } from "../types/ChargingSession";
import { calculateIntervalConsumption } from "./consumption";
import { getSessionDate } from "./date";

export interface StatisticsSummary {
  totalEnergy: number;
  totalDistance: number;
  averageConsumption: number;
  totalSessions: number;
}

export interface GroupedMonth {
  key: string;
  label: string;
  sessions: ChargingSession[];
  totalEnergy: number;
  totalDistance: number;
  averageConsumption: number;
  totalCost: number;
}

export function sortChargingSessions(sessions: ChargingSession[]) {
  return [...sessions].sort(
    (first, second) => getSessionDate(second).getTime() - getSessionDate(first).getTime(),
  );
}

export function calculateStatisticsSummary(
  sessions: ChargingSession[],
  batteryCapacityKwh?: number | null,
): StatisticsSummary {
  const sortedDescending = sortChargingSessions(sessions);
  const ascending = [...sortedDescending].reverse();

  const totalEnergy = sessions.reduce((total, session) => total + session.energy, 0);
  let totalDistance = 0;
  let totalConsumedEnergy = 0;

  ascending.forEach((session, index) => {
    const interval = calculateIntervalConsumption(session, ascending[index - 1], batteryCapacityKwh);
    if (interval.consumption > 0) {
      totalDistance += interval.distance;
      totalConsumedEnergy += interval.consumedEnergy;
    }
  });

  return {
    totalEnergy,
    totalDistance,
    averageConsumption: totalDistance > 0 ? (totalConsumedEnergy / totalDistance) * 100 : 0,
    totalSessions: sessions.length,
  };
}

export function groupSessionsByMonth(
  sortedSessions: ChargingSession[],
  batteryCapacityKwh?: number | null,
): GroupedMonth[] {
  const monthMap = new Map<string, ChargingSession[]>();

  sortedSessions.forEach((session) => {
    const sessionDate = getSessionDate(session);
    const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(monthKey, [...(monthMap.get(monthKey) ?? []), session]);
  });

  return Array.from(monthMap.entries()).map(([monthKey, sessions]) => {
    const totalEnergy = sessions.reduce((total, session) => total + session.energy, 0);
    const totalCost = sessions.reduce(
      (total, session) => total + (Number.isFinite(session.cost) ? session.cost : session.energy * session.pricePerKwh),
      0,
    );

    let totalDistance = 0;
    let totalConsumedEnergy = 0;

    sessions.forEach((session) => {
      const globalIndex = sortedSessions.findIndex((item) => item.id === session.id);
      const previousSession = sortedSessions[globalIndex + 1];
      const interval = calculateIntervalConsumption(session, previousSession, batteryCapacityKwh);
      if (interval.consumption > 0) {
        totalDistance += interval.distance;
        totalConsumedEnergy += interval.consumedEnergy;
      }
    });

    const firstSessionDate = getSessionDate(sessions[0]);
    const label = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" })
      .format(firstSessionDate)
      .toLocaleUpperCase("tr-TR");

    return {
      key: monthKey,
      label,
      sessions,
      totalEnergy,
      totalDistance,
      averageConsumption: totalDistance > 0 ? (totalConsumedEnergy / totalDistance) * 100 : 0,
      totalCost,
    };
  });
}
