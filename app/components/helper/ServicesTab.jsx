"use client";

import { useEffect, useState } from "react";
import { useServicesStore } from "@/app/stores/useServicesStore";
import { Trash2, PlusCircle } from "lucide-react";

export default function ServicesTab() {
  const { services, fetchServices, addService, deleteService, loading } =
    useServicesStore();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    serviceName: "",
    serviceDescription: "",
    servicePrice: "",
  });

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.serviceName || !form.servicePrice) {
      return alert("Please fill in required fields.");
    }

    await addService(form);
    setShowModal(false);
    setForm({ serviceName: "", serviceDescription: "", servicePrice: "" });
  };

  if (loading)
    return (
      <p className="text-gray-500 text-center mt-4">Loading services...</p>
    );

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--theme-color)]">
          Services
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 hover:cursor-pointer text-white px-3 py-2 rounded-lg shadow transition"
        >
          <PlusCircle size={18} /> Add Service
        </button>
      </div>

      {/* 🧭 Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-2xl shadow-md overflow-hidden">
          <thead className="bg-[var(--theme-color)] text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map((srv) => (
                <tr key={srv.$id} className="border-b hover:bg-green-50">
                  <td className="p-3">{srv.serviceName}</td>
                  <td className="p-3">{srv.serviceDescription || "—"}</td>
                  <td className="p-3 text-right font-medium">
                    ₱{parseFloat(srv.servicePrice).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteService(srv.$id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No services added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile Card Layout */}
      <div className="md:hidden grid gap-4">
        {services.length > 0 ? (
          services.map((srv) => (
            <div
              key={srv.$id}
              className="bg-white rounded-2xl shadow p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800">{srv.serviceName}</p>
                <p className="text-sm text-gray-500">
                  {srv.serviceDescription || "—"}
                </p>
                <p className="text-[var(--theme-color)] font-medium">
                  ₱{parseFloat(srv.servicePrice).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteService(srv.$id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">
            No services recorded yet.
          </p>
        )}
      </div>

      {/* ✨ Add Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--theme-color)] mb-4">
              Add New Service
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Service Name *</label>
                <input
                  type="text"
                  value={form.serviceName}
                  onChange={(e) =>
                    setForm({ ...form, serviceName: e.target.value })
                  }
                  className="input input-bordered w-full border-green-300 bg-white text-[var(--theme-color)]"
                  placeholder="e.g. Oral Surgery"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <input
                  type="text"
                  value={form.serviceDescription}
                  onChange={(e) =>
                    setForm({ ...form, serviceDescription: e.target.value })
                  }
                  className="input input-bordered w-full border-green-300 bg-white text-[var(--theme-color)]"
                  placeholder="e.g. Dental Service"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.servicePrice}
                  onChange={(e) =>
                    setForm({ ...form, servicePrice: e.target.value })
                  }
                  className="input input-bordered w-full bg-white text-[var(--theme-color)] border-green-300"
                  placeholder="₱0.00"
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
                  className="px-4 py-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 text-white rounded-lg shadow"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
