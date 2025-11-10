import fs from "fs";
import path from "path";

const logFile = path.resolve("transactions.json");

// Ensure the file exists
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, JSON.stringify([]));
}

// Function to log new transactions
export function logTransaction(transaction) {
  try {
    const logs = JSON.parse(fs.readFileSync(logFile, "utf-8"));
    logs.push({
      id: transaction.id || `txn_${Date.now()}`,
      userId: transaction.userId || "guest",
      type: transaction.type || "payment",
      planOrItem: transaction.planOrItem || "N/A",
      amount: transaction.amount || 0,
      currency: transaction.currency || "IQD",
      status: transaction.status || "pending",
      paymentMethod: transaction.paymentMethod || "QR Code",
      date: new Date().toISOString(),
    });
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log("✅ Transaction logged:", transaction);
  } catch (error) {
    console.error("❌ Failed to log transaction:", error.message);
  }
}

// Function to get all transactions
export function getAllTransactions() {
  try {
    return JSON.parse(fs.readFileSync(logFile, "utf-8"));
  } catch (error) {
    return [];
  }
}
