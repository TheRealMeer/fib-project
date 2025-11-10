import React from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../components/SubscriptionContext";

export default function ShareableQRCode({ qrCode, readableCode }) {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  const isSubscribed = subscription?.status === "ACTIVE" || "TRIAL";

  // --- QR Buttons ---
  const handleCopy = () => {
    navigator.clipboard.writeText(readableCode);
    alert("✅ Code copied to clipboard!");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `Payment-${readableCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("⚠️ Sharing not supported on this device.");
      return;
    }

    try {
      const res = await fetch(qrCode);
      const blob = await res.blob();
      const file = new File([blob], `Payment-${readableCode}.png`, {
        type: blob.type,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Payment QR Code",
          text: `Scan this QR code or use the code: ${readableCode}`,
          files: [file],
        });
      } else {
        alert("⚠️ Sharing files not supported on this device.");
      }
    } catch (err) {
      console.error("❌ Sharing failed:", err);
    }
  };

  // --- UI ---
  return (
    <div
      className="bg-gray-800 p-2
    
     rounded-2xl shadow-xl flex flex-col items-center space-y-4 border border-gray-600"
    >
      <h2 className="text-xl font-bold text-white mb-2 border-b border-gray-600 pb-2 w-full text-center">
        Payment QR Code
      </h2>

      <div className="bg-white p-10 shadow-xl">
        <img src={qrCode} alt="Payment QR Code" className="w-52 h-52" />
      </div>

      <div className="flex flex-col items-center space-y-1">
        <span className="text-gray-400 text-sm">Readable Code</span>
        <span className="text-white font-semibold text-lg text-center">
          {readableCode}
        </span>
      </div>

      {/* If subscribed → show QR buttons; if not → show “Become Member” */}
      {isSubscribed ? (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-white cursor-pointer"
          >
            Copy Code
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-500 rounded hover:bg-green-600 text-white cursor-pointer"
          >
            Download QR
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600 text-white cursor-pointer"
          >
            Share
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/subscription")}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg mt-4 shadow-lg transition-all duration-300"
        >
          Become a Member
        </button>
      )}
    </div>
  );
}
