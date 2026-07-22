import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { CardStyle, ColorTheme, ThemeMode, ThemeSettings } from "../types/ThemeSettings";
import type { VehicleProfile } from "../types/VehicleProfile";
import type { ChargeFlowBackup } from "../utils/backup";
import {
  buildBackupFileName,
  createBackup,
  LAST_BACKUP_DATE_KEY,
  parseBackup,
} from "../utils/backup";
import { loadVehicleSessions } from "../utils/garage";

type ImportMode = "merge" | "replace";

const colorThemes: Array<{ id: ColorTheme; name: string; colors: string[] }> = [
  { id: "midnight", name: "Midnight", colors: ["#35d9ff", "#46f2c2"] },
  { id: "ocean", name: "Ocean", colors: ["#4f8cff", "#67d8ff"] },
  { id: "emerald", name: "Emerald", colors: ["#21d69b", "#8af0b9"] },
  { id: "sunset", name: "Sunset", colors: ["#ff9f43", "#ffd166"] },
  { id: "crimson", name: "Crimson", colors: ["#ff5570", "#ff8b70"] },
  { id: "purple", name: "Purple", colors: ["#a879ff", "#ff78d1"] },
  { id: "graphite", name: "Graphite", colors: ["#aeb8c4", "#e0e5eb"] },
];

interface BackupViewProps {
  vehicles: VehicleProfile[];
  activeVehicleId: string;
  onActiveVehicleChange: (vehicleId: string) => void;
  onAddVehicle: (name: string, model: string, batteryCapacityKwh: number, preferredChargeEndPercent: number) => void;
  onUpdateVehicle: (vehicle: VehicleProfile) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onRestoreBackup: (backup: ChargeFlowBackup, mode: ImportMode) => void;
  themeSettings: ThemeSettings;
  onThemeSettingsChange: (settings: ThemeSettings) => void;
}

