import React from "react";

export default function CancelConfirmationModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Confirm Cancellation</h2>
        <p className="mb-6">
          Are you sure you want to cancel your subscription? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            No, keep it
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}
