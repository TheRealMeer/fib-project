import axios from "axios";
import dotenv from "dotenv";

import { logTransaction } from "../utils/transactionLogger.js";

dotenv.config();

const BASE_URL = "https://fib.stage.fib.iq/protected/v1";
let cachedToken = null;
let tokenExpiry = 0;

// Helper to log errors consistently
const handleError = (fnName, err) => {
  console.error(`❌ ${fnName} failed:`, err.response?.data || err.message);
  throw err;
};

// 1️⃣ Get OAuth2 token with caching
export async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken; // reuse cached token
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.FIB_CLIENT_ID);
    params.append("client_secret", process.env.FIB_CLIENT_SECRET);

    const res = await axios.post(process.env.FIB_AUTH_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    cachedToken = res.data.access_token;
    tokenExpiry = now + res.data.expires_in * 1000 - 5000; // refresh 5s early
    return cachedToken;
  } catch (err) {
    handleError("getToken", err);
  }
}

// 2️⃣ Generic API request helper
const apiRequest = async (method, endpoint, data) => {
  try {
    const token = await getToken();
    const res = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data,
    });
    return res.data;
  } catch (err) {
    handleError(`${method.toUpperCase()} ${endpoint}`, err);
  }
};

// 3️⃣ Payment functions
export const createPayment = async (
  amount,
  description,
  callbackUrl,
  userId = "guest"
) => {
  const paymentData = {
    monetaryValue: { amount, currency: "IQD" },
    description,
    callbackUrl,
  };

  const res = await apiRequest("post", "/payments", paymentData);

  // ✅ Log transaction to file / database
  if (res && res.paymentId) {
    await logTransaction({
      id: res.paymentId,
      userId,
      type: "payment",
      planOrItem: description,
      amount: Number(amount),
      currency: "IQD",
      status: res.status || "PENDING",
      paymentMethod: "QR Code",
      date: new Date().toISOString(),
    });
  }

  return res;
};

export const checkPaymentStatus = (paymentId) =>
  apiRequest("get", `/payments/${paymentId}/status`);

export const cancelPayment = async (paymentId, userId = "guest") => {
  const res = await apiRequest("post", `/payments/${paymentId}/cancel`, {});

  await logTransaction({
    id: paymentId,
    userId,
    type: "payment",
    planOrItem: "N/A",
    amount: 0,
    currency: "IQD",
    status: "CANCELLED",
    paymentMethod: "QR Code",
    date: new Date().toISOString(),
  });

  return { success: true, data: res };
};

export const refundPayment = async (paymentId, userId = "guest") => {
  const res = await apiRequest("post", `/payments/${paymentId}/refund`, {});

  await logTransaction({
    id: paymentId,
    userId,
    type: "payment_refund",
    planOrItem: "N/A",
    amount: 0,
    currency: "IQD",
    status: "REFUNDED",
    paymentMethod: "QR Code",
    date: new Date().toISOString(),
  });

  return { success: true, data: res };
};
