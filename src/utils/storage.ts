import type { ChargingSession } from "../types/ChargingSession";

export const CHARGING_SESSIONS_STORAGE_KEY =
  "chargeflow-sessions";

function mergeUniqueSessions(
  savedSessions: ChargingSession[],
  fallbackSessions: ChargingSession[],
) {
  const sessionMap = new Map<string, ChargingSession>();

  /*
   * Önce örnek kayıtlar eklenir, sonra kullanıcının kayıtları
   * aynı tarih/saat kombinasyonunda varsa onların üzerine yazılır.
   */
  fallbackSessions.forEach((session) => {
    sessionMap.set(
      `${session.date}-${session.time}-${session.odometer}`,
      session,
    );
  });

  savedSessions.forEach((session) => {
    sessionMap.set(
      `${session.date}-${session.time}-${session.odometer}`,
      session,
    );
  });

  return Array.from(sessionMap.values());
}

export function loadChargingSessions(
  fallbackSessions: ChargingSession[],
) {
  const savedSessions = localStorage.getItem(
    CHARGING_SESSIONS_STORAGE_KEY,
  );

  if (!savedSessions) {
    return fallbackSessions;
  }

  try {
    const parsedSessions = JSON.parse(
      savedSessions,
    ) as ChargingSession[];

    /*
     * Test sırasında yalnızca birkaç kayıt varsa 12 aylık örnek
     * veri bunlara eklenir. Böylece kullanıcının oluşturduğu kayıt
     * korunur ve ekran gerçekçi bir veri setiyle test edilebilir.
     *
     * Bir sonraki kayıtta birleşik liste localStorage'a yazıldığı
     * için örnekler tekrar tekrar çoğalmaz.
     */
    if (parsedSessions.length < 12) {
      return mergeUniqueSessions(
        parsedSessions,
        fallbackSessions,
      );
    }

    return parsedSessions;
  } catch {
    return fallbackSessions;
  }
}

export function saveChargingSessions(
  sessions: ChargingSession[],
) {
  localStorage.setItem(
    CHARGING_SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions),
  );
}
