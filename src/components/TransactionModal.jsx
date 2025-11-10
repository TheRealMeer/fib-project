import React from "react";

export default function TransactionModal({ txn, isOpen, onClose }) {
  if (!isOpen || !txn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>

        <div className="space-y-2">
          <p>
            <strong>ID:</strong> {txn.id}
          </p>
          <p>
            <strong>Type:</strong> {txn.type}
          </p>
          <p>
            <strong>Plan / Item:</strong> {txn.planOrItem}
          </p>
          <p>
            <strong>Amount:</strong> {txn.amount} {txn.currency}
          </p>
          <p>
            <strong>Status:</strong> {txn.status}
          </p>
          <p>
            <strong>Payment Method:</strong> {txn.paymentMethod}
          </p>
          <p>
            <strong>Date:</strong> {new Date(txn.date).toLocaleString()}
          </p>
          {txn.callbackUrl && (
            <p>
              <strong>Callback URL:</strong> {txn.callbackUrl}
            </p>
          )}
          {txn.description && (
            <p>
              <strong>Description:</strong> {txn.description}
            </p>
          )}
        </div>

        {txn.status === "successful" && (
          <button
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md"
            onClick={() => alert("Receipt download not implemented yet")}
          >
            Download Receipt
          </button>
        )}
      </div>
    </div>
  );
}
