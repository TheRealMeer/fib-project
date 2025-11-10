import React from "react";

export default function UpgradeModal({
  plans,
  currentPlan,
  onClose,
  onSelect,
  loading,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl w-96 text-white">
        <h2 className="text-2xl font-bold mb-4">Upgrade / Downgrade Plan</h2>
        <p className="mb-4">
          You are currently subscribed to:{" "}
          <strong>
            {currentPlan.title || currentPlan.planTitle || "Unknown Plan"}
          </strong>
        </p>
        <p className="mb-6">Choose a new plan below:</p>

        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-md border ${
                plan.title === currentPlan.title
                  ? "border-green-500 bg-gray-800"
                  : "border-gray-700"
              } flex justify-between items-center`}
            >
              <div>
                <p className="font-semibold">{plan.title}</p>
                <p className="text-gray-400">{plan.description}</p>
              </div>
              <button
                onClick={() => onSelect(plan)}
                disabled={plan.title === currentPlan.title || loading}
                className={`px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                  plan.title === currentPlan.title
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                }`}
              >
                {plan.title === currentPlan.title ? "Current" : "Select"}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
