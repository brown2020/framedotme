"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  showDeleteModal: boolean;
  onHideModal: () => void;
  onDeleteConfirm: () => void;
}

export function DeleteConfirmModal({
  showDeleteModal,
  onHideModal,
  onDeleteConfirm,
}: Props): ReactElement | null {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleDeleteConfirm = () => {
    if (deleteConfirmation === "DELETE ACCOUNT") {
      onDeleteConfirm();
    } else {
      toast.error("Please type 'DELETE ACCOUNT' to confirm.");
    }
  };

  if (!showDeleteModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-3">
      <div className="bg-white p-6 rounded-md shadow-lg">
        <h3 className="text-lg">
          Are you sure you want to delete your account?
        </h3>
        <p className="mb-4 mt-2">
          Please type <strong>DELETE ACCOUNT</strong> to confirm.
        </p>
        <input
          type="text"
          value={deleteConfirmation}
          onChange={(e) => setDeleteConfirmation(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type DELETE ACCOUNT"
          aria-label="Type DELETE ACCOUNT to confirm"
        />
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={onHideModal}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleDeleteConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
