import express from "express";
import axios from "axios";
import qs from "qs";
import { logTransaction } from "../utils/transactionLogger.js";

const router = express.Router();

// Function to get access token
export async function getSubscriptionToken() {
  const url = process.env.FIB_SUB_AUTH_URL;

  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: process.env.FIB_SUB_CLIENT_ID,
    client_secret: process.env.FIB_SUB_CLIENT_SECRET,
  });

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000, // 10s timeout
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error fetching token:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get access token");
  }
}

// Test route
router.get("/token", async (req, res) => {
  try {
    const token = await getSubscriptionToken();
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Create a real subscription
// ------------------------
router.post("/create", async (req, res) => {
  try {
    const token = await getSubscriptionToken();

    // Prepare subscription payload
    const subscriptionData = {
      title: req.body.title || "New Subscription",
      description: req.body.description || "New Subscription Description",
      monetaryValue: {
        amount: req.body.amount || "500",
        currency: req.body.currency || "IQD",
      },
      interval: req.body.interval || "P1M",
      trialPeriod: req.body.trialPeriod || null,
      expiresIn: req.body.expiresIn || "P1DT12H",
      statusCallbackUrl:
        req.body.statusCallbackUrl || "https://yourdomain.com/callback",
    };

    const fibEndpoint = "https://fib.stage.fib.iq/protected/v1/subscriptions";
    const response = await axios.post(fibEndpoint, subscriptionData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Map FIB response to frontend-friendly structure
    const result = {
      id: response.data.subscriptionId, // match frontend expectation
      qrCode: response.data.qrCode, // QR code to display
      readableCode: response.data.readableCode,
      validUntil: response.data.validUntil,
      appLink: response.data.appLink,
      status: "PENDING", // initial status for frontend
    };

    console.log("Subscription create response:", result);

    logTransaction({
      type: "subscription",
      planOrItem: subscriptionData.title,
      amount: subscriptionData.monetaryValue.amount,
      currency: subscriptionData.monetaryValue.currency,
      status: "created",
      paymentMethod: "QR Code",
      userId: req.body.userId || "guest",
    });

    res.json(result);
  } catch (error) {
    console.error(
      "Error creating subscription:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ------------------------
// Get subscription details by ID
// ------------------------
router.get("/:id", async (req, res) => {
  try {
    const token = await getSubscriptionToken();
    const subscriptionId = req.params.id;

    console.log("Fetching subscription with ID:", subscriptionId);

    const fibEndpoint = `https://fib.stage.fib.iq/protected/v1/subscriptions/${subscriptionId}`;

    const response = await axios.get(fibEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10s timeout
    });

    console.log("Subscription details:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching subscription:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});
// ------------------------
// Cancel subscription
router.post("/:id/cancel", async (req, res) => {
  const subscriptionId = req.params.id;

  try {
    const token = await getSubscriptionToken();

    const response = await axios.post(
      `https://fib.stage.fib.iq/protected/v1/subscriptions/${subscriptionId}/cancel`,
      null, // no body required
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Log cancellation
    logTransaction({
      type: "subscription",
      planOrItem: subscriptionId,
      amount: 0,
      status: "cancelled",
      paymentMethod: "N/A",
      userId: req.body.userId || "guest",
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error cancelling subscription:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

export default router;
