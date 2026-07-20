import type { ChargingSession } from "../types/ChargingSession";
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

export function sortChargingSessions(
  sessions: ChargingSession[],
) {
  return [...sessions].sort(
    (first, second) =>
      getSessionDate(second).getTime() -
      getSessionDate(first).getTime(),
  );
}

export function calculateStatisticsSummary(
  sessions: ChargingSession[],
): StatisticsSummary {
  const sortedSessions = sortChargingSessions(sessions);

  const totalEnergy = sessions.reduce(
    (total, session) => total + session.energy,
    0,
  );

  const totalDistance =
    sortedSessions.length < 2
      ? 0
      : Math.max(
          0,
          sortedSessions[0].odometer -
            sortedSessions[sortedSessions.length - 1]
              .odometer,
        );

  const averageConsumption =
    totalDistance > 0
      ? (totalEnergy / totalDistance) * 100
      : 0;

  return {
    totalEnergy,
    totalDistance,
    averageConsumption,
    totalSessions: sessions.length,
  };
}

export function groupSessionsByMonth(
  sortedSessions: ChargingSession[],
): GroupedMonth[] {
  const monthMap = new Map<string, ChargingSession[]>();

  sortedSessions.forEach((session) => {
    const sessionDate = getSessionDate(session);

    const monthKey = `${sessionDate.getFullYear()}-${String(
      sessionDate.getMonth() + 1,
    ).padStart(2, "0")}`;

    const currentSessions = monthMap.get(monthKey) ?? [];

    monthMap.set(monthKey, [...currentSessions, session]);
  });

  return Array.from(monthMap.entries()).map(
    ([monthKey, sessions]) => {
      const totalEnergy = sessions.reduce(
        (total, session) => total + session.energy,
        0,
      );

      const totalCost = sessions.reduce(
        (total, session) =>
          total +
          (Number.isFinite(session.cost)
            ? session.cost
            : session.energy * session.pricePerKwh),
        0,
      );

      const totalDistance = sessions.reduce(
        (total, session) => {
          const globalIndex = sortedSessions.findIndex(
            (item) => item.id === session.id,
          );

          const previousSession =
            sortedSessions[globalIndex + 1];

          if (!previousSession) {
            return total;
          }

          return (
            total +
            Math.max(
              0,
              session.odometer - previousSession.odometer,
            )
          );
        },
        0,
      );

      const averageConsumption =
        totalDistance > 0
          ? (totalEnergy / totalDistance) * 100
          : 0;

      const firstSessionDate = getSessionDate(sessions[0]);

      const label = new Intl.DateTimeFormat("tr-TR", {
        month: "long",
        year: "numeric",
      })
        .format(firstSessionDate)
        .toLocaleUpperCase("tr-TR");

      return {
        key: monthKey,
        label,
        sessions,
        totalEnergy,
        totalDistance,
        averageConsumption,
        totalCost,
      };
    },
  );
}
