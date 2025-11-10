import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TransactionModal from "./components/TransactionModal"; // adjust path
import { jsPDF } from "jspdf";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc"); // default: newest first
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/transactions");
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const typeMatch =
      filterType === "All" ||
      txn.type.toLowerCase() === filterType.toLowerCase();
    const statusMatch =
      filterStatus === "All" ||
      txn.status.toLowerCase() === filterStatus.toLowerCase();

    const txnDate = new Date(txn.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const dateMatch = (!start || txnDate >= start) && (!end || txnDate <= end);

    return typeMatch && statusMatch && dateMatch;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === "amount")
      return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
    if (sortField === "date")
      return sortOrder === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    return 0;
  });

  const searchedTransactions = sortedTransactions.filter(
    (txn) =>
      txn.planOrItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const interval = setInterval(refreshStatuses, 7000);
    return () => clearInterval(interval);
  }, [transactions]);

  const refreshStatuses = async () => {
    const updatedTxns = await Promise.all(
      transactions.map(async (txn) => {
        if (txn.status === "pending") {
          try {
            const statusData = await checkPaymentStatus(txn.id);
            const status = statusData?.status || txn.status;

            if (status === "successful" && txn.status === "pending") {
              // Show browser alert or toast
              alert(`Payment ${txn.id} completed successfully!`);
            }

            return { ...txn, status };
          } catch (err) {
            console.error("Error checking status for", txn.id, err);
            return txn;
          }
        }
        return txn;
      })
    );
    setTransactions(updatedTxns);
  };

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Plan/Item",
      "Amount",
      "Currency",
      "Status",
    ];
    const rows = sortedTransactions.map((txn) => [
      new Date(txn.date).toLocaleString(),
      txn.type,
      txn.planOrItem,
      txn.amount,
      txn.currency,
      txn.status,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "created":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-sm font-semibold">
            ✅ Created
          </span>
        );
      case "successful":
      case "active":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-semibold">
            🔵 {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-sm font-semibold">
            ❌ {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500 text-black text-sm font-semibold">
            ⚠️ Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-500 text-white text-sm font-semibold">
            {status}
          </span>
        );
    }
  };

  const downloadReceipt = (txn) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Transaction Receipt", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Transaction ID: ${txn.id}`, 20, 40);
    doc.text(`Type: ${txn.type}`, 20, 50);
    doc.text(`Plan/Item: ${txn.planOrItem}`, 20, 60);
    doc.text(`Amount: ${txn.amount} ${txn.currency}`, 20, 70);
    doc.text(`Status: ${txn.status}`, 20, 80);
    doc.text(`Date: ${new Date(txn.date).toLocaleString()}`, 20, 90);
    doc.text(`Payment Method: ${txn.paymentMethod}`, 20, 100);

    doc.save(`Receipt_${txn.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 sm:px-6 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-red-500">
        💳 Transaction History
      </h1>

      <div className="w-full max-w-4xl bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6">
        {loading ? (
          <p className="text-gray-400 text-center">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center">No transactions found.</p>
        ) : (
          <>
            {/* Filters & Search */}
            <div className="overflow-x-auto w-full mb-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 p-4 bg-gray-800 rounded-2xl shadow-lg">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by plan or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-white flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="All">All Types</option>
                  <option value="subscription">Subscription</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-gray-700 text-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="All">All Status</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="created">Created</option>
                </select>

                {/* Date Range */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-700 p-3 rounded-2xl shadow-inner w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-gray-300 text-sm font-medium">
                      From:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <label className="text-gray-300 text-sm font-medium">
                      To:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full sm:w-auto"
                    />
                  </div>
                </div>

                {/* Download CSV */}
                <button
                  onClick={downloadCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl w-full sm:w-auto font-semibold shadow-lg transition duration-200"
                >
                  Download CSV
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-700">
                    <th
                      className="py-3 px-2 sm:px-4 cursor-pointer text-sm sm:text-base"
                      onClick={() => {
                        setSortField("date");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      Date{" "}
                      {sortField === "date"
                        ? sortOrder === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-sm sm:text-base">
                      Type
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-sm sm:text-base">
                      Plan / Item
                    </th>
                    <th
                      className="py-3 px-2 sm:px-4 cursor-pointer text-sm sm:text-base"
                      onClick={() => {
                        setSortField("amount");
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      }}
                    >
                      Amount{" "}
                      {sortField === "amount"
                        ? sortOrder === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th className="py-3 px-2 sm:px-4 text-sm sm:text-base">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition"
                      onClick={() => {
                        setSelectedTxn(txn);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">
                        {new Date(txn.date).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-sm sm:text-base capitalize">
                        {txn.type}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">
                        {txn.planOrItem}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">
                        {Number(txn.amount || 0).toFixed(2)} {txn.currency}
                      </td>
                      <td className="py-2 px-2 sm:px-4 flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center text-sm sm:text-base">
                        {getStatusBadge(txn.status)}
                        {txn.status === "successful" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadReceipt(txn);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs sm:text-sm"
                          >
                            Download Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 sm:mt-10 bg-gray-800 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-xl shadow-lg transition"
      >
        ← Back to Dashboard
      </button>

      <TransactionModal
        txn={selectedTxn}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
