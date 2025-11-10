import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  createPayment,
  checkPaymentStatus,
  cancelPayment,
  refundPayment,
} from "./api/fib.js";

import {
  initiateSSO,
  getUserDetails as fetchSSOUserDetails, // renamed for clarity
} from "./api/fibsso.js";

import fibSubscription from "./api/fibSubscription.js";
import transactionRoutes from "./api/transactions.js";

dotenv.config();

const app = express();

// ---------------------------
// MIDDLEWARE
// ---------------------------
app.use(cors());
app.use(express.json());

/** ---------------------------
 * PAYMENT ENDPOINTS
 * --------------------------- */

// Create a new payment
app.post("/api/payment", async (req, res) => {
  const { amount, description, callbackUrl } = req.body;

  try {
    const payment = await createPayment(amount, description, callbackUrl);
    res.json(payment);
  } catch (error) {
    console.error(
      "❌ Failed to create payment:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// Check payment status by ID
app.get("/api/payment/:paymentId/status", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const status = await checkPaymentStatus(paymentId);
    res.json(status);
  } catch (error) {
    console.error(
      "❌ Failed to check payment status:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

// Cancel a payment by ID
app.post("/api/payment/:paymentId/cancel", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const result = await cancelPayment(paymentId);
    res.json(result);
  } catch (error) {
    console.error(
      "❌ Failed to cancel payment:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to cancel payment" });
  }
});

// Refund a payment by ID
app.post("/api/payment/:paymentId/refund", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const result = await refundPayment(paymentId);
    res.json(result);
  } catch (error) {
    console.error(
      "❌ Failed to refund payment:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to refund payment" });
  }
});

/** ---------------------------
 * SSO ENDPOINTS
 * --------------------------- */

// Initiate SSO session
app.post("/api/sso/initiate", async (req, res) => {
  const { redirectionUrl } = req.body;

  try {
    const data = await initiateSSO(redirectionUrl);
    res.json(data);
  } catch (error) {
    console.error(
      "❌ SSO initiation error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to initiate SSO" });
  }
});

// Fetch user details via SSO authorization code
app.post("/api/sso/user-details", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  const cleanedCode = code.replace(/-/g, ""); // remove dashes if any
  console.log("🧾 Cleaned SSO code:", cleanedCode);

  try {
    const userData = await fetchSSOUserDetails(cleanedCode);
    res.json(userData);
  } catch (error) {
    console.error(
      "❌ Backend error while getting user details:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to get user details" });
  }
});

// Optional: handle FIB redirect callback
app.get("/api/sso/callback", (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`❌ Login failed: ${error}`);
  }

  console.log("✅ Received SSO callback with code:", code, "State:", state);
  res.send(`✅ SSO complete! Authorization code: ${code}`);
});

/** ---------------------------
 * SUBSCRIPTION ENDPOINTS
 * --------------------------- */

// Use the subscription routes
app.use(express.json());
app.use("/api/subscription", fibSubscription);

/** ---------------------------
 * TRANSACTION ENDPOINTS
 * --------------------------- */

app.use("/api/transactions", transactionRoutes);

/** ---------------------------
 * SERVER START
 * --------------------------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
