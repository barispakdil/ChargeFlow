import { useEffect, useMemo, useState } from "react";
import ChargeFlowLogo from "./ChargeFlowLogo";
import type { ChargingSession } from "../types/ChargingSession";

interface AddChargeSheetProps {
  isOpen: boolean;
  lastSession?: ChargingSession;
  onClose: () => void;
  onSave: (session: ChargingSession) => void;
}

type TireType = NonNullable<ChargingSession["tireType"]>;
type ChargingType = NonNullable<ChargingSession["chargingType"]>;

const TIRE_OPTIONS: Array<{ value: TireType; label: string; icon: string }> = [
  { value: "summer", label: "Yaz", icon: "☀️" },
  { value: "winter", label: "Kış", icon: "❄️" },
  { value: "allSeason", label: "4 Mevsim", icon: "◉" },
];

const CHARGING_TYPE_OPTIONS: Array<{
  value: ChargingType;
  label: string;
  detail: string;
}> = [
  { value: "AC", label: "AC", detail: "Normal şarj" },
  { value: "DC", label: "DC", detail: "Hızlı şarj" },
];

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
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
  const [endBattery, setEndBattery] = useState("80");
  const [energy, setEnergy] = useState("");
  const [odometer, setOdometer] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [cost, setCost] = useState("");
  const [location, setLocation] = useState("Ev");

  const [temperature, setTemperature] = useState("");
  const [tireType, setTireType] = useState<TireType | "">("");
  const [chargingType, setChargingType] = useState<ChargingType | "">("");

  const [showOptional, setShowOptional] = useState(false);
  const [openSelector, setOpenSelector] = useState<
    "tire" | "chargingType" | null
  >(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setStartBattery("");
    setEndBattery("80");
    setEnergy("");
    setError("");

    setOdometer(lastSession ? String(lastSession.odometer) : "");
    setPricePerKwh(lastSession ? String(lastSession.pricePerKwh) : "");
    setLocation(lastSession?.location || "Ev");

    setTemperature(
      lastSession?.temperature !== undefined
        ? String(lastSession.temperature)
        : "",
    );
    setTireType(lastSession?.tireType || "");
    setChargingType(lastSession?.chargingType || "");

    setShowOptional(
      Boolean(
        lastSession?.temperature !== undefined ||
          lastSession?.tireType ||
          lastSession?.chargingType,
      ),
    );
    setOpenSelector(null);
    setCost("");
  }, [isOpen, lastSession]);

  useEffect(() => {
    const energyValue = parseNumber(energy);
    const priceValue = parseNumber(pricePerKwh);

    if (energyValue > 0 && priceValue >= 0) {
      setCost((energyValue * priceValue).toFixed(2));
    } else {
      setCost("");
    }
  }, [energy, pricePerKwh]);

  const tireLabel = useMemo(
    () => TIRE_OPTIONS.find((option) => option.value === tireType)?.label,
    [tireType],
  );

  const startPercent = Math.min(
    100,
    Math.max(0, startBattery === "" ? 0 : Number(startBattery)),
  );
  const endPercent = Math.min(
    100,
    Math.max(0, endBattery === "" ? 0 : Number(endBattery)),
  );
  const chargeRangeStart = Math.min(startPercent, endPercent);
  const chargeRangeWidth = Math.max(0, endPercent - startPercent);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const startValue = Number(startBattery);
    const endValue = Number(endBattery);
    const energyValue = parseNumber(energy);
    const odometerValue = parseNumber(odometer);
    const priceValue = parseNumber(pricePerKwh);
    const costValue = parseNumber(cost);
    const temperatureValue =
      temperature.trim() === "" ? undefined : parseNumber(temperature);

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

    if (lastSession && odometerValue < lastSession.odometer) {
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

    if (
      temperatureValue !== undefined &&
      (temperatureValue < -60 || temperatureValue > 80)
    ) {
      setError("Sıcaklık değeri -60 ile 80 °C arasında olmalıdır.");
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
      temperature: temperatureValue,
      tireType: tireType || undefined,
      chargingType: chargingType || undefined,
    });
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="charge-sheet premium-charge-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div className="premium-sheet-header">
          <div className="premium-sheet-title">
            <ChargeFlowLogo compact />
            <div>
              <p className="eyebrow">YENİ KAYIT</p>
              <h2>Yeni şarj</h2>
              <small>Şarj verilerini hızlıca kaydet</small>
            </div>
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

        <form className="charge-form compact-charge-form" onSubmit={handleSubmit}>
          <section className="charge-form-section">
            <div className="charge-form-section-heading">
              <span>ZAMAN</span>
            </div>

            <div className="form-grid form-grid-two compact-grid charge-date-time-grid">
              <label className="form-field compact-field charge-date-field">
                <span>Tarih</span>
                <input
                  className="charge-date-input"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>

              <label className="form-field compact-field charge-time-field">
                <span>Saat</span>
                <input
                  className="charge-time-input"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </label>
            </div>
          </section>

          <section className="charge-form-section charge-core-section">
            <div className="charge-form-section-heading">
              <span>BATARYA</span>
              <small>Varsayılan bitiş: %80</small>
            </div>

            <div className="battery-input-pair">
              <label className="battery-input-card">
                <span>Başlangıç</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    value={startBattery}
                    onChange={(event) => setStartBattery(event.target.value)}
                    placeholder="18"
                    required
                  />
                  <strong>%</strong>
                </div>
              </label>

              <div
                className="battery-range-control"
                aria-label={`Şarj aralığı yüzde ${startPercent} ile yüzde ${endPercent}`}
              >
                <div className="battery-range-track">
                  <div
                    className="battery-range-before"
                    style={{ width: `${chargeRangeStart}%` }}
                  />
                  <div
                    className="battery-range-active"
                    style={{
                      left: `${chargeRangeStart}%`,
                      width: `${chargeRangeWidth}%`,
                    }}
                  />
                  <span
                    className="battery-range-marker battery-range-marker-start"
                    style={{ left: `${startPercent}%` }}
                  />
                  <span
                    className="battery-range-marker battery-range-marker-end"
                    style={{ left: `${endPercent}%` }}
                  />
                </div>

                <div className="battery-range-scale" aria-hidden="true">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <label className="battery-input-card battery-input-card-end">
                <span>Bitiş</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    value={endBattery}
                    onChange={(event) => setEndBattery(event.target.value)}
                    required
                  />
                  <strong>%</strong>
                </div>
              </label>
            </div>
          </section>

          <section className="charge-form-section">
            <div className="charge-form-section-heading">
              <span>ŞARJ VE ARAÇ</span>
            </div>

            <div className="form-grid form-grid-two compact-grid">
              <label className="form-field compact-field">
                <span>Eklenen enerji</span>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={energy}
                    onChange={(event) => setEnergy(event.target.value)}
                    placeholder="46.2"
                    required
                  />
                  <strong>kWh</strong>
                </div>
              </label>

              <label className="form-field compact-field">
                <span>Araç kilometresi</span>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={odometer}
                    onChange={(event) => setOdometer(event.target.value)}
                    placeholder="24380"
                    required
                  />
                  <strong>km</strong>
                </div>
              </label>
            </div>
          </section>

          <section className="charge-form-section">
            <div className="charge-form-section-heading">
              <span>MALİYET</span>
              <small>Toplam otomatik hesaplanır</small>
            </div>

            <div className="form-grid form-grid-two compact-grid">
              <label className="form-field compact-field">
                <span>Elektrik fiyatı</span>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={pricePerKwh}
                    onChange={(event) => setPricePerKwh(event.target.value)}
                    placeholder="8.50"
                    required
                  />
                  <strong>TL/kWh</strong>
                </div>
              </label>

              <label className="form-field compact-field">
                <span>Toplam tutar</span>
                <div className="input-with-unit readonly-cost">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={cost}
                    onChange={(event) => setCost(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <strong>TL</strong>
                </div>
              </label>
            </div>

            <label className="form-field compact-field full-width-field">
              <span>Şarj konumu</span>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ev, iş yeri, Supercharger..."
              />
            </label>
          </section>

          <button
            className={`optional-toggle ${showOptional ? "open" : ""}`}
            type="button"
            onClick={() => {
              setShowOptional((current) => !current);
              setOpenSelector(null);
            }}
          >
            <span className="optional-toggle-icon">＋</span>
            <span>
              <strong>Opsiyonel bilgiler</strong>
              <small>Sıcaklık, lastik ve şarj tipi</small>
            </span>
            <b>⌄</b>
          </button>

          <div
            className={`optional-fields-shell ${
              showOptional ? "visible" : ""
            }`}
          >
            <div className="optional-fields-content">
              <label className="form-field compact-field">
                <span>Hava sıcaklığı</span>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="-60"
                    max="80"
                    step="1"
                    inputMode="numeric"
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                    placeholder="24"
                  />
                  <strong>°C</strong>
                </div>
              </label>

              <div className="animated-select-field">
                <span>Lastik türü</span>
                <button
                  type="button"
                  className={`animated-select-trigger ${
                    openSelector === "tire" ? "active" : ""
                  }`}
                  onClick={() =>
                    setOpenSelector((current) =>
                      current === "tire" ? null : "tire",
                    )
                  }
                >
                  <span>{tireLabel || "Seçim yap"}</span>
                  <b>⌄</b>
                </button>

                <div
                  className={`animated-option-panel ${
                    openSelector === "tire" ? "visible" : ""
                  }`}
                >
                  {TIRE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={tireType === option.value ? "selected" : ""}
                      onClick={() => {
                        setTireType(option.value);
                        setOpenSelector(null);
                      }}
                    >
                      <span>{option.icon}</span>
                      <strong>{option.label}</strong>
                      <b>{tireType === option.value ? "✓" : ""}</b>
                    </button>
                  ))}
                </div>
              </div>

              <div className="animated-select-field">
                <span>Şarj tipi</span>
                <button
                  type="button"
                  className={`animated-select-trigger ${
                    openSelector === "chargingType" ? "active" : ""
                  }`}
                  onClick={() =>
                    setOpenSelector((current) =>
                      current === "chargingType" ? null : "chargingType",
                    )
                  }
                >
                  <span>{chargingType || "Seçim yap"}</span>
                  <b>⌄</b>
                </button>

                <div
                  className={`animated-option-panel charging-type-options ${
                    openSelector === "chargingType" ? "visible" : ""
                  }`}
                >
                  {CHARGING_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={
                        chargingType === option.value ? "selected" : ""
                      }
                      onClick={() => {
                        setChargingType(option.value);
                        setOpenSelector(null);
                      }}
                    >
                      <span className="charging-option-badge">
                        {option.value}
                      </span>
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                      <b>{chargingType === option.value ? "✓" : ""}</b>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="save-charge-button premium-save-button" type="submit">
            <span>ϟ</span>
            Şarjı kaydet
          </button>
        </form>
      </section>
    </div>
  );
}

export default AddChargeSheet;