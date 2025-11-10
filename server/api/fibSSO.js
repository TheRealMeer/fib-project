import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Initiates a FIB SSO session
 * @param {string|null} redirectionUrl - Optional URL to redirect after SSO
 * @returns {Promise<Object>} SSO session data including authorization code and QR
 */
export async function initiateSSO(redirectionUrl = null) {
  try {
    const body = {};
    if (redirectionUrl) body.redirectionUrl = redirectionUrl;

    const response = await axios.post(
      `${process.env.FIB_SSO_URL}`, // Initiate SSO endpoint
      body,
      {
        auth: {
          username: process.env.FIB_SSO_CLIENT_IDENTIFIER,
          password: process.env.FIB_SSO_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ SSO initiated successfully:", response.data);
    return response.data;
  } catch (err) {
    // Structured error logging
    console.error("❌ Failed to initiate SSO session.");
    console.error("Status:", err.response?.status || "N/A");
    console.error("Data:", err.response?.data || err.message);
    console.error("Headers:", err.response?.headers || "N/A");
    throw new Error(
      `SSO initiation failed: ${err.response?.data?.message || err.message}`
    );
  }
}

/**
 * Fetches FIB user details after SSO authorization
 * @param {string} ssoAuthorizationCode - The SSO code received from the initiation step
 * @returns {Promise<Object>} User details object
 */
export async function getUserDetails(ssoAuthorizationCode) {
  if (!ssoAuthorizationCode) {
    throw new Error("Missing SSO authorization code.");
  }

  try {
    const response = await axios.get(
      `${process.env.FIB_SSO_URL}/${ssoAuthorizationCode}/details`,
      {
        auth: {
          username: process.env.FIB_SSO_CLIENT_IDENTIFIER,
          password: process.env.FIB_SSO_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Retrieved user details successfully:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Failed to get user details.");
    console.error("Status:", err.response?.status || "N/A");
    console.error("Data:", err.response?.data || err.message);
    console.error("Headers:", err.response?.headers || "N/A");
    throw new Error(
      `Fetching user details failed: ${
        err.response?.data?.message || err.message
      }`
    );
  }
}
