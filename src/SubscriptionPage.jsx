import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "./components/SubscriptionContext";
import UpgradeModal from "./components/UpgradeModal";
import CancelConfirmationModal from "./components/CancelConformationModal";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setSubscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Load subscription from localStorage if exists
  useEffect(() => {
    const saved = localStorage.getItem("currentSubscription");
    if (saved) {
      const sub = JSON.parse(saved);
      setPayment(sub);
      setSubscription(sub);
    }
  }, [setSubscription]);

  const statusColors = {
    PENDING: "text-yellow-400",
    ACTIVE: "text-green-400",
    TRIAL: "text-blue-400",
    FAILED: "text-red-500",
    CANCELLED: "text-gray-500",
  };

  // Plans
  const plans = [
    {
      title: "Weekly Plan",
      description: "Access for 7 days",
      amount: 500,
      interval: "P7D",
      trial: "P7D",
    },
    {
      title: "Monthly Plan",
      description: "Access for 1 month",
      amount: 2000,
      interval: "P1M",
      trial: "P7D",
    },
    {
      title: "Quarterly Plan",
      description: "Access for 3 months",
      amount: 5500,
      interval: "P3M",
    }, // no trial
    {
      title: "Yearly Plan",
      description: "Access for 12 months",
      amount: 20000,
      interval: "P1Y",
    }, // no trial
  ];

  // Subscribe to a plan
  const subscribe = async (plan) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Subscribing to plan:", plan);

      const response = await fetch(
        "http://localhost:3001/api/subscription/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: plan.title,
            description: plan.description,
            monetaryValue: { amount: plan.amount, currency: "IQD" },
            interval: plan.interval,
            ...(plan.trial && { trialPeriod: plan.trial }),
            expiresIn: "P1DT12H",
            statusCallbackUrl: "https://yourdomain.com/callback",
          }),
        }
      );

      const data = await response.json();
      console.log("Subscription create response:", data);

      if (!data.id || !data.qrCode) {
        setError("Failed to create subscription. Please try again.");
        return;
      }

      setPayment(data);
      localStorage.setItem("currentSubscription", JSON.stringify(data));
    } catch (err) {
      console.error("Subscription failed:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Polling for subscription status
  useEffect(() => {
    if (!payment?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/subscription/${payment.id}`
        );
        const data = await res.json();

        // Update status immediately
        if (data.status && data.status !== payment.status) {
          setPayment((prev) => ({ ...prev, status: data.status }));
          clearInterval(interval); // Stop polling immediately
        }

        // If subscription is active or failed, update context
        if (data.status === "ACTIVE" || data.status === "TRIAL") {
          setSubscription(data); // so your dashboard buttons know user is subscribed
        }

        if (data.status === "FAILED") {
          alert("Payment failed. Please try again.");
        }
      } catch (err) {
        console.error("Error polling subscription:", err);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payment, setSubscription]);

  const cancelSubscription = async () => {
    if (!payment?.id) return;

    try {
      const res = await fetch(
        `http://localhost:3001/api/subscription/${payment.id}/cancel`,
        { method: "POST" }
      );
      const data = await res.json();
      console.log("Cancelled subscription:", data);
      alert("Subscription cancelled.");
      setPayment(null);
      setSubscription(null);
      localStorage.removeItem("currentSubscription");
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      alert("Failed to cancel subscription.");
    }
  };

  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      try {
        const res = await fetch(
          "http://localhost:3001/api/subscription/current"
        );
        const data = await res.json();

        if (data && ["ACTIVE", "TRIAL"].includes(data.status)) {
          setPayment(data); // show current subscription
          setSubscription(data); // update context
        }
      } catch (err) {
        console.error("Failed to fetch current subscription:", err);
      }
    };

    fetchCurrentSubscription();
  }, [setSubscription]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
        Subscription Page
      </h1>
      <p className="text-gray-400 mb-8 text-center">
        Choose your subscription plan
      </p>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {!payment ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg flex flex-col items-center text-center"
              >
                <h2 className="text-xl font-semibold mb-2">{plan.title}</h2>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <p className="text-2xl font-bold mb-4">{plan.amount} IQD</p>

                <button
                  onClick={() => subscribe(plan)}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-semibold w-full sm:w-auto transition-all duration-300"
                >
                  {loading ? "Processing..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md w-full sm:w-auto"
            >
              Return to Dashboard
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center mt-8 w-full max-w-md">
          <h2 className="text-xl mb-4 font-semibold text-green-400 text-center">
            Scan the QR Code to Complete Payment
          </h2>

          {payment.qrCode ? (
            <div className="bg-white p-6 rounded-2xl mb-4 flex justify-center">
              <img
                src={payment.qrCode}
                alt="QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64"
              />
            </div>
          ) : (
            <p className="text-red-500 mb-4 text-center">
              QR code not available.
            </p>
          )}

          {payment.readableCode && (
            <p className="text-gray-300 mb-2 text-center">
              <strong>Readable Code:</strong> {payment.readableCode}
            </p>
          )}

          {payment.validUntil && (
            <p className="text-gray-400 mb-6 text-center">
              <strong>Valid Until:</strong>{" "}
              {new Date(payment.validUntil).toLocaleString()}
            </p>
          )}

          {payment.status && (
            <p
              className={`mb-4 font-semibold text-center ${
                statusColors[payment.status] || "text-white"
              }`}
            >
              Status: {payment.status}
            </p>
          )}

          <p className="text-gray-300 mb-6 text-sm text-center">
            Use your mobile banking app to scan the QR code and complete
            payment.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-semibold w-full transition-all duration-300"
            >
              Change Plan
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md w-full"
            >
              Cancel Subscription
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md w-full"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          plans={plans}
          currentPlan={payment}
          loading={loading}
          onClose={() => setShowUpgradeModal(false)}
          onSelect={(plan) => {
            setShowUpgradeModal(false);
            subscribe(plan);
          }}
        />
      )}

      <CancelConfirmationModal
        open={showCancelModal}
        onConfirm={async () => {
          setShowCancelModal(false);
          try {
            const res = await fetch(
              `http://localhost:3001/api/subscription/${payment.id}/cancel`,
              { method: "POST" }
            );
            const data = await res.json();
            console.log("Cancelled subscription:", data);
            alert("Subscription cancelled.");
            setPayment(null);
            setSubscription(null);
          } catch (err) {
            console.error("Error cancelling subscription:", err);
            alert("Failed to cancel subscription.");
          }
        }}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
