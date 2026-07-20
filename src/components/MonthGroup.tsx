import type { CSSProperties } from "react";
import type { ChargingSession } from "../types/ChargingSession";
import type { GroupedMonth } from "../utils/statistics";
import SessionCard from "./SessionCard";

interface MonthGroupProps {
  month: GroupedMonth;
  sortedSessions: ChargingSession[];
  onSessionOpen: (session: ChargingSession) => void;
  onSessionDelete: (sessionId: number) => void;
}

function MonthGroup({
  month,
  sortedSessions,
  onSessionOpen,
  onSessionDelete,
}: MonthGroupProps) {
  return (
    <section className="month-group continuous-month-group">
      <section className="month-panel month-sticky-panel">
        <div className="month-title month-title-static">
          <span className="month-title-icon">●</span>
          {month.label}
          <span className="month-record-count">
            {month.sessions.length} kayıt
          </span>
        </div>

        <div className="month-summary">
          <div className="month-stat">
            <span className="stat-icon">⚡</span>
            <div>
              <strong>
                {month.totalEnergy.toLocaleString("tr-TR", {
                  maximumFractionDigits: 1,
                })}
                <small> kWh</small>
              </strong>
              <span>Toplam Enerji</span>
            </div>
          </div>

          <div className="month-stat">
            <span className="stat-icon">⌁</span>
            <div>
              <strong>
                {month.averageConsumption.toLocaleString("tr-TR", {
                  maximumFractionDigits: 1,
                })}
                <small> kWh/100 km</small>
              </strong>
              <span>Ort. Tüketim</span>
            </div>
          </div>

          <div className="month-stat">
            <span className="stat-icon">🚘</span>
            <div>
              <strong>
                {month.totalDistance.toLocaleString("tr-TR")}
                <small> km</small>
              </strong>
              <span>Aylık Mesafe</span>
            </div>
          </div>
        </div>
      </section>

      <section className="compact-session-list animated-session-list">
        {month.sessions.map((session, index) => {
          const globalIndex = sortedSessions.findIndex(
            (item) => item.id === session.id,
          );

          return (
            <div
              className="animated-session-item month-session-item"
              style={{ "--session-index": index } as CSSProperties}
              key={session.id}
            >
              <SessionCard
                session={session}
                previousSession={sortedSessions[globalIndex + 1]}
                onOpen={onSessionOpen}
                onDelete={onSessionDelete}
              />
            </div>
          );
        })}
      </section>
    </section>
  );
}

export default MonthGroup;
