import { XIcon } from "lucide-react";
import { Button } from "./button";
import { Z_INDEX } from "@/constants/config";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center" style={{ zIndex: Z_INDEX.dialog }}>
      <div className="relative bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <button
          onClick={onCancel}
          className="absolute top-0 right-0 p-2 hover:bg-gray-200 bg-gray-100 rounded-full m-2"
          aria-label="Close"
        >
          <XIcon size={20} className="text-gray-800" />
        </button>
        
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
