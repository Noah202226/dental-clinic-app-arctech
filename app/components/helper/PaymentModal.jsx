"use client";

import { useEffect, useState } from "react";
import { databases, ID } from "../../lib/appwrite";
import { Query } from "appwrite";
import { X, Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import NewTransactionModal from "./NewTransactionModal";
import InstallmentsModal from "./InstallmentsModal";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_TRANSACTIONS = "transactions";

// NEW: Simple Confirmation Dialog Component (You can make this more complex)
const ConfirmationDialog = ({ transaction, onConfirm, onCancel }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all">
        <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Deletion</h3>
        <p className="text-gray-700 mb-6">
          Are you absolutely sure you want to delete this transaction?
          <br />
          <span className="font-semibold text-sm block mt-2">
            Service: {transaction.serviceName || "Unnamed Service"} (₱
            {Number(transaction.paid || 0).toLocaleString()})
          </span>
          <span className="text-red-500 font-semibold block text-sm">
            This action cannot be undone.
          </span>
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-semibold"
          >
            <Trash2 size={18} className="inline mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};
// END NEW: Confirmation Dialog Component

export default function PaymentModal({ isOpen, onClose, patient }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalPaid: 0, totalRemaining: 0 });
  const [openNewModal, setOpenNewModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  // NEW: State for the transaction to delete and control the confirmation modal
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!patient?.$id) return;
    try {
      setLoading(true);
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        [Query.equal("patientId", patient.$id), Query.orderDesc("$createdAt")]
      );

      const docs = res.documents;
      const totalPaid = docs.reduce((sum, t) => sum + Number(t.paid || 0), 0);
      const totalRemaining = docs.reduce(
        (sum, t) => sum + Number(t.remaining || 0),
        0
      );

      setTransactions(docs);
      setSummary({ totalPaid, totalRemaining });
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Final deletion handler, only called after confirmation
  const executeDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      setLoading(true);
      // Close the confirmation dialog immediately
      setTransactionToDelete(null); 
      
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transactionToDelete.$id // Use the ID from the state
      );

      await fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to open the confirmation modal
  const startDeleteProcess = (transaction) => {
    setTransactionToDelete(transaction);
  };

  useEffect(() => {
    if (isOpen && patient?.$id) fetchTransactions();
  }, [isOpen, patient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div className="bg-white w-full sm:w-[85vw] md:w-[70vw] lg:w-[60vw] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-mint-300">
        {/* Header */}
        {/* ... (Header remains the same) */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[var(--theme-color)] to-mint-500 text-white">
          <h2 className="text-lg font-semibold truncate">
            Transactions for{" "}
            <span className="font-bold text-yellow-200">
              {patient?.patientName}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenNewModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/50 text-white rounded-lg transition text-sm"
            >
              <Plus size={16} /> New Transaction
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Summary */}
        {/* ... (Summary remains the same) */}
        <div className="grid grid-cols-3 gap-4 p-5 bg-mint-50 border-b border-mint-200 text-center">
          <div>
            <p className="text-xs text-green-700 uppercase">Total Paid</p>
            <p className="text-xl font-bold text-[var(--theme-color)]">
              ₱{summary.totalPaid.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-700 uppercase">Remaining</p>
            <p className="text-xl font-bold text-yellow-600">
              ₱{summary.totalRemaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-700 uppercase">Transactions</p>
            <p className="text-xl font-bold text-green-500">
              {transactions.length}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          {loading ? (
            <p className="text-center text-[var(--theme-color)] py-8 animate-pulse">
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No transactions found.
            </p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((t) => (
                <li
                  key={t.$id}
                  className="p-4 bg-mint-50 border border-mint-200 rounded-xl hover:border-green-400 hover:bg-mint-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-green-700">
                        {t.serviceName || "Unnamed Service"}
                      </h3>
                      <p className="text-xs text-[var(--theme-color)]">
                        {t.paymentType || "Transaction"} —{" "}
                        {dayjs(t.dateTransact || t.$createdAt).format(
                          "MMM D, YYYY"
                        )}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {/* UPDATED: Call startDeleteProcess */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDeleteProcess(t); // Pass the entire transaction object
                        }}
                        className="p-1 text-red-500 hover:text-red-700 transition"
                        aria-label="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                      {/* END UPDATED */}
                      <div>
                        <p className="font-bold text-lg text-[var(--theme-color)]">
                          ₱{Number(t.paid || 0).toLocaleString()}
                        </p>
                        {t.remaining > 0 ? (
                          <p className="text-xs text-green-700">
                            Remaining: ₱{Number(t.remaining).toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-xs text-green-500">
                            (PAID) Remaining: ₱
                            {Number(t.remaining).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Installment View Button */}
                  {t.paymentType === "installment" && (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => setSelectedInstallment(t)}
                        className="text-sm text-[var(--theme-color)] hover:underline"
                      >
                        View Installments
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {/* ... (Footer remains the same) */}
        <div className="border-t border-mint-200 p-4 bg-mint-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/50 text-white transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* New Transaction Modal */}
      {openNewModal && (
        <NewTransactionModal
          patient={patient}
          onClose={() => setOpenNewModal(false)}
          onSaved={fetchTransactions}
          mainTransactionId={patient?.$id}
        />
      )}

      {selectedInstallment && (
        <InstallmentsModal
          transaction={selectedInstallment}
          onClose={() => setSelectedInstallment(null)}
        />
      )}

      {/* NEW: Confirmation Dialog Render */}
      <ConfirmationDialog
        transaction={transactionToDelete}
        onConfirm={executeDeleteTransaction}
        onCancel={() => setTransactionToDelete(null)}
      />
      {/* END NEW */}
    </div>
  );
}