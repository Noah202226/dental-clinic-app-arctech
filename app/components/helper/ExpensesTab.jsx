"use client";

import { useEffect, useState, useMemo } from "react";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";

export default function ExpensesTab() {
  const { expenses, fetchAllPayments, deleteExpense, addExpense, loading } =
    useTransactionsStore();

  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "",
    amount: "",
    dateSpent: "",
  });

  // Fetch data
  useEffect(() => {
    fetchAllPayments();
  }, []);

  // Derived summary data
  const { totalExpenses, categoryTotals } = useMemo(() => {
    const total = expenses.reduce(
      (acc, exp) => acc + parseFloat(exp.amount || 0),
      0
    );
    const byCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {});
    return { totalExpenses: total, categoryTotals: byCategory };
  }, [expenses]);

  // Add new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) {
      return alert("Please fill in all required fields.");
    }

    await addExpense({
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      dateSpent: newExpense.dateSpent || new Date().toISOString(),
    });

    setShowModal(false);
    setNewExpense({ title: "", category: "", amount: "", dateSpent: "" });
  };

  // Confirm delete
  const confirmDelete = (exp) => {
    setExpenseToDelete(exp);
    setShowConfirm(true);
  };

  // Handle delete
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    await deleteExpense(expenseToDelete.$id);
    setIsDeleting(false);
    setShowConfirm(false);
    setExpenseToDelete(null);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-color)]" />
        <span className="ml-2 text-gray-600">Loading expenses...</span>
      </div>
    );

  return (
    <div className="mt-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--theme-color)]">
          Expenses
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 hover:cursor-pointer text-white px-3 py-2 rounded-lg shadow transition"
        >
          <PlusCircle size={18} /> Add Expense
        </button>
      </div>

      {/* 💰 Summary Section */}
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-md font-semibold text-[var(--theme-color)] mb-3">
          Expense Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col bg-green-50 p-4 rounded-xl">
            <span className="text-sm text-gray-600">Total Expenses</span>
            <span className="text-2xl font-bold text-[var(--theme-color)]">
              ₱
              {totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex flex-col bg-green-50 p-4 rounded-xl">
            <span className="text-sm text-gray-600">By Category</span>
            <div className="text-sm text-gray-700 mt-1 space-y-1">
              {Object.keys(categoryTotals).length > 0 ? (
                Object.entries(categoryTotals).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between">
                    <span>{cat}</span>
                    <span className="font-medium">₱{amt.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic">No category data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-2xl shadow-md overflow-hidden">
          <thead className="bg-mint-600 text-white">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((exp) => (
                <tr key={exp.$id} className="border-b hover:bg-mint-50">
                  <td className="p-3">{exp.title}</td>
                  <td className="p-3">{exp.category || "—"}</td>
                  <td className="p-3 text-right font-medium">
                    ₱{parseFloat(exp.amount).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {new Date(exp.dateSpent).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => confirmDelete(exp)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile Card Layout */}
      <div className="md:hidden grid gap-4">
        {expenses.length > 0 ? (
          expenses.map((exp) => (
            <div
              key={exp.$id}
              className="bg-white rounded-2xl shadow p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800">{exp.title}</p>
                <p className="text-sm text-gray-500">
                  {exp.category || "—"} •{" "}
                  {new Date(exp.dateSpent).toLocaleDateString()}
                </p>
                <p className="text-[var(--theme-color)] font-medium">
                  ₱{parseFloat(exp.amount).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => confirmDelete(exp)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">
            No expenses recorded yet.
          </p>
        )}
      </div>

      {/* ✨ Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--theme-color)] mb-4">
              Add New Expense
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Title *</label>
                <input
                  type="text"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="input input-bordered text-white w-full border-green-300"
                  placeholder="e.g. Dental Supplies"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <input
                  type="text"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                  className="input input-bordered text-white w-full border-green-300"
                  placeholder="e.g. Equipment, Utilities, etc."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="input input-bordered text-white w-full border-green-300"
                  placeholder="₱0.00"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="date"
                  value={newExpense.dateSpent}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, dateSpent: e.target.value })
                  }
                  className="input input-bordered text-white w-full border-green-300"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-[var(--theme-color)] text-white rounded-lg shadow"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🧾 Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Expense
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-medium text-red-500">
                {expenseToDelete?.title}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow flex items-center gap-2"
              >
                {isDeleting && (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
