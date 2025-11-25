"use client";

import { useEffect, useState } from "react";
import { databases, ID } from "../../lib/appwrite";
import { Query } from "appwrite";
import { X, Plus, Trash2 } from "lucide-react"; // Import Trash2
import dayjs from "dayjs";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_INSTALLMENTS = "installments";
const COLLECTION_TRANSACTIONS = "transactions";

// Helper function to get the current date/time in the format required by datetime-local input
const getCurrentDateTime = () => dayjs().format("YYYY-MM-DDTHH:mm");

export default function InstallmentsModal({ transaction, onClose }) {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  // State for tracking deletion status
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    note: "",
    dateTransact: getCurrentDateTime(),
  });

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        [
          Query.equal("transactionId", transaction.$id),
          Query.orderDesc("$createdAt"),
        ]
      );
      setInstallments(res.documents);
    } catch (err) {
      console.error("Error fetching installments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transaction?.$id) {
      fetchInstallments();
    }
  }, [transaction]);

  // Compute remaining balance
  const totalPaid = installments.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0
  );
  const remaining = Math.max(transaction.totalAmount - totalPaid, 0);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date change
  const handleDateChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, dateTransact: value }));
  };

  // 1. New function: Handle installment deletion
  const handleDeleteInstallment = async (installment) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this payment of ₱${Number(
          installment.amount
        ).toLocaleString()}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(installment.$id);

      // 1. Delete the installment document from Appwrite
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        installment.$id
      );

      // 2. Recalculate new total paid and remaining
      const deletedAmount = Number(installment.amount);
      const newTotalPaid = totalPaid - deletedAmount;
      const newRemaining = Math.max(transaction.totalAmount - newTotalPaid, 0);

      // 3. Update main transaction record
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transaction.$id,
        {
          paid: newTotalPaid,
          remaining: newRemaining,
          status: newRemaining <= 0 ? "paid" : "ongoing",
        }
      );

      // 4. Reset deleting state and refresh data
      setDeletingId(null);
      await fetchInstallments();
    } catch (err) {
      console.error("Error deleting installment:", err);
      setDeletingId(null);
    }
  };

  // Handle new payment submit (Existing logic, ensure it remains correct)
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    const newPaid = Number(form.amount);
    // Recalculate remaining based on the *current* totalPaid before the addition
    const newRemaining = Math.max(
      transaction.totalAmount - (totalPaid + newPaid),
      0
    );

    try {
      setAdding(true);
      // Save to installments table
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_INSTALLMENTS,
        ID.unique(),
        {
          transactionId: transaction.$id,
          amount: newPaid,
          dateTransact: form.dateTransact,
          remaining: newRemaining,
          serviceName: transaction.serviceName,
          note: form.note,
          patientName: transaction.patientName,
        }
      );

      // Update main transaction record (use the newly calculated values)
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        transaction.$id,
        {
          paid: totalPaid + newPaid,
          remaining: newRemaining,
          status: newRemaining <= 0 ? "paid" : "ongoing",
        }
      );

      // Reset form and refresh data
      setForm({ amount: "", note: "", dateTransact: getCurrentDateTime() });
      await fetchInstallments();
    } catch (err) {
      console.error("Error adding installment:", err);
    } finally {
      setAdding(false);
    }
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex justify-center items-center">
      <div className=" bg-white w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden h-[70vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-[var(--theme-color)]">
            Installments for {transaction.serviceName}
          </h2>
          <button
            onClick={onClose}
            className=" hover:text-bg-white text-[var(--theme-color)]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 text-center border-b border-gray-300 p-3 bg-base-100 dark:bg-gray-800">
          <div>
            <p className="text-xs text-gray-400 uppercase">Total</p>
            <p className="text-sm font-semibold text-green-300">
              ₱{Number(transaction.totalAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Paid</p>
            <p className="text-sm font-semibold text-bg-white text-[var(--theme-color)]">
              ₱{totalPaid.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Remaining</p>
            <p className="text-sm font-semibold text-red-400">
              ₱{remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* List */}
        <div className="p-5 max-h-[30vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400">Loading installments...</p>
          ) : installments.length === 0 ? (
            <p className="text-center text-gray-400">
              No installment records yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {installments.map((i) => (
                <li
                  key={i.$id}
                  className="bg-base-200 dark:bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-bg-white text-[var(--theme-color)] transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[var(--theme-color)]">
                        ₱{Number(i.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dayjs(i.dateTransact).format("MMM D, YYYY: hh:mm A")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {i.remaining !== undefined && (
                        <p className="text-xs text-red-400">
                          Remaining: ₱{Number(i.remaining).toLocaleString()}
                        </p>
                      )}
                      {/* 2. Add Delete Button */}
                      <button
                        onClick={() => handleDeleteInstallment(i)}
                        disabled={deletingId === i.$id}
                        title="Delete Installment"
                        className="p-1 rounded-full text-red-500 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === i.$id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  {i.note && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {i.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Payment Form */}
        {remaining > 0 ? (
          <div className="border-t border-gray-700 p-4">
            <form onSubmit={handleAddPayment} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  name="amount"
                  placeholder="Enter payment amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="border border-bg-white text-[var(--theme-color)] bg-transparent rounded-lg px-3 py-2 w-full focus:border-bg-white "
                  required
                  min="0"
                  max={remaining}
                />
                <input
                  type="datetime-local"
                  name="dateTransact"
                  placeholder="Select payment date"
                  value={form.dateTransact}
                  onChange={handleDateChange}
                  className="border border-bg-white text-[var(--theme-color)] bg-transparent rounded-lg px-3 py-2 w-full focus:border-bg-white "
                  required
                />
                <button
                  type="submit"
                  disabled={adding}
                  className="flex items-center gap-1 bg-[var(--theme-color)] hover:bg-bg-white text-white px-3 py-2 rounded-lg transition"
                >
                  <Plus size={16} /> {adding ? "Adding..." : "Add"}
                </button>
              </div>
              <textarea
                name="note"
                placeholder="Optional note"
                value={form.note}
                onChange={handleChange}
                className="border border-bg-white text-[var(--theme-color)] bg-transparent rounded-lg px-3 py-2 text-sm focus:border-bg-white "
              ></textarea>
            </form>
          </div>
        ) : (
          <p className="border-t border-gray-700 bg-transparent px-3 py-3 text-sm text-center text-bg-white text-[var(--theme-color)]">
            ✅ Payment Completed
          </p>
        )}
      </div>
    </div>
  );
}
