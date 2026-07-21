import { useEffect, useMemo, useState } from "react";
import { sampleChargingSessions } from "../data/sampleData";
import type { ChargingSession } from "../types/ChargingSession";
import {
  loadChargingSessions,
  saveChargingSessions,
} from "../utils/storage";
import { mergeSessionCollections } from "../utils/backup";
import {
  calculateStatisticsSummary,
  groupSessionsByMonth,
  sortChargingSessions,
} from "../utils/statistics";

export function useChargingSessions() {
  const [chargingSessions, setChargingSessions] = useState<
    ChargingSession[]
  >(() => loadChargingSessions(sampleChargingSessions));

  useEffect(() => {
    saveChargingSessions(chargingSessions);
  }, [chargingSessions]);

  const sortedSessions = useMemo(
    () => sortChargingSessions(chargingSessions),
    [chargingSessions],
  );

  const groupedMonths = useMemo(
    () => groupSessionsByMonth(sortedSessions),
    [sortedSessions],
  );

  const statisticsSummary = useMemo(
    () => calculateStatisticsSummary(chargingSessions),
    [chargingSessions],
  );

  function addChargingSession(session: ChargingSession) {
    setChargingSessions((currentSessions) => [
      session,
      ...currentSessions,
    ]);
  }

  function updateChargingSession(updatedSession: ChargingSession) {
    setChargingSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === updatedSession.id
          ? updatedSession
          : session,
      ),
    );
  }

  function deleteChargingSession(sessionId: number) {
    setChargingSessions((currentSessions) =>
      currentSessions.filter(
        (session) => session.id !== sessionId,
      ),
    );
  }

  function importChargingSessions(
    importedSessions: ChargingSession[],
    mode: "merge" | "replace",
  ) {
    setChargingSessions((currentSessions) =>
      mode === "replace"
        ? importedSessions
        : mergeSessionCollections(currentSessions, importedSessions),
    );
  }

  return {
    chargingSessions,
    sortedSessions,
    latestSession: sortedSessions[0],
    groupedMonths,
    statisticsSummary,
    addChargingSession,
    updateChargingSession,
    deleteChargingSession,
    importChargingSessions,
  };
}
