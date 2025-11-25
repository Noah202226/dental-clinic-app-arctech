"use client";

import { useState, useEffect } from "react";
import { databases, ID } from "../../lib/appwrite";
import { X } from "lucide-react";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_TRANSACTIONS = "transactions";
const COLLECTION_SERVICES = "services";
const COLLECTION_INSTALLMENTS = "installments";

export default function NewTransactionModal({ patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    serviceId: "",
    serviceName: "",
    servicePrice: 0,
    totalAmount: "",
    paymentType: "",
    initialPay: "",
  });

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Load available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_SERVICES
        );
        setServices(res.documents);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };
    fetchServices();
  }, []);

  // 🔹 Handle service select
  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    const selectedService = services.find((s) => s.$id === selectedId);

    setForm((prev) => ({
      ...prev,
      serviceId: selectedService?.$id || "",
      serviceName: selectedService?.serviceName || "",
      servicePrice: selectedService?.servicePrice || 0,
      totalAmount: selectedService?.servicePrice || "",
    }));
  };

  // 🔹 Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Compute remaining balance
  const remainingBalance =
    form.paymentType === "installment"
      ? Math.max(form.servicePrice - Number(form.initialPay || 0), 0)
      : 0;

  // 🔹 Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paidAmount =
        form.paymentType === "installment"
          ? Number(form.initialPay)
          : Number(form.totalAmount);

      const statusValue =
        paidAmount >= form.servicePrice
          ? "paid"
          : form.paymentType === "installment"
          ? "ongoing"
          : "unpaid";

      // 🔹 1️⃣ Create main transaction record
      const transactionRes = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_TRANSACTIONS,
        ID.unique(),
        {
          patientId: patient.$id,
          patientName: patient.patientName,
          serviceId: form.serviceId,
          serviceName: form.serviceName,
          totalAmount: Number(form.servicePrice),
          paymentType: form.paymentType,
          paid: paidAmount,
          status: statusValue,
          remaining: remainingBalance,
        }
      );

      // 🔹 2️⃣ If installment, add initial payment record
      if (form.paymentType === "installment" && Number(form.initialPay) > 0) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_INSTALLMENTS,
          ID.unique(),
          {
            transactionId: transactionRes.$id,
            amount: Number(form.initialPay),
            dateTransact: new Date().toISOString(),
            patientId: patient.$id,
            patientName: patient.patientName,
            serviceName: form.serviceName,
            remaining: Number(form.servicePrice) - Number(form.initialPay),
            note: "Initial payment",
          }
        );
      }

      // ✅ Reset form after save
      setForm({
        serviceId: "",
        serviceName: "",
        servicePrice: 0,
        totalAmount: "",
        paymentType: "",
        initialPay: "",
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Error creating transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex justify-center items-center p-5">
      <div className="bg-white w-full max-w-xl p-8 rounded-2xl h-full shadow-2xl border border-gray-700 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-[var(--theme-color)]">
            New Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[var(--theme-color)]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 ">
          {/* Service selection */}
          <div>
            <label className="block text-sm mb-1 font-medium text-[var(--theme-color)]">
              Service
            </label>
            <select
              name="serviceId"
              value={form.serviceId}
              onChange={handleServiceChange}
              className="border border-gray-600 bg-transparent rounded-lg px-3 py-2 w-full focus:border-[var(--theme-color)]"
              required
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.$id} value={s.$id}>
                  {s.serviceName} - ₱{s.servicePrice}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          {form.servicePrice > 0 && (
            <div className="text-sm text-gray-400">
              Service Price:{" "}
              <span className="font-semibold text-green-300">
                ₱{Number(form.servicePrice).toLocaleString()}
              </span>
            </div>
          )}

          {/* Payment Type */}
          <div>
            <label className="block text-sm mb-1 font-medium text-[var(--theme-color)]">
              Payment Type
            </label>
            <select
              name="paymentType"
              value={form.paymentType}
              onChange={handleChange}
              className="border border-gray-600 bg-transparent rounded-lg px-3 py-2 w-full focus:border-[var(--theme-color)]"
              required
            >
              <option value="">Select type</option>
              <option value="full">Full Payment</option>
              <option value="installment">Installment</option>
            </select>
          </div>

          {/* Initial Payment */}
          {form.paymentType === "installment" && (
            <>
              <div>
                <label className="block text-sm mb-1 font-medium text-[var(--theme-color)]">
                  Initial Payment (₱)
                </label>
                <input
                  type="number"
                  name="initialPay"
                  value={form.initialPay || ""}
                  onChange={handleChange}
                  placeholder="Enter initial amount"
                  className="border border-gray-600 bg-transparent rounded-lg px-3 py-2 w-full focus:border-[var(--theme-color)]"
                  required
                />
              </div>

              <div className="text-sm text-gray-400 mt-1">
                Remaining Balance:{" "}
                <span className="font-semibold text-mint-400">
                  ₱{remainingBalance.toLocaleString()}
                </span>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 rounded-lg text-white transition"
            >
              {loading ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
