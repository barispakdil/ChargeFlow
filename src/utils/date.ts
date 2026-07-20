import type { ChargingSession } from "../types/ChargingSession";

export const MONTHS = [
  "OCA",
  "ŞUB",
  "MAR",
  "NİS",
  "MAY",
  "HAZ",
  "TEM",
  "AĞU",
  "EYL",
  "EKİ",
  "KAS",
  "ARA",
] as const;

export function getSessionDate(session: ChargingSession) {
  return new Date(`${session.date}T${session.time}`);
}

export function getDayDifference(
  currentSession: ChargingSession,
  previousSession: ChargingSession,
) {
  const milliseconds =
    getSessionDate(currentSession).getTime() -
    getSessionDate(previousSession).getTime();

  return Math.max(
    1,
    Math.round(milliseconds / (1000 * 60 * 60 * 24)),
  );
}

export function formatSessionDate(session: ChargingSession) {
  return new Intl.DateTimeFormat("tr-TR").format(
    getSessionDate(session),
  );
}
