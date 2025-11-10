// netlify/functions/createPayment.js
import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);

    // Example: access your secret key from environment variables
    const API_KEY = process.env.PAYMENT_API_KEY;

    const response = await fetch("https://payment-api.example.com/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
