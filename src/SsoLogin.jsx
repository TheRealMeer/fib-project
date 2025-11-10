import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./components/UserContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState(null);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Simple login handler
  const handleLogin = () => {
    if (!username || !password) {
      setNotes("⚠️ Please enter both username and password.");
      setTimeout(() => setNotes(null), 3000);
      return;
    }

    const fakeUser = { username, id: "local-demo-user" }; // You can replace with real login
    setNotes("✅ Logged in successfully!");
    setUser(fakeUser); // ✅ store globally
    localStorage.setItem("user", JSON.stringify(fakeUser)); // optional redundancy
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  // FIB SSO
  const handleStartSso = async () => {
    setLoading(true);
    setNotes(null);
    setSession(null);

    try {
      const res = await fetch("http://localhost:3001/api/sso/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redirectionUrl:
            "https://fib.stage.fib.iq/external/v1/sso?7847=a563a7d5-ec75-44bf-b0da-8ae166dff5c5",
        }),
      });

      const data = await res.json();
      setSession({
        ssoAuthorizationCode:
          data.ssoAuthorizationCode || data.authorizationCode,
        qrCode: data.qrCode,
        validUntil: data.validUntil,
      });
      setNotes("✅ SSO session started. Scan the QR code with your FIB app.");
    } catch (err) {
      setNotes(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Polling for SSO authorization
  useEffect(() => {
    if (!session?.ssoAuthorizationCode) return;
    setAuthInProgress(true);

    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:3001/api/sso/user-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: session.ssoAuthorizationCode.replace(/-/g, ""),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        console.log("Polling response:", data);

        if (data.userId) {
          clearInterval(interval);
          setNotes("✅ Authorization successful!");
          setUser(data); // ✅ store globally
          localStorage.setItem("user", JSON.stringify(data)); // keep local copy too
          setTimeout(() => navigate("/dashboard"), 1200);
        }
      } catch {
        /* ignore */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, navigate, setUser]);

  // Countdown timer for QR code
  useEffect(() => {
    if (!session?.validUntil) return;

    const timer = setInterval(() => {
      const expiry = new Date(session.validUntil);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        setNotes("❌ QR code expired. Please restart SSO.");
        setSession(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const formatCountdown = () => {
    if (timeLeft === null) return "";
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 space-y-6">
      {notes && (
        <div className="fixed top-10 bg-yellow-400 text-black px-4 py-2 rounded">
          {notes}
        </div>
      )}

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center text-white">Sign In</h1>

        {/* Username / Password */}
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all"
          >
            Log In
          </button>
        </div>

        <div className="border-t border-gray-600 relative my-4 mb-6 mt-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 px-3 text-gray-300">
            OR
          </span>
        </div>

        {/* FIB SSO */}
        <div className="flex flex-col items-center space-y-4 ">
          {!session ? (
            <button
              onClick={handleStartSso}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
            >
              {loading ? "Starting SSO..." : "Log in with FIB"}
            </button>
          ) : (
            <div className="flex flex-col items-center space-y-2 p-5 ">
              <img
                src={session.qrCode}
                alt="SSO QR"
                className="w-70 h-70 border-30 border-white"
              />
              <span className="text-gray-200 break-all text-center">
                Code: {session.ssoAuthorizationCode}
              </span>
              {timeLeft !== null && (
                <span
                  className={`mt-1 ${
                    timeLeft < 30 ? "text-red-500" : "text-yellow-400"
                  }`}
                >
                  ⏳ QR expires in: {formatCountdown()}
                </span>
              )}
              {authInProgress && (
                <div className="mt-2 flex flex-col items-center">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 mb-2"></div>
                  <span className="text-gray-400 text-sm">
                    Waiting for authorization...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loader styles */}
      <style>{`
        .loader {
          border-top-color: #6366f1;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
