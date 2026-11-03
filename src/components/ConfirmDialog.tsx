// src/components/ConfirmDialog.tsx — simple modal for delete confirmations.
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  onConfirm, onCancel, loading,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4">
      <div className="card w-full max-w-md">
        <div className="card-body">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="mt-2 text-sm text-slate-600">{message}</div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onCancel} className="btn-secondary" disabled={loading}>
              {cancelLabel}
            </button>
            <button onClick={onConfirm} className="btn-danger" disabled={loading}>
              {loading ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
