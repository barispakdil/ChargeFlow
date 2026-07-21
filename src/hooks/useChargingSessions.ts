import { useEffect, useMemo, useState } from "react";
import type { ChargingSession } from "../types/ChargingSession";
import { loadVehicleSessions, saveVehicleSessions } from "../utils/garage";
import { mergeSessionCollections } from "../utils/backup";
import {
  calculateStatisticsSummary,
  groupSessionsByMonth,
  sortChargingSessions,
} from "../utils/statistics";

export function useChargingSessions(vehicleId: string) {
  const [sessionState, setSessionState] = useState(() => ({
    vehicleId,
    sessions: loadVehicleSessions(vehicleId),
  }));

  useEffect(() => {
    if (sessionState.vehicleId !== vehicleId) {
      setSessionState({ vehicleId, sessions: loadVehicleSessions(vehicleId) });
    }
  }, [vehicleId, sessionState.vehicleId]);

  useEffect(() => {
    if (sessionState.vehicleId === vehicleId) {
      saveVehicleSessions(vehicleId, sessionState.sessions);
    }
  }, [sessionState, vehicleId]);

  const chargingSessions =
    sessionState.vehicleId === vehicleId ? sessionState.sessions : [];

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

  const updateCurrent = (
    updater: (sessions: ChargingSession[]) => ChargingSession[],
  ) => {
    setSessionState((current) => {
      const base = current.vehicleId === vehicleId
        ? current.sessions
        : loadVehicleSessions(vehicleId);
      return { vehicleId, sessions: updater(base) };
    });
  };

  function addChargingSession(session: ChargingSession) {
    updateCurrent((sessions) => [session, ...sessions]);
  }

  function updateChargingSession(updatedSession: ChargingSession) {
    updateCurrent((sessions) =>
      sessions.map((session) =>
        session.id === updatedSession.id ? updatedSession : session,
      ),
    );
  }

  function deleteChargingSession(sessionId: number) {
    updateCurrent((sessions) => sessions.filter((session) => session.id !== sessionId));
  }

  function importChargingSessions(
    importedSessions: ChargingSession[],
    mode: "merge" | "replace",
  ) {
    updateCurrent((sessions) =>
      mode === "replace"
        ? importedSessions
        : mergeSessionCollections(sessions, importedSessions),
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
