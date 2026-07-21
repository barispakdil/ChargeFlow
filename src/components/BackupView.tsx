import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { ChargingSession } from "../types/ChargingSession";
import {
  buildBackupFileName,
  createBackup,
  LAST_BACKUP_DATE_KEY,
  parseBackup,
} from "../utils/backup";

type ImportMode = "merge" | "replace";

interface BackupViewProps {
  sessions: ChargingSession[];
  onImport: (sessions: ChargingSession[], mode: ImportMode) => void;
}

function formatBackupDate(value: string | null) {
  if (!value) return "Henüz yedek alınmadı";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function BackupView({ sessions, onImport }: BackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackupDate, setLastBackupDate] = useState(() =>
    localStorage.getItem(LAST_BACKUP_DATE_KEY),
  );
  const [pendingSessions, setPendingSessions] = useState<ChargingSession[] | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function showMessage(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function exportBackup() {
    const backup = createBackup(sessions);
    const fileName = buildBackupFileName();
    const json = JSON.stringify(backup, null, 2);
    const file = new File([json], fileName, { type: "application/json" });

    try {
      if (
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "ChargeFlow yedeği",
          text: `${sessions.length} şarj kaydının yedeği`,
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
      showMessage(`${sessions.length} kayıt içeren yedek hazırlandı.`);
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
      setPendingSessions(backup.sessions);
      setPendingFileName(file.name);
      setImportMode("merge");
      showMessage("");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Yedek dosyası okunamadı.",
        true,
      );
    }
  }

  function completeImport() {
    if (!pendingSessions) return;

    onImport(pendingSessions, importMode);
    showMessage(
      importMode === "merge"
        ? `${pendingSessions.length} kayıt mevcut verilerle birleştirildi.`
        : `${pendingSessions.length} kayıt yedekten geri yüklendi.`,
    );
    setPendingSessions(null);
    setPendingFileName("");
  }

  return (
    <section className="backup-page">
      <header className="backup-page-header">
        <p className="eyebrow">VERİ GÜVENLİĞİ</p>
        <h1>Yedekleme</h1>
        <p>Şarj kayıtlarını JSON dosyası olarak sakla veya eski bir yedeği geri yükle.</p>
      </header>

      <section className="backup-status-card">
        <span className="backup-status-icon">◆</span>
        <div>
          <small>TELEFONDAKİ KAYITLAR</small>
          <strong>{sessions.length} şarj kaydı</strong>
          <span>Son yedek: {formatBackupDate(lastBackupDate)}</span>
        </div>
      </section>

      <section className="backup-action-card">
        <div className="backup-action-heading">
          <span>⇧</span>
          <div>
            <strong>Yedeği dışa aktar</strong>
            <small>Dosyalar veya iCloud Drive'a kaydedebileceğin bir JSON oluşturur.</small>
          </div>
        </div>
        <button className="backup-primary-button" type="button" onClick={exportBackup}>
          JSON yedeği oluştur
        </button>
      </section>

      <section className="backup-action-card">
        <div className="backup-action-heading">
          <span>⇩</span>
          <div>
            <strong>Yedeği içe aktar</strong>
            <small>Daha önce ChargeFlow ile oluşturduğun JSON dosyasını seç.</small>
          </div>
        </div>
        <input
          ref={fileInputRef}
          className="backup-file-input"
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
        />
        <button
          className="backup-secondary-button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          JSON dosyası seç
        </button>
      </section>

      {pendingSessions && (
        <section className="backup-import-panel">
          <div className="backup-import-summary">
            <small>SEÇİLEN YEDEK</small>
            <strong>{pendingFileName}</strong>
            <span>{pendingSessions.length} şarj kaydı bulundu</span>
          </div>

          <label className={`backup-mode-option ${importMode === "merge" ? "selected" : ""}`}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
            />
            <span>
              <strong>Mevcut kayıtlarla birleştir</strong>
              <small>Aynı kayıtlar çoğaltılmaz. Yalnızca eksik kayıtlar eklenir.</small>
            </span>
          </label>

          <label className={`backup-mode-option danger ${importMode === "replace" ? "selected" : ""}`}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
            />
            <span>
              <strong>Mevcut kayıtların yerine kullan</strong>
              <small>Telefondaki tüm şarj kayıtları seçilen yedekle değiştirilir.</small>
            </span>
          </label>

          <div className="backup-import-actions">
            <button type="button" onClick={() => setPendingSessions(null)}>İptal</button>
            <button className="backup-primary-button" type="button" onClick={completeImport}>
              İçe aktar
            </button>
          </div>
        </section>
      )}

      {message && (
        <div className={`backup-message ${isError ? "error" : "success"}`} role="status">
          {message}
        </div>
      )}

      <p className="backup-footnote">
        Güncelleme yapmak normalde telefonundaki kayıtları silmez. Yine de önemli değişikliklerden önce yedek almak en güvenli yöntemdir.
      </p>
    </section>
  );
}

export default BackupView;
