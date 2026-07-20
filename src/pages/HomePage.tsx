import { useEffect, useMemo, useState } from "react";
import AddChargeSheet from "../components/AddChargeSheet";
import { sampleChargingSessions } from "../data/sampleData";
import type { ChargingSession } from "../types/ChargingSession";

const STORAGE_KEY = "chargeflow-sessions";

const MONTHS = [
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
];

function getSessionDate(session: ChargingSession) {
  return new Date(`${session.date}T${session.time}`);
}

function getDayDifference(
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

function HomePage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [chargingSessions, setChargingSessions] = useState<
    ChargingSession[]
  >(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);

    if (!savedSessions) {
      return sampleChargingSessions;
    }

    try {
      return JSON.parse(savedSessions) as ChargingSession[];
    } catch {
      return sampleChargingSessions;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chargingSessions),
    );
  }, [chargingSessions]);

  const sortedSessions = useMemo(() => {
    return [...chargingSessions].sort(
      (first, second) =>
        getSessionDate(second).getTime() -
        getSessionDate(first).getTime(),
    );
  }, [chargingSessions]);

  const latestSession = sortedSessions[0];

  const totalEnergy = useMemo(() => {
    return chargingSessions.reduce(
      (total, session) => total + session.energy,
      0,
    );
  }, [chargingSessions]);

  const totalDistance = useMemo(() => {
    if (sortedSessions.length < 2) {
      return 0;
    }

    return Math.max(
      0,
      sortedSessions[0].odometer -
        sortedSessions[sortedSessions.length - 1].odometer,
    );
  }, [sortedSessions]);

  const averageConsumption =
    totalDistance > 0
      ? (totalEnergy / totalDistance) * 100
      : 0;

  function handleSave(session: ChargingSession) {
    setChargingSessions((currentSessions) => [
      session,
      ...currentSessions,
    ]);

    setIsSheetOpen(false);
  }

  return (
    <main className="app-shell">
      <section className="phone-page">
        <header className="home-header">
          <h1 className="brand">
            Charge<span>Flow</span>
          </h1>

          <button
            className="icon-add-button"
            type="button"
            aria-label="Yeni şarj ekle"
            onClick={() => setIsSheetOpen(true)}
          >
            +
          </button>
        </header>

        {latestSession && (
          <section className="battery-hero">
            <div className="battery-visual">
              <div className="battery-body">
                <div
                  className="battery-level"
                  style={{
                    width: `${latestSession.endBattery}%`,
                  }}
                />
                <div className="battery-glow" />
              </div>

              <div className="battery-tip" />
            </div>

            <div className="battery-copy">
              <strong>{latestSession.endBattery}%</strong>
              <span>Son Şarj Bitiş</span>
              <small>
                {new Intl.DateTimeFormat("tr-TR").format(
                  getSessionDate(latestSession),
                )}{" "}
                {latestSession.time}
              </small>
            </div>
          </section>
        )}

        <section className="month-panel">
          <button className="month-title" type="button">
            <span>▼</span>
            TEMMUZ 2026
            <span className="month-chevron">⌃</span>
          </button>

          <div className="month-summary">
            <div className="month-stat">
              <span className="stat-icon">⚡</span>

              <div>
                <strong>
                  {totalEnergy.toLocaleString("tr-TR", {
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
                  {averageConsumption.toLocaleString("tr-TR", {
                    maximumFractionDigits: 1,
                  })}
                  <small> kWh/100 km</small>
                </strong>
                <span>Ortalama Tüketim</span>
              </div>
            </div>

            <div className="month-stat">
              <span className="stat-icon">▣</span>

              <div>
                <strong>{chargingSessions.length}</strong>
                <span>Şarj İşlemi</span>
              </div>
            </div>
          </div>
        </section>

        <section className="compact-session-list">
          {sortedSessions.map((session, index) => {
            const previousSession = sortedSessions[index + 1];

            const distance = previousSession
              ? Math.max(
                  0,
                  session.odometer - previousSession.odometer,
                )
              : 0;

            const dayDifference = previousSession
              ? getDayDifference(session, previousSession)
              : 0;

            const consumption =
              distance > 0
                ? (session.energy / distance) * 100
                : 0;

            const dailyAverage =
              dayDifference > 0
                ? Math.round(distance / dayDifference)
                : 0;

            const sessionDate = getSessionDate(session);

            return (
              <article className="compact-session-card" key={session.id}>
                <span
                  className="session-accent"
                  aria-hidden="true"
                />

                <div className="session-date-block">
                  <strong>
                    {String(sessionDate.getDate()).padStart(2, "0")}
                  </strong>
                  <span>{MONTHS[sessionDate.getMonth()]}</span>
                  <small>{sessionDate.getFullYear()}</small>
                </div>

                <div className="session-main">
                  <div className="session-percentage-row">
                    <strong>{session.startBattery}%</strong>

                    <div className="mini-charge-progress">
                      <span>⚡</span>

                      <div className="mini-charge-track">
                        <div
                          className="mini-charge-fill"
                          style={{
                            width: `${
                              session.endBattery -
                              session.startBattery
                            }%`,
                          }}
                        />
                      </div>

                      <span>⚡</span>
                    </div>

                    <strong>{session.endBattery}%</strong>
                  </div>

                  <div className="session-energy">
                    <span>⚡</span>
                    <strong>{session.energy} kWh</strong>
                  </div>
                </div>

                <div className="session-analysis">
                  <span>🚘 {distance.toLocaleString("tr-TR")} km</span>

                  <span>
                    ⚡{" "}
                    {consumption.toLocaleString("tr-TR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kWh/100 km
                  </span>

                  <span>▣ {dayDifference} gün</span>

                  <span>
                    ◴ {dailyAverage.toLocaleString("tr-TR")} km/gün
                  </span>
                </div>

                <button
                  className="session-open-button"
                  type="button"
                  aria-label="Şarj detaylarını aç"
                >
                  ›
                </button>
              </article>
            );
          })}
        </section>

        <section className="collapsed-months">
          <button className="collapsed-month" type="button">
            <strong>▶ HAZİRAN 2026</strong>
            <span>198,5 kWh</span>
            <span>14,1 kWh/100 km</span>
          </button>

          <button className="collapsed-month" type="button">
            <strong>▶ MAYIS 2026</strong>
            <span>176,2 kWh</span>
            <span>13,7 kWh/100 km</span>
          </button>
        </section>
      </section>

      <nav className="bottom-navigation">
        <button className="nav-item active" type="button">
          <span>⌂</span>
          <small>Ana Sayfa</small>
        </button>

        <button className="nav-item" type="button">
          <span>▥</span>
          <small>İstatistikler</small>
        </button>

        <button className="nav-item" type="button">
          <span>◴</span>
          <small>Geçmiş</small>
        </button>

        <button className="nav-item" type="button">
          <span>⚙</span>
          <small>Ayarlar</small>
        </button>
      </nav>

      <AddChargeSheet
        isOpen={isSheetOpen}
        lastSession={latestSession}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSave}
      />
    </main>
  );
}

export default HomePage;