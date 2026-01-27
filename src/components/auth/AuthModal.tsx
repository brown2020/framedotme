import { XIcon } from "lucide-react";
import { Z_INDEX } from "@/constants/config";

interface AuthModalProps {
  isVisible: boolean;
  modalRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Reusable modal container for authentication flows
 */
export function AuthModal({
  isVisible,
  modalRef,
  onClose,
  children,
}: AuthModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center" style={{ zIndex: Z_INDEX.modal }}>
      <div
        ref={modalRef}
        className="relative bg-white text-black p-4 rounded-lg shadow-lg w-full max-w-md mx-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 hover:bg-gray-400 bg-gray-200 rounded-full m-2"
        >
          <XIcon size={24} className="text-gray-800" />
        </button>
        {children}
      </div>
    </div>
  );
}