function formatBackupDate(value: string | null) {
  if (!value) return "Henüz yedek alınmadı";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function BackupView({
  vehicles,
  activeVehicleId,
  onActiveVehicleChange,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onRestoreBackup,
  themeSettings,
  onThemeSettingsChange,
}: BackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? vehicles[0];
  const [lastBackupDate, setLastBackupDate] = useState(() => localStorage.getItem(LAST_BACKUP_DATE_KEY));
  const [pendingBackup, setPendingBackup] = useState<ChargeFlowBackup | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [vehicleName, setVehicleName] = useState(activeVehicle?.name ?? "");
  const [vehicleModel, setVehicleModel] = useState(activeVehicle?.model ?? "");
  const [batteryCapacity, setBatteryCapacity] = useState(activeVehicle?.batteryCapacityKwh?.toString() ?? "");
  const [preferredChargeEndPercent, setPreferredChargeEndPercent] = useState(activeVehicle?.preferredChargeEndPercent?.toString() ?? "80");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleMessage, setVehicleMessage] = useState("");

  useEffect(() => {
    setVehicleName(activeVehicle?.name ?? "");
    setVehicleModel(activeVehicle?.model ?? "");
    setBatteryCapacity(activeVehicle?.batteryCapacityKwh?.toString() ?? "");
    setPreferredChargeEndPercent(activeVehicle?.preferredChargeEndPercent?.toString() ?? "80");
    setVehicleMessage("");
    setIsAddingVehicle(false);
  }, [activeVehicleId, activeVehicle]);

  function showMessage(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  function parseCapacity() {
    const capacity = Number(batteryCapacity.replace(",", "."));
    if (!Number.isFinite(capacity) || capacity <= 0 || capacity > 250) {
      setVehicleMessage("Batarya kapasitesi 1 ile 250 kWh arasında olmalıdır.");
      return null;
    }
    return capacity;
  }

  function saveVehicleProfile() {
    const capacity = parseCapacity();
    if (capacity === null) return;
    if (!vehicleName.trim()) {
      setVehicleMessage("Araç için ayırt edici bir ad girin.");
      return;
    }
    const preferredEnd = Number(preferredChargeEndPercent);
    if (!Number.isFinite(preferredEnd) || preferredEnd < 1 || preferredEnd > 100) {
      setVehicleMessage("Şarj bitiş yüzdesi 1 ile 100 arasında olmalıdır.");
      return;
    }
    if (isAddingVehicle) {
      onAddVehicle(vehicleName, vehicleModel, capacity, preferredEnd);
      setVehicleMessage("Yeni araç oluşturuldu.");
      setIsAddingVehicle(false);
      return;
    }
    if (!activeVehicle) return;
    onUpdateVehicle({
      ...activeVehicle,
      name: vehicleName.trim(),
      model: vehicleModel.trim(),
      batteryCapacityKwh: capacity,
      preferredChargeEndPercent: preferredEnd,
    });
    setVehicleMessage("Araç bilgileri kaydedildi.");
  }

  function startAddingVehicle() {
    setIsAddingVehicle(true);
    setVehicleName("");
    setVehicleModel("");
    setBatteryCapacity("");
    setPreferredChargeEndPercent("80");
    setVehicleMessage("");
  }

  async function exportBackup() {
    const backup = createBackup(vehicles, activeVehicleId, loadVehicleSessions);
    const totalSessions = backup.vehicles.reduce((sum, entry) => sum + entry.sessions.length, 0);
    const fileName = buildBackupFileName();
    const file = new File([JSON.stringify(backup, null, 2)], fileName, { type: "application/json" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "ChargeFlow yedeği",
          text: `${vehicles.length} araç ve ${totalSessions} şarj kaydının yedeği`,
        });
      } else {
        const url = URL.createObjectURL(file);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }
      const now = new Date().toISOString();
      localStorage.setItem(LAST_BACKUP_DATE_KEY, now);
      setLastBackupDate(now);
      showMessage(`${vehicles.length} araç ve ${totalSessions} kayıt tek JSON dosyasında yedeklendi.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showMessage("Yedek dosyası oluşturulamadı. Lütfen tekrar deneyin.", true);
    }
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      setPendingBackup(backup);
      setPendingFileName(file.name);
      setImportMode("merge");
      showMessage("");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Yedek dosyası okunamadı.", true);
    }
  }

  function completeImport() {
    if (!pendingBackup) return;
    onRestoreBackup(pendingBackup, importMode);
    const totalSessions = pendingBackup.vehicles.reduce((sum, entry) => sum + entry.sessions.length, 0);
    showMessage(`${pendingBackup.vehicles.length} araç ve ${totalSessions} şarj kaydı geri yüklendi.`);
    setPendingBackup(null);
    setPendingFileName("");
  }

  const totalSessions = vehicles.reduce((sum, vehicle) => sum + loadVehicleSessions(vehicle.id).length, 0);

  return (
    <section className="backup-page">
      <header className="backup-page-header">
        <p className="eyebrow">AYARLAR VE VERİ GÜVENLİĞİ</p>
        <h1>Kişiselleştirme</h1>
        <p>Araçlarını, görünümü ve tüm ChargeFlow verilerini tek yerden yönet.</p>
      </header>

      <section className="vehicle-settings-card">
        <div className="backup-action-heading">
          <span>🚗</span>
          <div>
            <strong>Araçlarım</strong>
            <small>Her aracın şarj kayıtları ve istatistikleri birbirinden ayrı tutulur.</small>
          </div>
        </div>

        <div className="vehicle-profile-list">
          {vehicles.map((vehicle) => (
            <button
              type="button"
              key={vehicle.id}
              className={`vehicle-profile-button ${vehicle.id === activeVehicleId ? "active" : ""}`}
              onClick={() => onActiveVehicleChange(vehicle.id)}
            >
              <span className="vehicle-profile-icon">⚡</span>
              <span>
                <strong>{vehicle.name}</strong>
                <small>{vehicle.model || "Model belirtilmedi"} · {vehicle.batteryCapacityKwh ?? "—"} kWh</small>
              </span>
              <i>{vehicle.id === activeVehicleId ? "✓" : ""}</i>
            </button>
          ))}
        </div>

        <button className="backup-secondary-button add-vehicle-button" type="button" onClick={startAddingVehicle}>
          ＋ Yeni araç oluştur
        </button>

        <div className="vehicle-editor-heading">
          <strong>{isAddingVehicle ? "Yeni araç" : "Seçili aracı düzenle"}</strong>
          {isAddingVehicle && <button type="button" onClick={() => setIsAddingVehicle(false)}>İptal</button>}
        </div>

        <div className="vehicle-settings-grid multi-vehicle-grid">
          <label className="form-field compact-field">
            <span>Araç adı</span>
            <input value={vehicleName} onChange={(event) => { setVehicleName(event.target.value); setVehicleMessage(""); }} placeholder="Benim Model Y" />
          </label>
          <label className="form-field compact-field">
            <span>Model</span>
            <input value={vehicleModel} onChange={(event) => { setVehicleModel(event.target.value); setVehicleMessage(""); }} placeholder="Tesla Model Y" />
          </label>
          <label className="form-field compact-field">
            <span>Batarya kapasitesi</span>
            <div className="input-with-unit">
              <input type="number" min="1" max="250" step="0.1" inputMode="decimal" value={batteryCapacity} onChange={(event) => { setBatteryCapacity(event.target.value); setVehicleMessage(""); }} placeholder="75" />
              <strong>kWh</strong>
            </div>
          </label>
          <label className="form-field compact-field">
            <span>Aracınızı çoğunlukla yüzde kaça kadar şarj ediyorsunuz?</span>
            <div className="input-with-unit">
              <input type="number" min="1" max="100" step="1" inputMode="numeric" value={preferredChargeEndPercent} onChange={(event) => { setPreferredChargeEndPercent(event.target.value); setVehicleMessage(""); }} placeholder="80" />
              <strong>%</strong>
            </div>
            <small>Yeni şarj kaydındaki varsayılan bitiş yüzdesi olarak kullanılır.</small>
          </label>
        </div>

        <button className="backup-primary-button vehicle-settings-save" type="button" onClick={saveVehicleProfile}>
          {isAddingVehicle ? "Aracı oluştur" : "Araç bilgilerini kaydet"}
        </button>
        {!isAddingVehicle && vehicles.length > 1 && activeVehicle && (
          <button className="vehicle-delete-button" type="button" onClick={() => {
            if (window.confirm(`${activeVehicle.name} ve bu araca ait tüm şarj kayıtları silinsin mi?`)) {
              onDeleteVehicle(activeVehicle.id);
            }
          }}>
            Bu aracı sil
          </button>
        )}
        {vehicleMessage && <div className={`vehicle-settings-message ${vehicleMessage.includes("kaydedildi") || vehicleMessage.includes("oluşturuldu") ? "success" : "error"}`}>{vehicleMessage}</div>}
      </section>

      <section className="appearance-settings-card">
        <div className="backup-action-heading"><span>◐</span><div><strong>Görünüm</strong><small>Uygulamanın temasını ve kart görünümünü kişiselleştir.</small></div></div>
        <div className="appearance-setting-block">
          <span className="appearance-label">Tema modu</span>
          <div className="appearance-segmented-control">
            {([ ["system", "Otomatik"], ["light", "Açık"], ["dark", "Koyu"] ] as Array<[ThemeMode, string]>).map(([value, label]) => (
              <button key={value} type="button" className={themeSettings.mode === value ? "active" : ""} onClick={() => onThemeSettingsChange({ ...themeSettings, mode: value })}>{label}</button>
            ))}
          </div>
          <small className="appearance-helper">Otomatik seçeneği telefonun açık/koyu görünümünü takip eder.</small>
        </div>
        <div className="appearance-setting-block">
          <span className="appearance-label">Renk teması</span>
          <div className="theme-swatch-grid">
            {colorThemes.map((theme) => (
              <button key={theme.id} type="button" className={`theme-swatch ${themeSettings.colorTheme === theme.id ? "selected" : ""}`} onClick={() => onThemeSettingsChange({ ...themeSettings, colorTheme: theme.id })}>
                <span className="theme-color-preview">{theme.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
                <strong>{theme.name}</strong><span className="theme-check">✓</span>
              </button>
            ))}
          </div>
        </div>
        <div className="appearance-setting-block">
          <span className="appearance-label">Kart stili</span>
          <div className="appearance-segmented-control card-style-control">
            {([ ["modern", "Modern"], ["glass", "Cam"], ["minimal", "Minimal"] ] as Array<[CardStyle, string]>).map(([value, label]) => (
              <button key={value} type="button" className={themeSettings.cardStyle === value ? "active" : ""} onClick={() => onThemeSettingsChange({ ...themeSettings, cardStyle: value })}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="backup-status-card">
        <span className="backup-status-icon">◆</span>
        <div><small>TÜM ARAÇLARDAKİ VERİLER</small><strong>{vehicles.length} araç · {totalSessions} şarj kaydı</strong><span>Son yedek: {formatBackupDate(lastBackupDate)}</span></div>
      </section>

      <section className="backup-action-card">
        <div className="backup-action-heading"><span>⇧</span><div><strong>Tüm araçları dışa aktar</strong><small>Araç profilleri ve her araca ait kayıtlar tek JSON dosyasına kaydedilir.</small></div></div>
        <button className="backup-primary-button" type="button" onClick={exportBackup}>Tüm verilerin JSON yedeğini oluştur</button>
      </section>

      <section className="backup-action-card">
        <div className="backup-action-heading"><span>⇩</span><div><strong>Yedeği içe aktar</strong><small>Yedekteki bütün araçlar ve araçlara ait kayıtlar birlikte geri gelir.</small></div></div>
        <input ref={fileInputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={handleFileSelected} />
        <button className="backup-secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>JSON dosyası seç</button>
      </section>

      {pendingBackup && (
        <section className="backup-import-panel">
          <div className="backup-import-summary"><small>SEÇİLEN YEDEK</small><strong>{pendingFileName}</strong><span>{pendingBackup.vehicles.length} araç · {pendingBackup.vehicles.reduce((sum, entry) => sum + entry.sessions.length, 0)} şarj kaydı</span></div>
          <label className={`backup-mode-option ${importMode === "merge" ? "selected" : ""}`}><input type="radio" name="importMode" checked={importMode === "merge"} onChange={() => setImportMode("merge")} /><span><strong>Mevcut araçlarla birleştir</strong><small>Aynı araç ve kayıtlar çoğaltılmaz; eksik bilgiler eklenir.</small></span></label>
          <label className={`backup-mode-option danger ${importMode === "replace" ? "selected" : ""}`}><input type="radio" name="importMode" checked={importMode === "replace"} onChange={() => setImportMode("replace")} /><span><strong>Tüm mevcut verilerin yerine kullan</strong><small>Telefondaki bütün araçlar ve kayıtlar seçilen yedekle değiştirilir.</small></span></label>
          <div className="backup-import-actions"><button type="button" onClick={() => setPendingBackup(null)}>İptal</button><button className="backup-primary-button" type="button" onClick={completeImport}>İçe aktar</button></div>
        </section>
      )}

      {message && <div className={`backup-message ${isError ? "error" : "success"}`} role="status">{message}</div>}
      <p className="backup-footnote">Araç değiştirildiğinde ana sayfa ve istatistikler yalnızca seçili araca ait verileri gösterir.</p>
    </section>
  );
}

export default BackupView;
