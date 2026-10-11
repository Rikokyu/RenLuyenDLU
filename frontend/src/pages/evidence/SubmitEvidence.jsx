import React, { useCallback, useEffect, useRef, useState } from "react";
import { evidenceApi } from "../../services/evidenceService";
import { getCurrentUser } from "../../store/authStore";

// Tao request_key ngau nhien, idempotent: moi lan mo modal la 1 key moi
function generateRequestKey() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const MAX_SIZE_MB = 5;
const MAX_IMAGE_PIXELS = 20_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXT = [".jpg", ".jpeg", ".png"];

export default function SubmitEvidence({ onClose, onSubmitSuccess, targetUserId }) {
  const user = getCurrentUser();
  const userId = targetUserId || user?.id;

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // request_key: sinh 1 lan khi mo modal, dam bao idempotent
  const requestKeyRef = useRef(generateRequestKey());
  const submittingRef = useRef(false);

  const fileInputRef = useRef(null);

  // Load danh sach hoat dong da dang ky
  useEffect(() => {
    let cancelled = false;
    setLoadingActivities(true);
    setActivitiesError("");
    evidenceApi
      .getRegisteredActivities(userId)
      .then((data) => {
        if (!cancelled) setActivities(data || []);
      })
      .catch((err) => {
        if (!cancelled)
          setActivitiesError(
            err.response?.data?.message || "Khong the tai danh sach hoat dong."
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingActivities(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  // Preview anh khi chon file
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const filteredActivities = activities.filter(
    (a) =>
      !search.trim() ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.activityCode.toLowerCase().includes(search.toLowerCase())
  );

  const validateFile = useCallback((f) => {
    if (!f) return "Vui long chon mot anh.";
    if (!ACCEPTED_TYPES.includes(f.type)) return "Chi chap nhan anh JPG hoac PNG.";
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) return "Ten tep khong hop le.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return "Anh khong duoc vuot qua 5 MB.";
    return null;
  }, []);

  const handleFileSelect = (f) => {
    if (submittingRef.current) return;
    const err = validateFile(f);
    if (err) { setUploadError(err); return; }
    setUploadError("");
    setFile(f);
    requestKeyRef.current = generateRequestKey();
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!selectedActivity) { setUploadError("Vui long chon hoat dong muon nop minh chung."); return; }
    const fileErr = validateFile(file);
    if (fileErr) { setUploadError(fileErr); return; }
    submittingRef.current = true;
    setUploading(true);
    let imageBitmap;
    try {
      imageBitmap = await createImageBitmap(file);
    } catch {
      submittingRef.current = false;
      setUploading(false);
      setUploadError("Khong doc duoc noi dung anh. Tep co the khong phai JPG/PNG hop le hoac da bi hong.");
      return;
    }
    const { width, height } = imageBitmap;
    imageBitmap.close();
    if (width * height > MAX_IMAGE_PIXELS) {
      submittingRef.current = false;
      setUploading(false);
      setUploadError(`Anh co kich thuoc ${width} x ${height}, vuot gioi han 20 trieu diem anh.`);
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    try {
      const result = await evidenceApi.submitEvidence({
        registrationId: selectedActivity.registrationId,
        requestKey: requestKeyRef.current,
        file,
        userId,
        onUploadProgress: ({ loaded, total }) => {
          if (total) setUploadProgress(Math.min(99, Math.round(loaded * 100 / total)));
        },
      });
      setUploadProgress(100);
      if (onSubmitSuccess) onSubmitSuccess(result);
      onClose();
    } catch (err) {
      setUploadProgress(0);
      const msg =
        err.response?.data?.message ||
        "Khong the luu minh chung. Ban co the thu gui lai.";
      setUploadError(msg);
    } finally {
      submittingRef.current = false;
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay-stu" onClick={(e) => e.target === e.currentTarget && !submittingRef.current && onClose()}>
      <div className="modal-content-stu submit-modal">
        {/* Tieu de */}
        <h2 className="text-large font-bold modal-title-bar">
          <span>+ Nop Minh Chung</span>
          <button className="btn-modal-close" onClick={onClose} disabled={uploading} title="Dong">&#x2715;</button>
        </h2>

        {/* Buoc 1: Chon hoat dong */}
        <div className="submit-section">
          <p className="submit-section-label">Buoc 1: Chon hoat dong da dang ky</p>
          <input
            type="text"
            className="input-stu"
            placeholder="Tim kiem theo ten hoac ma hoat dong..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={uploading}
          />
          <div className="activity-list-box">
            {loadingActivities && <p className="activity-hint">Dang tai danh sach...</p>}
            {activitiesError && <p className="activity-hint error-hint">{activitiesError}</p>}
            {!loadingActivities && !activitiesError && filteredActivities.length === 0 && (
              <p className="activity-hint">Khong co hoat dong phu hop hoac ban chua dang ky hoat dong nao.</p>
            )}
            {filteredActivities.map((a) => (
              <div
                key={a.registrationId}
                className={`activity-option ${selectedActivity?.registrationId === a.registrationId ? "selected" : ""}`}
                onClick={() => {
                  if (submittingRef.current) return;
                  if (selectedActivity?.registrationId !== a.registrationId) requestKeyRef.current = generateRequestKey();
                  setSelectedActivity(a);
                }}
                role="option"
                aria-selected={selectedActivity?.registrationId === a.registrationId}
              >
                <span className="activity-option-title">{a.title}</span>
                <span className="activity-option-meta">{a.activityCode} &bull; {a.score} diem</span>
              </div>
            ))}
          </div>
          {selectedActivity && (
            <div className="selected-activity-badge">
              Da chon: <strong>{selectedActivity.title}</strong> ({selectedActivity.activityCode})
            </div>
          )}
        </div>

        {/* Buoc 2: Tai anh minh chung */}
        <div className="submit-section">
          <p className="submit-section-label">Buoc 2: Tai len anh minh chung (JPG, PNG, toi da 5 MB)</p>

          <div
            className={`dropzone-box ${dragOver ? "dragover" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && !uploading && fileInputRef.current?.click()}
            aria-label="Vung keo tha hoac click de chon anh"
          >
            {preview ? (
              <img src={preview} alt="Xem truoc" className="dropzone-preview-img" />
            ) : (
              <div className="dropzone-placeholder">
                <span className="dropzone-icon">&#128247;</span>
                <span className="dropzone-text">
                  {dragOver ? "Thu anh vao day" : "Keo & tha hoac click de chon anh"}
                </span>
                <span className="dropzone-hint">JPG / PNG, toi da 5 MB</span>
              </div>
            )}
            {file && !uploading && (
              <button
                type="button"
                className="btn-stu btn-orange btn-delete-file"
                onClick={(e) => { e.stopPropagation(); setFile(null); setUploadError(""); }}
                title="Xoa anh"
              >
                Xoa
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          {file && (
            <p className="file-name-hint">
              <strong>Da chon:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%`, transition: "width 0.15s ease" }}
            />
          </div>
        )}

        {/* Loi */}
        {uploadError && <p role="alert" className="student-evidence-error">{uploadError}</p>}

        {/* Nut hanh dong */}
        <div className="modal-actions-right">
          <button className="btn-stu btn-orange" onClick={onClose} disabled={uploading}>
            Thoat
          </button>
          <button
            className="btn-stu btn-green"
            onClick={handleSubmit}
            disabled={uploading || !selectedActivity || !file}
          >
            {uploading ? "Dang gui..." : "Nop minh chung"}
          </button>
        </div>
      </div>
    </div>
  );
}
