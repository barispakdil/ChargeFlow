const chargingSessions = [
  {
    id: 1,
    date: "16 Temmuz 2026",
    time: "21:40",
    startBattery: 18,
    endBattery: 81,
    energy: 46.2,
    odometer: 24380,
    cost: 392.7,
    location: "Ev",
  },
  {
    id: 2,
    date: "12 Temmuz 2026",
    time: "19:15",
    startBattery: 22,
    endBattery: 90,
    energy: 53.7,
    odometer: 24028,
    cost: 456.45,
    location: "Ev",
  },
];

function HomePage() {
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
          <strong>28</strong>
          <small>şarj işlemi</small>
        </article>

        <article className="summary-card">
          <span>Toplam enerji</span>
          <strong>1.284</strong>
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

          <button className="add-button" type="button">
            <span>＋</span>
            Yeni şarj
          </button>
        </div>

        <div className="timeline">
          {chargingSessions.map((session, index) => (
            <div className="timeline-group" key={session.id}>
              <article className="charge-card">
                <div className="charge-card-top">
                  <div>
                    <span className="date">{session.date}</span>
                    <span className="time">{session.time}</span>
                  </div>

                  <span className="location">{session.location}</span>
                </div>

                <div className="battery-row">
                  <div className="battery-value">
                    <small>Başlangıç</small>
                    <strong>%{session.startBattery}</strong>
                  </div>

                  <div className="battery-progress">
                    <div className="battery-progress-line" />
                    <span>⚡</span>
                  </div>

                  <div className="battery-value battery-value-end">
                    <small>Bitiş</small>
                    <strong>%{session.endBattery}</strong>
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

              {index < chargingSessions.length - 1 && (
                <article className="analysis-card">
                  <span>SÜRÜŞ ANALİZİ</span>

                  <div className="analysis-grid">
                    <div>
                      <strong>352 km</strong>
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
    </main>
  );
}

export default HomePage;