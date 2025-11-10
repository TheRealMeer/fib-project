import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "./components/DashboardHeader";
import ShareableQRCode from "./components/ShareableQRCode";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "./components/UserContext";
import { useSubscription } from "./components/SubscriptionContext";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

export default function ApiExample() {
  const [payment, setPayment] = useState(null); // Payment info
  const [status, setStatus] = useState(null); // Payment status
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error messages
  const [timeLeft, setTimeLeft] = useState(60); // 60-second QR scan timer
  const timerRef = useRef(null);
  const [notes, setNotes] = useState(null); // For user feedback
  const [amount, setAmount] = useState(1000); // default
  const [description, setDescription] = useState("Test Payment");
  const [isSubscribed, setIsSubscribed] = useState(false); // default: not subscribed
  const { subscription } = useSubscription();

  const location = useLocation();

  const { user } = useUser();
  const navigate = useNavigate();

  const BACKEND_URL = "https://my-backend.onrender.com"; // replace with your actual deployed URL

  const handleBuy = async () => {
    if (loading) return;

    // ❌ Validation: amount must not be empty or zero
    if (!amount || amount === 0) {
      setNotes("⚠️ Please enter a valid amount!");
      setTimeout(() => setNotes(""), 3000);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount, description: description }),
      });
      if (!res.ok) throw new Error("Failed to create payment");

      const data = await res.json();
      setPayment({
        ...data,
        amount: amount,
        description: description,
      });

      // Auto-check status immediately after creation
      await handleCheckStatus(data.paymentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual check (still works on button click)
  const handleCheckStatus = async (paymentId) => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:3001/api/payment/${paymentId}/status`
      );
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Automatically check status every few seconds (enhanced)
  useEffect(() => {
    if (!payment?.paymentId) return; // wait until payment exists

    const interval = setInterval(() => {
      handleCheckStatus(payment.paymentId);
    }, 5000); // check every 5 seconds

    // stop polling automatically when status is final
    if (
      status?.status === "PAID" ||
      status?.status === "CANCELED" ||
      status?.status === "REFUNDED"
    ) {
      clearInterval(interval);
    }

    // cleanup when component unmounts or payment/status changes
    return () => clearInterval(interval);
  }, [payment, status]);

  useEffect(() => {
    if (!status) return;

    if (status.status !== "UNPAID") {
      clearInterval(timerRef.current);
      setTimeLeft(0);
    }
  }, [status]);

  const handleCancelPayment = async () => {
    if (!payment) return;
    if (loading) return;

    // ✅ Prevent canceling a paid payment
    if (status?.status === "PAID") {
      setNotes("⚠️ Cannot cancel a payment that has been PAID!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:3001/api/payment/${payment.paymentId}/cancel`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setStatus({ status: "CANCELED" });
        clearInterval(timerRef.current); // stop the countdown
        setNotes("✅ Payment canceled successfully!");

        // 🟢 Re-enable fields and reset payment data
        setPayment(null);
        setStatus(null);
        setAmount("");
        setDescription("");
      } else {
        setNotes("❌ Failed to cancel payment");
      }
    } catch (err) {
      setNotes(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundPayment = async () => {
    if (loading) return; // ⛔ Prevent spam-clicks

    if (!payment?.paymentId) {
      setNotes("⚠️ You need to create and pay a payment first!");
      setTimeout(() => setNotes(""), 3000);
      return;
    }

    if (status?.status !== "PAID") {
      setNotes("⚠️ Only PAID payments can be refunded!");
      setTimeout(() => setNotes(""), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setNotes(null);

    try {
      const res = await fetch(
        `http://localhost:3001/api/payment/${payment.paymentId}/refund`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setNotes("✅ Refund requested successfully! Check status for updates.");

        // 🧩 Optional: Reset everything after a delay if you want
        setTimeout(() => {
          setPayment(null);
          setStatus(null);
          setAmount("");
          setDescription("");
          setNotes("");
        }, 4000);
      } else {
        setNotes("❌ Failed to request refund");
      }
    } catch (err) {
      setNotes(`❌ ${err.message}`);
    } finally {
      setLoading(false);

      // 🕒 Auto-clear notes after a short delay (if not reset already)
      setTimeout(() => setNotes(""), 3000);
    }
  };

  useEffect(() => {
    if (!payment) return;

    setTimeLeft(60);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setNotes("⚠️ Payment code has expired! Please create a new payment.");

          // Optional: automatically reset payment so Create button is enabled
          setPayment(null);
          setStatus(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [payment]);

  useEffect(() => {
    if (!status) return;

    if (status.status !== "UNPAID") {
      clearInterval(timerRef.current);
      setTimeLeft(0);
    }
  }, [status]);

  useEffect(() => {
    if (!notes) return;

    const timer = setTimeout(() => setNotes(null), 5000); // hide after 5s
    return () => clearTimeout(timer);
  }, [notes]);

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
  };

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      try {
        const res = await fetch(
          `http://localhost:3001/api/subscription/status?userId=${user.id}`
        );
        const data = await res.json();
        setIsSubscribed(data.subscribed); // true or false
      } catch (err) {
        console.error("Failed to fetch subscription status", err);
      }
    }

    if (user) fetchSubscriptionStatus();
  }, [user]);

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored)); // if you also import setUser
      } else {
        navigate("/"); // go back to login if no user found
      }
    }
  }, [user, navigate, useUser]);

  const statusColors = {
    ACTIVE: "bg-green-500 hover:bg-green-600",
    TRIAL: "bg-blue-500 hover:bg-blue-600",
    CANCELLED: "bg-gray-500 hover:bg-gray-600",
    FAILED: "bg-red-500 hover:bg-red-600",
    PENDING: "bg-yellow-500 hover:bg-yellow-600",
  };

  const buttonColor =
    statusColors[subscription?.status] || "bg-purple-500 hover:bg-purple-600";

  // Calculate days remaining
  let daysRemaining = null;
  if (subscription?.validUntil) {
    const expiryDate = parseISO(subscription.validUntil);
    daysRemaining = formatDistanceToNowStrict(expiryDate, { addSuffix: false });
  }

  const isActive =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 space-y-5">
      {/* Floating Notes / Alerts */}
      {notes && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded z-50 shadow-lg text-center">
          {notes}
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-6xl bg-gray-900 px-4 py-4 sm:px-12 sm:py-6 shadow-md rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-red-500 mb-3 sm:mb-0 text-center sm:text-left flex-1">
          FIB Payment Dashboard
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate("/transactions")}
            className="font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white w-full sm:w-auto transition-all duration-300"
          >
            📜 View Transactions
          </button>

          <div className="relative group w-full sm:w-auto">
            <button
              onClick={() => navigate("/subscription")}
              className={`font-bold px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-xl transition-all duration-300 transform w-full sm:w-auto ${
                isActive
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white hover:scale-105 focus:outline-none`}
            >
              {isActive ? "Subscribed" : "🚀 Go Premium"}
            </button>

            {/* Tooltip */}
            {subscription && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-gray-800 text-white text-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 shadow-lg text-center">
                <p>
                  <strong>Plan:</strong> {subscription.title}
                </p>
                <p>
                  <strong>Status:</strong> {subscription.status}
                </p>
                {daysRemaining && (
                  <p>
                    <strong>Expires in:</strong> {daysRemaining}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 sm:mt-0 ml-0 sm:ml-4 w-full sm:w-auto">
            <DashboardHeader user={user} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Left Column: Payment Info + Payment Details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Payment Info */}
          <motion.div className="space-y-6" layout>
            {payment && (
              <motion.div
                layout
                key="payment-info"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-linear-to-r from-gray-700 to-gray-800 p-4 sm:p-6 rounded-2xl shadow-2xl space-y-4 border border-gray-600"
              >
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2 border-b text-center border-gray-600 pb-2">
                  Payment Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-white font-semibold text-lg">
                      {payment?.amount || payment?.monetaryValue?.amount
                        ? Number(
                            payment?.amount || payment?.monetaryValue?.amount
                          ).toLocaleString()
                        : "N/A"}{" "}
                      IQD
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Description</span>
                    <span className="text-white font-semibold text-lg">
                      {description || payment?.description || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Payment ID</span>
                    <span className="text-white font-semibold text-lg">
                      {payment?.paymentId ?? "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span
                      className={`font-semibold text-lg ${
                        status?.status === "PAID"
                          ? "text-green-400"
                          : status?.status === "CANCELED"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {status?.status ?? "UNPAID"}
                    </span>
                  </div>
                  <div className="flex flex-col col-span-1 sm:col-span-2">
                    <span className="text-gray-400 text-sm">Time Left</span>
                    <span className="text-white font-semibold text-lg">
                      {timeLeft ?? "N/A"}s
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Details */}
            <motion.div
              layout
              key="payment-details"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-linear-to-r from-gray-700 to-gray-800 p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-600 space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-bold text-white border-b border-gray-600 pb-2 w-full text-center">
                Payment Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-gray-400 text-sm mb-1">
                    Amount (IQD)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter amount"
                    value={amount ? Number(amount).toLocaleString() : ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/,/g, "");
                      value = value.replace(/[^\d]/g, "");
                      setAmount(value);
                    }}
                    disabled={
                      payment &&
                      status?.status !== "CANCELED" &&
                      status?.status !== "REFUNDED"
                    }
                    className={`p-2 sm:p-3 rounded-xl shadow-inner focus:outline-none focus:ring-2 w-full ${
                      payment &&
                      status?.status !== "CANCELED" &&
                      status?.status !== "REFUNDED"
                        ? "bg-gray-300 cursor-not-allowed"
                        : "focus:ring-purple-500 bg-gray-700"
                    }`}
                    style={{
                      MozAppearance: "textfield",
                      appearance: "textfield",
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-400 text-sm mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={
                      payment &&
                      status?.status !== "CANCELED" &&
                      status?.status !== "REFUNDED"
                    }
                    className={`p-2 sm:p-3 rounded-xl shadow-inner focus:outline-none focus:ring-2 w-full ${
                      payment &&
                      status?.status !== "CANCELED" &&
                      status?.status !== "REFUNDED"
                        ? "bg-gray-300 cursor-not-allowed"
                        : "focus:ring-pink-500 bg-gray-700"
                    }`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    if (loading) return;
                    if (payment && status?.status === "UNPAID") {
                      setNotes(
                        "⚠️ You already have an active payment. Cancel or complete it first."
                      );
                      setTimeout(() => setNotes(""), 3000);
                    } else {
                      setPayment(null);
                      setStatus(null);
                      setAmount("");
                      setDescription("");
                      handleBuy();
                    }
                  }}
                  disabled={loading || (payment && status?.status === "UNPAID")}
                  className={`font-bold px-6 py-3 rounded-2xl shadow-xl transition-all duration-300 transform focus:outline-none w-full ${
                    loading || (payment && status?.status === "UNPAID")
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-linear-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white hover:scale-105 focus:ring-2 focus:ring-purple-400"
                  }`}
                >
                  {loading
                    ? "Processing..."
                    : !payment || status?.status !== "UNPAID"
                    ? "Create New Payment"
                    : "Create Payment"}
                </button>

                <button
                  onClick={() => handleCheckStatus(payment?.paymentId)}
                  disabled={!payment || loading}
                  className={`font-bold px-6 py-3 rounded-2xl shadow-xl transition-all duration-300 transform focus:outline-none w-full ${
                    !payment || loading
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-500 text-white hover:scale-105 focus:ring-2 focus:ring-blue-400"
                  }`}
                >
                  Check Status
                </button>

                <button
                  onClick={() => {
                    if (!payment || status?.status !== "UNPAID" || loading) {
                      setNotes("⚠️ You can only cancel unpaid payments.");
                      setTimeout(() => setNotes(""), 3000);
                    } else {
                      handleCancelPayment();
                    }
                  }}
                  disabled={!payment || status?.status !== "UNPAID" || loading}
                  className={`font-bold px-6 py-3 rounded-2xl shadow-xl transition-all duration-300 transform focus:outline-none w-full ${
                    !payment || status?.status !== "UNPAID" || loading
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-linear-to-r from-yellow-400 to-orange-500 hover:from-orange-500 hover:to-yellow-400 text-white hover:scale-105 focus:ring-2 focus:ring-yellow-400"
                  }`}
                >
                  Cancel Payment
                </button>

                <button
                  onClick={handleRefundPayment}
                  disabled={loading || !payment || status?.status !== "PAID"}
                  className={`font-bold px-6 py-3 rounded-2xl shadow-xl transition-all duration-300 transform focus:outline-none w-full ${
                    loading || !payment || status?.status !== "PAID"
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-linear-to-r from-red-500 to-pink-600 hover:from-pink-600 hover:to-red-500 text-white hover:scale-105 focus:ring-2 focus:ring-red-400"
                  }`}
                >
                  Refund
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column: QR Code */}
        <AnimatePresence>
          {payment?.qrCode && (
            <motion.div
              className="md:col-span-1 p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-gray-600 bg-linear-to-r from-gray-700 to-gray-800"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 border-b border-gray-600 pb-2 w-full text-center">
                QR Code
              </h2>
              <ShareableQRCode
                qrCode={payment.qrCode}
                readableCode={payment.readableCode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
