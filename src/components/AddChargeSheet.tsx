import { useEffect, useMemo, useState } from "react";
import ChargeFlowLogo from "./ChargeFlowLogo";
import type { ChargingSession } from "../types/ChargingSession";
import type { VehicleSettings } from "../types/VehicleSettings";

interface AddChargeSheetProps {
  isOpen: boolean;
  lastSession?: ChargingSession;
  allSessions: ChargingSession[];
  onClose: () => void;
  onSave: (session: ChargingSession) => void;
  vehicleSettings: VehicleSettings;
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
  allSessions,
  onClose,
  onSave,
  vehicleSettings,
}: AddChargeSheetProps) {
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [startBattery, setStartBattery] = useState("");
  const [endBattery, setEndBattery] = useState("80");
  const [energy, setEnergy] = useState("");
  const [isEnergyManual, setIsEnergyManual] = useState(false);
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
    setIsEnergyManual(false);
    setError("");

    // Önceki kayıttan gelen değerler input değeri olarak değil,
    // soluk öneri (placeholder) olarak gösterilir.
    setOdometer("");
    setPricePerKwh("");
    setLocation("");
    setTemperature("");
    setTireType("");
    setChargingType("");

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
    if (isEnergyManual) return;

    const startValue = Number(startBattery);
    const endValue = Number(endBattery);
    const capacity = vehicleSettings.batteryCapacityKwh;

    if (
      startBattery === "" ||
      endBattery === "" ||
      capacity === null ||
      capacity <= 0 ||
      endValue <= startValue
    ) {
      setEnergy("");
      return;
    }

    const estimatedEnergy = capacity * ((endValue - startValue) / 100);
    setEnergy(estimatedEnergy.toFixed(1));
  }, [
    startBattery,
    endBattery,
    vehicleSettings.batteryCapacityKwh,
    isEnergyManual,
  ]);

  const suggestedOdometer = lastSession?.odometer;
  const suggestedPricePerKwh = lastSession?.pricePerKwh;
  const suggestedLocation = lastSession?.location || "Ev";
  const suggestedTemperature = lastSession?.temperature;
  const suggestedTireType = lastSession?.tireType;
  const suggestedChargingType = lastSession?.chargingType;

  useEffect(() => {
    const energyValue = parseNumber(energy);
    const effectivePrice = pricePerKwh.trim() === ""
      ? (suggestedPricePerKwh ?? 0)
      : parseNumber(pricePerKwh);

    if (energyValue > 0 && effectivePrice >= 0) {
      setCost((energyValue * effectivePrice).toFixed(2));
    } else {
      setCost("");
    }
  }, [energy, pricePerKwh, suggestedPricePerKwh]);

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
    const odometerValue = odometer.trim() === ""
      ? (suggestedOdometer ?? Number.NaN)
      : parseNumber(odometer);
    const priceValue = pricePerKwh.trim() === ""
      ? (suggestedPricePerKwh ?? 0)
      : parseNumber(pricePerKwh);
    const costValue = energyValue * priceValue;
    const temperatureValue = temperature.trim() === ""
      ? suggestedTemperature
      : parseNumber(temperature);
    const locationValue = location.trim() || suggestedLocation || "Belirtilmedi";
    const tireTypeValue = tireType || suggestedTireType;
    const chargingTypeValue = chargingType || suggestedChargingType;

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

    if (!Number.isFinite(odometerValue) || odometerValue < 0) {
      setError("Kilometre değeri geçerli değil.");
      return;
    }

    // Geriye dönük kayıtlar için kilometreyi yalnızca tarih sırasındaki
    // komşu kayıtlarla karşılaştır. Böylece eski bir kayıt eklemek mümkündür.
    const newTimestamp = new Date(`${date}T${time || "00:00"}`).getTime();
    const chronologicalSessions = [...allSessions]
      .map((session) => ({
        session,
        timestamp: new Date(`${session.date}T${session.time || "00:00"}`).getTime(),
      }))
      .filter((entry) => Number.isFinite(entry.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    const previousSession = [...chronologicalSessions]
      .reverse()
      .find((entry) => entry.timestamp <= newTimestamp)?.session;
    const nextSession = chronologicalSessions
      .find((entry) => entry.timestamp >= newTimestamp)?.session;

    if (previousSession && odometerValue < previousSession.odometer) {
      setError(
        `${previousSession.date} tarihli önceki kayıtta kilometre ${previousSession.odometer.toLocaleString("tr-TR")} km. Yeni değer bundan düşük olamaz.`,
      );
      return;
    }

    if (nextSession && odometerValue > nextSession.odometer) {
      setError(
        `${nextSession.date} tarihli sonraki kayıtta kilometre ${nextSession.odometer.toLocaleString("tr-TR")} km. Yeni değer bundan yüksek olamaz.`,
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
      location: locationValue,
      temperature: temperatureValue,
      tireType: tireTypeValue || undefined,
      chargingType: chargingTypeValue || undefined,
    });
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="charge-sheet premium-charge-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div className="premium-sheet-header add-charge-topbar">
          <button
            className="sheet-close-button add-charge-header-action"
            type="button"
            onClick={onClose}
            aria-label="Formu kapat"
          >
            ×
          </button>

          <div className="add-charge-centered-logo">
            <ChargeFlowLogo compact />
          </div>

          <button
            className="add-charge-save-button add-charge-header-action"
            type="submit"
            form="add-charge-form"
            aria-label="Şarjı kaydet"
            title="Şarjı kaydet"
          >
            ✓
          </button>
        </div>

        <div className="add-charge-heading">
          <p className="eyebrow">YENİ KAYIT</p>
          <h2>Yeni şarj</h2>
          <small>Şarj verilerini hızlıca kaydet</small>
        </div>

        <form id="add-charge-form" className="charge-form compact-charge-form" onSubmit={handleSubmit}>
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
                    className={isEnergyManual ? "" : "estimated-energy-input"}
                    value={energy}
                    onFocus={(event) => {
                      if (!isEnergyManual && energy) event.currentTarget.select();
                    }}
                    onChange={(event) => {
                      setIsEnergyManual(true);
                      setEnergy(event.target.value);
                    }}
                    placeholder={
                      vehicleSettings.batteryCapacityKwh
                        ? "Başlangıç ve bitişi gir"
                        : "Araç ayarını gir"
                    }
                    required
                  />
                  <strong>kWh</strong>
                </div>
                <small className="estimated-energy-note">
                  {isEnergyManual
                    ? "Manuel değer"
                    : vehicleSettings.batteryCapacityKwh
                      ? `Tahmini · ${vehicleSettings.model || "Araç"} · ${vehicleSettings.batteryCapacityKwh} kWh`
                      : "Diğer > Araç ayarlarından batarya kapasitesini gir"}
                </small>
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
                    placeholder={suggestedOdometer !== undefined
                      ? suggestedOdometer.toLocaleString("tr-TR", { useGrouping: false })
                      : "Kilometre gir"}
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
                    placeholder={suggestedPricePerKwh !== undefined
                      ? String(suggestedPricePerKwh).replace(".", ",")
                      : "0,00"}
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
                placeholder={suggestedLocation || "Ev, iş yeri, Supercharger..."}
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
                    placeholder={suggestedTemperature !== undefined
                      ? String(suggestedTemperature)
                      : "24"}
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
                  <span>{tireLabel || (suggestedTireType ? TIRE_OPTIONS.find((option) => option.value === suggestedTireType)?.label : "Seçim yap")}</span>
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
                  <span>{chargingType || suggestedChargingType || "Seçim yap"}</span>
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

        </form>
      </section>
    </div>
  );
}

export default AddChargeSheet;