import { useState } from "react";

export default function SubmitEvidence({ activity, onClose, onSubmitSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Chỉ chấp nhận ảnh JPEG hoặc PNG.");
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh minh chứng không được vượt quá 5 MB.");
      setSelectedFile(null);
      return;
    }
    setError("");
    setSelectedFile(file);
  }

  async function handleSubmit() {
    if (!selectedFile) {
      setError("Vui lòng chọn ảnh minh chứng trước khi gửi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await readAsDataUrl(selectedFile);
      await onSubmitSuccess(data);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Không thể nộp minh chứng. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay-stu">
      <div className="modal-content-stu" role="dialog" aria-modal="true" aria-labelledby="submit-evidence-heading">
        <h2 id="submit-evidence-heading" className="text-large font-bold">
          Nộp minh chứng tham gia
        </h2>
        <p className="text-small">Hoạt động: <strong>{activity.title}</strong></p>
        <label className="dropzone-box">
          <span className="dropzone-text">
            {selectedFile ? selectedFile.name : "Chọn ảnh minh chứng JPEG hoặc PNG"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            aria-label="Chọn ảnh minh chứng"
          />
        </label>
        <p className="note-text-red">Dung lượng tối đa 5 MB.</p>
        {error && <p role="alert" className="activity-detail-error">{error}</p>}
        <div className="modal-actions-right">
          <button className="btn-stu btn-orange" type="button" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button className="btn-stu btn-green" type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? "Đang gửi..." : "Nộp minh chứng"}
          </button>
        </div>
      </div>
    </div>
  );
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Không thể đọc ảnh đã chọn."));
    };
    reader.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
    reader.readAsDataURL(file);
  });
}
