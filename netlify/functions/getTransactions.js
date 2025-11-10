// netlify/functions/getTransactions.js

export async function handler(event, context) {
  // Use environment variable for secret API key
  const API_KEY = process.env.MY_SECRET_KEY;

  try {
    const response = await fetch("https://api.example.com/transactions", {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
