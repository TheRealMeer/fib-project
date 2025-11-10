import express from "express";
import { getAllTransactions } from "../utils/transactionLogger.js";

const router = express.Router();

// GET all logged transactions
router.get("/", async (req, res) => {
  try {
    // In the future, filter by logged-in user
    const transactions = getAllTransactions();
    res.json(transactions);
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST a new transaction
router.post("/", (req, res) => {
  try {
    const txn = req.body;
    logTransaction(txn); // from transactionLogger.js
    res.json({ message: "Transaction logged successfully" });
  } catch (err) {
    console.error("Failed to log transaction:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
