import type { ChargingSession } from "../types/ChargingSession";

export const BACKUP_FORMAT = "chargeflow-backup";
export const BACKUP_VERSION = 1;
export const LAST_BACKUP_DATE_KEY = "chargeflow-last-backup-date";

export interface ChargeFlowBackup {
  app: "ChargeFlow";
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  sessions: ChargingSession[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isChargingSession(value: unknown): value is ChargingSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<ChargingSession>;

  return (
    isFiniteNumber(session.id) &&
    typeof session.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(session.date) &&
    typeof session.time === "string" &&
    /^\d{2}:\d{2}$/.test(session.time) &&
    isFiniteNumber(session.startBattery) &&
    isFiniteNumber(session.endBattery) &&
    isFiniteNumber(session.energy) &&
    isFiniteNumber(session.odometer) &&
    isFiniteNumber(session.pricePerKwh) &&
    isFiniteNumber(session.cost) &&
    typeof session.location === "string"
  );
}

export function createBackup(sessions: ChargingSession[]): ChargeFlowBackup {
  return {
    app: "ChargeFlow",
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    sessions,
  };
}

export function parseBackup(rawText: string): ChargeFlowBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Seçilen dosya geçerli bir JSON dosyası değil.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Yedek dosyasının yapısı geçersiz.");
  }

  const backup = parsed as Partial<ChargeFlowBackup>;

  if (backup.app !== "ChargeFlow" || backup.format !== BACKUP_FORMAT) {
    throw new Error("Bu dosya ChargeFlow tarafından oluşturulmuş bir yedek değil.");
  }

  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    throw new Error("Bu yedek daha yeni bir ChargeFlow sürümüyle oluşturulmuş.");
  }

  if (!Array.isArray(backup.sessions) || !backup.sessions.every(isChargingSession)) {
    throw new Error("Yedekteki şarj kayıtlarından biri veya birkaçı geçersiz.");
  }

  return backup as ChargeFlowBackup;
}

export function buildBackupFileName(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `ChargeFlow_Backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}

export function sessionIdentity(session: ChargingSession) {
  return [
    session.date,
    session.time,
    session.odometer,
    session.energy,
    session.startBattery,
    session.endBattery,
  ].join("|");
}

export function mergeSessionCollections(
  currentSessions: ChargingSession[],
  importedSessions: ChargingSession[],
) {
  const merged = new Map<string, ChargingSession>();

  currentSessions.forEach((session) => {
    merged.set(sessionIdentity(session), session);
  });

  importedSessions.forEach((session) => {
    merged.set(sessionIdentity(session), session);
  });

  return Array.from(merged.values());
}
