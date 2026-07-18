import { useEffect, useMemo, useState } from "react";
import AddChargeSheet from "../components/AddChargeSheet";
import { sampleChargingSessions } from "../data/sampleData";
import type { ChargingSession } from "../types/ChargingSession";

const STORAGE_KEY = "chargeflow-sessions";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
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
    return [...chargingSessions].sort((first, second) => {
      const firstDate = new Date(
        `${first.date}T${first.time}`,
      ).getTime();

      const secondDate = new Date(
        `${second.date}T${second.time}`,
      ).getTime();

      return secondDate - firstDate;
    });
  }, [chargingSessions]);

  const totalEnergy = chargingSessions.reduce(
    (total, session) => total + session.energy,
    0,
  );

  function handleSave(session: ChargingSession) {
    setChargingSessions((currentSessions) => [
      session,
      ...currentSessions,
    ]);

    setIsSheetOpen(false);
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">ELEKTRİKLİ ARAÇ ŞARJ TAKİBİ</p>

          <h1 className="logo">
            <span>⚡</span>
            ChargeFlow
          </h1>
        </div>

        <div className="vehicle-badge">
          <span className="vehicle-icon">🚗</span>

          <div>
            <strong>Tesla Model Y</strong>
            <small>Long Range</small>
          </div>
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Toplam şarj</span>
          <strong>{chargingSessions.length}</strong>
          <small>şarj işlemi</small>
        </article>

        <article className="summary-card">
          <span>Toplam enerji</span>

          <strong>
            {totalEnergy.toLocaleString("tr-TR", {
              maximumFractionDigits: 1,
            })}
          </strong>

          <small>kWh</small>
        </article>

        <article className="summary-card">
          <span>Ortalama tüketim</span>
          <strong>17,8</strong>
          <small>kWh / 100 km</small>
        </article>
      </section>

      <section className="month-section">
        <div className="month-header">
          <div>
            <p className="eyebrow">AYLIK KAYITLAR</p>
            <h2>Temmuz 2026</h2>
          </div>

          <button
            className="add-button"
            type="button"
            onClick={() => setIsSheetOpen(true)}
          >
            <span>＋</span>
            Yeni şarj
          </button>
        </div>

        <div className="timeline">
          {sortedSessions.map((session, index) => (
            <div className="timeline-group" key={session.id}>
              <article className="charge-card">
                <div className="charge-card-top">
                  <div>
                    <span className="date">
                      {formatDate(session.date)}
                    </span>

                    <span className="time">{session.time}</span>
                  </div>

                  <span className="location">
                    {session.location}
                  </span>
                </div>

                <div className="charge-progress">
                  <div className="charge-progress-labels">
                    <span
                      className="progress-value"
                      style={{
                        left: `${session.startBattery}%`,
                      }}
                    >
                      %{session.startBattery}
                    </span>

                    <span
                      className="progress-value"
                      style={{
                        left: `${session.endBattery}%`,
                      }}
                    >
                      %{session.endBattery}
                    </span>
                  </div>

                  <div className="charge-track">
                    <div
                      className="charge-track-before"
                      style={{
                        width: `${session.startBattery}%`,
                      }}
                    />

                    <div
                      className="charge-track-active"
                      style={{
                        left: `${session.startBattery}%`,
                        width: `${
                          session.endBattery -
                          session.startBattery
                        }%`,
                      }}
                    />

                    <div
                      className="charge-marker charge-marker-start"
                      style={{
                        left: `${session.startBattery}%`,
                      }}
                    >
                      ⚡
                    </div>

                    <div
                      className="charge-marker charge-marker-end"
                      style={{
                        left: `${session.endBattery}%`,
                      }}
                    >
                      ⚡
                    </div>
                  </div>

                  <div className="charge-scale">
                    <span>0%</span>
                    <span>20%</span>
                    <span>40%</span>
                    <span>60%</span>
                    <span>80%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="charge-details">
                  <div>
                    <span>Eklenen enerji</span>
                    <strong>{session.energy} kWh</strong>
                  </div>

                  <div>
                    <span>Kilometre</span>

                    <strong>
                      {session.odometer.toLocaleString("tr-TR")} km
                    </strong>
                  </div>

                  <div>
                    <span>Toplam tutar</span>

                    <strong>
                      {session.cost.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TL
                    </strong>
                  </div>
                </div>
              </article>

              {index < sortedSessions.length - 1 && (
                <article className="analysis-card">
                  <span>SÜRÜŞ ANALİZİ</span>

                  <div className="analysis-grid">
                    <div>
                      <strong>
                        {Math.max(
                          0,
                          session.odometer -
                            sortedSessions[index + 1].odometer,
                        ).toLocaleString("tr-TR")}{" "}
                        km
                      </strong>

                      <small>Gidilen mesafe</small>
                    </div>

                    <div>
                      <strong>15,2</strong>
                      <small>kWh / 100 km</small>
                    </div>

                    <div>
                      <strong>4 gün</strong>
                      <small>Şarj aralığı</small>
                    </div>

                    <div>
                      <strong>88 km</strong>
                      <small>Günlük ortalama</small>
                    </div>
                  </div>
                </article>
              )}
            </div>
          ))}
        </div>
      </section>

      <AddChargeSheet
        isOpen={isSheetOpen}
        lastSession={sortedSessions[0]}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSave}
      />
    </main>
  );
}

export default HomePage;