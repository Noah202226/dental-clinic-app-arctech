"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import clsx from "clsx";
import ExpensesTab from "../helper/ExpensesTab";

export default function ReportsAnalytics() {
  const {
    transactions,
    installments,
    fetchAllPayments,
    deletePayment,
    loading,
    expenses,
  } = useTransactionsStore();

  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activeTab, setActiveTab] = useState("Sales");

  useEffect(() => {
    fetchAllPayments(); // fetch all transactions + installments
  }, [fetchAllPayments]);

  // --- 1. Map Installment Payments to Original Transaction ID ---
  const paymentsByTransactionId = useMemo(() => {
    const map = new Map();
    installments.forEach((i) => {
      // ASSUMPTION: 'i.originalTransactionId' links the installment payment to the original sale in 'transactions'
      const key = i.originalTransactionId || i.transactionId; // Use transactionId if originalTransactionId is not present
      const amount = parseFloat(i.amount || 0);
      if (map.has(key)) {
        map.set(key, map.get(key) + amount);
      } else {
        map.set(key, amount);
      }
    });
    return map;
  }, [installments]);

  // --- 2. Sales Transactions (Original sales only: Full and Installment Plans) ---
  const salesTransactions = useMemo(() => {
    return transactions
      .map((t) => {
        // ASSUMPTION: t.paymentType exists in 'transactions' and is 'installment' or 'full'
        const isInstallmentPlan = t.paymentType === "installment";

        // This calculates the TOTAL PAID across all installments for a plan
        const totalPaid =
          t.paid + (paymentsByTransactionId.get(t.$id) || 0) - (t.paid || 0);

        const originalAmount = parseFloat(t.totalAmount || 0);
        const remainingBalance = isInstallmentPlan
          ? originalAmount - totalPaid
          : 0;

        return {
          id: t.$id,
          // Adjusted type to match previous data structure, but uses paymentType from transaction
          type:
            t.paymentType === "installment"
              ? "Installment Plan"
              : "Full Payment",
          amount: originalAmount, // The full price of the original sale
          date: new Date(t.$createdAt),
          patientId: t.patientId || "N/A",
          patientName: t.patientName,
          totalPaid: isInstallmentPlan ? totalPaid : originalAmount,
          remainingBalance: remainingBalance,
        };
      })
      .filter((t) => {
        // Filter by date range on the *original sale date*
        if (!dateRange.from && !dateRange.to) return true;
        const date = t.date.getTime();
        const from = dateRange.from
          ? new Date(dateRange.from).getTime()
          : -Infinity;
        const to = dateRange.to ? new Date(dateRange.to).getTime() : Infinity;
        return date >= from && date <= to;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // newest first
  }, [transactions, paymentsByTransactionId, dateRange]);

  // --- 3. All Individual Payments (Full Payments + Installment Payments) ---
  // THIS IS THE DATA SOURCE THAT WILL BE USED FOR THE TABLE VIEW
  const allIndividualPayments = useMemo(() => {
    const combined = [
      // Map original 'Full' transactions as single payments
      ...transactions
        .filter((t) => t.paymentType !== "installment") // Use paymentType for filter
        .map((t) => ({
          id: t.$id,
          type: "Full",
          amount: parseFloat(t.totalAmount || 0),
          date: new Date(t.$createdAt),
          patientName: t.patientName, // ADDED
          remaining: 0, // Full payment means 0 remaining
          originalTransactionId: t.$id, // ADDED for consistency
        })),
      // Map installment payments
      ...installments.map((i) => ({
        id: i.$id,
        type: "Installment",
        amount: parseFloat(i.amount || 0),
        date: new Date(i.dateTransact || i.$createdAt),
        patientName: i.patientName, // ADDED
        remaining: parseFloat(i.remaining || 0), // ADDED (Remaining balance after this specific payment)
        originalTransactionId: i.transactionId, // ADDED
      })),
    ]; // Filter by date range on the *payment date*

    return combined
      .filter((p) => {
        if (!dateRange.from && !dateRange.to) return true;
        const date = p.date.getTime();
        const from = dateRange.from
          ? new Date(dateRange.from).getTime()
          : -Infinity;
        const to = dateRange.to ? new Date(dateRange.to).getTime() : Infinity;
        return date >= from && date <= to;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // newest first
  }, [transactions, installments, dateRange]);

  // 📊 Calculations (Using the filtered data)
  // Total money collected in the selected date range (Cash Flow)
  const totalCashReceived = allIndividualPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  // Total of individual installment payments collected in the date range
  const totalInstallmentPayments = allIndividualPayments
    .filter((p) => p.type === "Installment")
    .reduce((sum, p) => sum + p.amount, 0);

  // Total of full payments collected in the date range
  const totalFullPaymentsReceived =
    totalCashReceived - totalInstallmentPayments;

  // Total value of all sales/services rendered (True Revenue, uses original sales)
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = expenses.reduce(
    (s, ex) => s + parseFloat(ex.amount || 0),
    0
  );

  // Net Revenue is calculated from actual cash collected minus expenses
  const netRevenue = totalCashReceived - totalExpenses;

  // 🗑️ Delete handler with confirmation
  const handleDelete = (payment) => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${payment.type.toLowerCase()} transaction?`
      )
    ) {
      deletePayment(payment.id, payment.type);
    }
  };

  // 📄 Export PDF Function (Uses salesTransactions for structured reporting)
  const handleExportPDF = async () => {
    try {
      // dynamic import (safe for Next.js client-side only)
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const autoTableFn = autoTableModule?.default ?? autoTableModule;

      const callAutoTable = (options) => {
        // 1) if the module exported a function: autoTable(doc, opts)
        if (typeof autoTableFn === "function") {
          autoTableFn(doc, options);
          return true;
        }
        // 2) if plugin patched doc.autoTable
        if (typeof doc.autoTable === "function") {
          doc.autoTable(options);
          return true;
        }

        return false;
      };

      // header
      doc.setFontSize(16);
      doc.text("Senoto Dental Care Reports & Analytics", 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Report Type: ${activeTab} | Generated: ${new Date().toLocaleString()}`,
        14,
        22
      );

      // build table depending on activeTab (Sales uses salesTransactions with balance)
      if (activeTab === "Sales") {
        const head = [
          [
            "Date",
            "Patient Name",
            "Type",
            "Original Amount",
            "Total Paid",
            "Remaining Balance",
          ],
        ];
        // NOTE: PDF Export for Sales uses salesTransactions (Original Sale Records) for clean financial reporting
        const body = salesTransactions.map((p) => [
          p.date.toLocaleDateString(),
          p.patientName ?? "N/A",
          p.type,
          `₱${p.amount.toLocaleString()}`,
          `₱${p.totalPaid.toLocaleString()}`,
          p.type === "Full Payment"
            ? "—"
            : `₱${p.remainingBalance.toLocaleString()}`,
        ]);

        const ok = callAutoTable({
          head,
          body,
          startY: 30,
          theme: "striped",
          headStyles: { fillColor: [34, 197, 94] }, // mint/green head
        });

        if (!ok) throw new Error("AutoTable plugin not available");

        // add summary under table
        const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Summary", 14, y);
        doc.setFontSize(10);
        doc.text(
          `Total Sales Value (Revenue): ₱${totalSales.toLocaleString()}`,
          14,
          y + 7
        );
        doc.text(
          `Total Cash Collected: ₱${totalCashReceived.toLocaleString()}`,
          14,
          y + 14
        );
        doc.text(
          `Installment Payments Collected: ₱${totalInstallmentPayments.toLocaleString()}`,
          14,
          y + 21
        );
        doc.text(`Net Revenue: ₱${netRevenue.toLocaleString()}`, 14, y + 28);
      } else {
        // Expenses tab
        const head = [["Title", "Category", "Amount", "Date"]];
        const body = expenses.map((e) => [
          e.title || "—",
          e.category || "—",
          `${parseFloat(e.amount || 0).toLocaleString()}`,
          e.dateSpent ? new Date(e.dateSpent).toLocaleDateString() : "—",
        ]);

        const ok = callAutoTable({
          head,
          body,
          startY: 30,
          theme: "striped",
          headStyles: { fillColor: [34, 197, 94] },
        });

        if (!ok) throw new Error("AutoTable plugin not available");

        const totalExpenses = expenses.reduce(
          (s, ex) => s + parseFloat(ex.amount || 0),
          0
        );
        const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 30;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Expenses: ₱${totalExpenses.toLocaleString()}`, 14, y);
      }

      // footer
      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(
        `Generated by Senoto Dental Care • ${new Date().getFullYear()}`,
        14,
        290
      );

      // save
      const safeDate = new Date().toISOString().slice(0, 10);
      doc.save(`Senoto Dental Care_${activeTab}_Report_${safeDate}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. See console for details.");
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[var(--theme-color)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-color)]">
            Reports & Analytics
          </h1>
          <p className="text-gray-500">
            View and filter all financial transactions.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 text-white text-xs md:text-sm px-4 py-2 rounded-lg shadow transition"
        >
          <FiDownload /> Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-green-200/50">
        {["Sales", "Expenses"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 font-semibold rounded-t-md transition",
              activeTab === tab
                ? "bg-[var(--theme-color)] text-white"
                : "text-[var(--theme-color)]/80 hover:bg-green-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card border border-green-300/40 p-6 shadow-sm rounded-2xl bg-white">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2">
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                className="input input-bordered input-sm w-full bg-white border-green-300"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                className="input input-bordered input-sm w-full bg-white border-green-300"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing:{" "}
            <span className="font-semibold text-[var(--theme-color)]/80">
              {loading ? "Loading..." : "Sales " + allIndividualPayments.length}{" "}
              {/* Using cash flow length */}
            </span>{" "}
            <span className="font-semibold text-red-600">
              {loading ? "Loading..." : "Expense " + expenses.length}
            </span>{" "}
            records
          </div>
        </div>
      </div>

      {/* Sales Tab */}
      {activeTab === "Sales" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat bg-white border border-green-300/40 rounded-xl p-5 shadow-sm">
              <div className="stat-title text-gray-600">
                Total Cash Collected
              </div>
              <div className="stat-value text-[var(--theme-color)]/80 text-2xl font-bold">
                ₱{totalCashReceived.toLocaleString()}
              </div>
            </div>

            <div className="stat bg-white border border-green-300/40 rounded-xl p-5 shadow-sm">
              <div className="stat-title text-gray-600">
                Full Payments Received
              </div>
              <div className="stat-value text-[var(--theme-color)] text-2xl font-bold">
                ₱{totalFullPaymentsReceived.toLocaleString()}
              </div>
            </div>

            <div className="stat bg-white border border-green-300/40 rounded-xl p-5 shadow-sm">
              <div className="stat-title text-gray-600">
                Installment Payments
              </div>
              <div className="stat-value text-emerald-500 text-2xl font-bold">
                ₱{totalInstallmentPayments.toLocaleString()}
              </div>
            </div>

            <div className="stat bg-white border border-green-300/40 rounded-xl p-5 shadow-sm">
              <div className="stat-title text-gray-600">Net Revenue</div>
              <div className="stat-value text-mint-600 text-2xl font-bold">
                ₱{netRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Transactions Table - NOW SHOWS INDIVIDUAL PAYMENTS */}
          {allIndividualPayments.length > 0 ? (
            <div className="card border border-green-300/40 shadow-sm rounded-xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table">
                  <thead className="bg-white text-[var(--theme-color)]">
                    <tr>
                      <th>Date</th>
                      <th>Patient Name</th>
                      <th>Type</th>
                      <th>Amount Paid</th>
                      <th>Remaining Balance</th>
                      {/* <th className="text-center">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--theme-color)]/70">
                    {allIndividualPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-green-50 transition text-gray-800"
                      >
                        <td>{p.date.toLocaleString()}</td>
                        <td>{p.patientName}</td>
                        <td>
                          <span
                            className={clsx(
                              "px-2 py-1 rounded-full text-xs font-semibold",
                              p.type === "Full"
                                ? "bg-green-100 text-[var(--theme-color)]"
                                : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {p.type === "Full" ? "Full Payment" : "Installment"}
                          </span>
                        </td>
                        <td className="font-medium text-200-600">
                          ₱{p.amount.toLocaleString()}{" "}
                          {/* Individual payment amount */}
                        </td>
                        <td
                          className={clsx(
                            "font-semibold",
                            (p.remaining || 0) > 0
                              ? "text-red-500"
                              : "text-gray-500" // Use 'p.remaining' from installment
                          )}
                        >
                          {p.type === "Full"
                            ? "—"
                            : `₱${(p.remaining || 0).toLocaleString()}`}
                        </td>
                        {/* <td className="text-center">
                          <button
                            onClick={() => handleDelete(p)}
                            className="text-red-500 hover:text-red-600 transition hover:cursor-pointer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout - UPDATED TO USE allIndividualPayments */}
              <div className="md:hidden space-y-4 p-4">
                {allIndividualPayments.map((p) => (
                  <div
                    key={p.id}
                    className="border border-green-200 bg-green-50/30 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={clsx(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          p.type === "Full"
                            ? "bg-green-100 text-[var(--theme-color)]"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {p.type === "Full" ? "Full Payment" : "Installment"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {p.date.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[var(--theme-color)] font-semibold text-lg">
                      Amount Paid: ₱{p.amount.toLocaleString()}
                    </div>
                    {p.type === "Installment" && (
                      <div
                        className={clsx(
                          "text-sm font-semibold",
                          (p.remaining || 0) > 0
                            ? "text-red-500"
                            : "text-green-500"
                        )}
                      >
                        Remaining Balance: ₱
                        {(p.remaining || 0).toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mb-2">
                      Patient: {p.patientName}
                    </div>
                    {/* <button
                      onClick={() => handleDelete(p)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm"
                    >
                      <FiTrash2 /> Delete
                    </button> */}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-center text-gray-500 italic border border-green-200 p-6 rounded-lg">
                No payments found in this range.
              </div>
            )
          )}
        </>
      ) : (
        // Placeholder for Expenses
        <ExpensesTab />
      )}
    </div>
  );
}
