import { useEffect, useState } from "react";
import type { ChargingSession } from "../types/ChargingSession";

interface AddChargeSheetProps {
  isOpen: boolean;
  lastSession?: ChargingSession;
  onClose: () => void;
  onSave: (session: ChargingSession) => void;
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AddChargeSheet({
  isOpen,
  lastSession,
  onClose,
  onSave,
}: AddChargeSheetProps) {
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [startBattery, setStartBattery] = useState("");
  const [endBattery, setEndBattery] = useState("");
  const [energy, setEnergy] = useState("");
  const [odometer, setOdometer] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [cost, setCost] = useState("");
  const [location, setLocation] = useState("Ev");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setStartBattery("");
    setEndBattery("");
    setEnergy("");
    setError("");

    setOdometer(
      lastSession ? String(lastSession.odometer) : "",
    );

    setPricePerKwh(
      lastSession ? String(lastSession.pricePerKwh) : "",
    );

    setLocation(lastSession?.location || "Ev");
    setCost("");
  }, [isOpen, lastSession]);

  useEffect(() => {
    const energyValue = Number(energy.replace(",", "."));
    const priceValue = Number(pricePerKwh.replace(",", "."));

    if (energyValue > 0 && priceValue >= 0) {
      setCost((energyValue * priceValue).toFixed(2));
    } else {
      setCost("");
    }
  }, [energy, pricePerKwh]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const startValue = Number(startBattery);
    const endValue = Number(endBattery);
    const energyValue = Number(energy.replace(",", "."));
    const odometerValue = Number(odometer.replace(",", "."));
    const priceValue = Number(pricePerKwh.replace(",", "."));
    const costValue = Number(cost.replace(",", "."));

    if (!date || !time) {
      setError("Tarih ve saat alanları zorunludur.");
      return;
    }

    if (startValue < 0 || startValue > 100) {
      setError("Başlangıç yüzdesi 0 ile 100 arasında olmalıdır.");
      return;
    }

    if (endValue < 0 || endValue > 100) {
      setError("Bitiş yüzdesi 0 ile 100 arasında olmalıdır.");
      return;
    }

    if (endValue <= startValue) {
      setError("Bitiş yüzdesi başlangıç yüzdesinden yüksek olmalıdır.");
      return;
    }

    if (energyValue <= 0) {
      setError("Eklenen enerji 0'dan büyük olmalıdır.");
      return;
    }

    if (odometerValue < 0) {
      setError("Kilometre değeri geçerli değil.");
      return;
    }

    if (
      lastSession &&
      odometerValue < lastSession.odometer
    ) {
      setError(
        `Kilometre, son kayıttaki ${lastSession.odometer.toLocaleString(
          "tr-TR",
        )} km değerinden düşük olamaz.`,
      );
      return;
    }

    if (priceValue < 0 || costValue < 0) {
      setError("Fiyat ve toplam tutar negatif olamaz.");
      return;
    }

    onSave({
      id: Date.now(),
      date,
      time,
      startBattery: startValue,
      endBattery: endValue,
      energy: energyValue,
      odometer: odometerValue,
      pricePerKwh: priceValue,
      cost: costValue,
      location: location.trim() || "Belirtilmedi",
    });
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="charge-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <p className="eyebrow">YENİ KAYIT</p>
            <h2>Yeni şarj</h2>
          </div>

          <button
            className="sheet-close-button"
            type="button"
            onClick={onClose}
            aria-label="Formu kapat"
          >
            ×
          </button>
        </div>

        <form className="charge-form" onSubmit={handleSubmit}>
          <div className="form-grid form-grid-two">
            <label className="form-field">
              <span>Tarih</span>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>Saat</span>

              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-grid form-grid-two">
            <label className="form-field">
              <span>Başlangıç yüzdesi</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={startBattery}
                  onChange={(event) =>
                    setStartBattery(event.target.value)
                  }
                  placeholder="18"
                  required
                />

                <strong>%</strong>
              </div>
            </label>

            <label className="form-field">
              <span>Bitiş yüzdesi</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={endBattery}
                  onChange={(event) =>
                    setEndBattery(event.target.value)
                  }
                  placeholder="81"
                  required
                />

                <strong>%</strong>
              </div>
            </label>
          </div>

          <div className="form-grid form-grid-two">
            <label className="form-field">
              <span>Eklenen enerji</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={energy}
                  onChange={(event) => setEnergy(event.target.value)}
                  placeholder="46.2"
                  required
                />

                <strong>kWh</strong>
              </div>
            </label>

            <label className="form-field">
              <span>Araç kilometresi</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={odometer}
                  onChange={(event) => setOdometer(event.target.value)}
                  placeholder="24380"
                  required
                />

                <strong>km</strong>
              </div>
            </label>
          </div>

          <div className="form-grid form-grid-two">
            <label className="form-field">
              <span>Elektrik fiyatı</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerKwh}
                  onChange={(event) =>
                    setPricePerKwh(event.target.value)
                  }
                  placeholder="8.50"
                  required
                />

                <strong>TL/kWh</strong>
              </div>
            </label>

            <label className="form-field">
              <span>Toplam tutar</span>

              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  placeholder="Otomatik hesaplanır"
                  required
                />

                <strong>TL</strong>
              </div>
            </label>
          </div>

          <label className="form-field">
            <span>Şarj konumu</span>

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ev, iş yeri, Supercharger..."
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="save-charge-button" type="submit">
            <span>⚡</span>
            Şarjı kaydet
          </button>
        </form>
      </section>
    </div>
  );
}

export default AddChargeSheet;