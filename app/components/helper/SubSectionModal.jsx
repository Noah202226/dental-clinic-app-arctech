"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesStore } from "../../stores/useNotesStore";
import { useMedicalHistoryStore } from "../../stores/useMedicalHistoryStore";
import { useTreatmentPlanStore } from "../../stores/useTreatmentPlanStore";

const sectionMap = {
  notes: useNotesStore,
  medicalhistory: useMedicalHistoryStore,
  treatmentplans: useTreatmentPlanStore,
};

export default function SubSectionModal({
  title,
  collectionId,
  patientId,
  onClose,
}) {
  const useStore = sectionMap[collectionId];
  const { items, fetchItems, addItem, deleteItem, updateItem, loading } =
    useStore();

  // Form states
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchItems(patientId);
  }, [patientId, fetchItems]);

  // Reset form based on section type
  useEffect(() => {
    switch (collectionId) {
      case "medicalhistory":
        setForm({
          medicalName: "",
          description: "",
          diagnosisDate: "",
          severity: "",
          status: "",
        });
        break;
      case "treatmentplans":
        setForm({
          treatmentNote: "",
          treatmentDate: "",
        });
        break;
      default:
        setForm({ name: "", description: "" });
    }
  }, [collectionId]);

  // Add / Update logic
  const handleAddOrUpdate = async () => {
    setAdding(true);
    try {
      if (editingId) {
        await updateItem(editingId, form);
      } else {
        await addItem(patientId, form);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save record");
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    switch (collectionId) {
      case "medicalhistory":
        setForm({
          medicalName: "",
          description: "",
          diagnosisDate: "",
          severity: "",
          status: "",
        });
        break;
      case "treatmentplans":
        setForm({
          treatmentNote: "",
          treatmentDate: "",
        });
        break;
      default:
        setForm({ name: "", description: "" });
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.$id);
    setForm({ ...item });
  };

  return (
    <dialog open className="modal modal-open z-[1000]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-box max-w-lg bg-white text-[#1E2B1F] shadow-xl border border-[#DCD1B4] rounded-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[#E6D8BA] pb-3 mb-3">
            <h3 className="font-bold text-lg text-[#1E2B1F]">
              {title} {editingId && "(Editing)"}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-sm bg-transparent text-[#1E2B1F] hover:bg-[#E6D8BA]"
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-[#EDE6D2] h-16 rounded-lg"
                />
              ))
            ) : items.length > 0 ? (
              items.map((i) => (
                <div
                  key={i.$id}
                  className="bg-[#EDE6D2] p-3 rounded-lg flex justify-between items-start shadow-sm"
                >
                  <div>
                    <h4 className="font-semibold text-[#1E2B1F]">
                      {i.name || i.medicalName || i.treatmentNote}
                    </h4>
                    {/* <p className="text-sm text-[#4A4A4A] opacity-90">
                      {i.description ||
                        i.status ||
                        (i.treatmentDate
                          ? new Date(i.treatmentDate).toLocaleString()
                          : "")}
                    </p> */}
                    <pre className="text-sm text-[#4A4A4A] opacity-90">
                      {i.description ||
                        i.status ||
                        (i.treatmentDate
                          ? new Date(i.treatmentDate).toLocaleString()
                          : "")}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-xs bg-[#56C596] text-white hover:bg-[#4BAE85]"
                      onClick={() => handleEdit(i)}
                      disabled={adding || loading}
                    >
                      ✎
                    </button>
                    <button
                      className="btn btn-xs bg-[#E86D6D] text-white hover:bg-[#d65a5a]"
                      onClick={() => deleteItem(i.$id)}
                      disabled={adding || loading}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No records found.
              </p>
            )}
          </div>

          {/* 🧾 Dynamic Form */}
          <div className="space-y-2">
            {collectionId === "medicalhistory" && (
              <>
                <input
                  type="text"
                  placeholder="Medical Name"
                  value={form.medicalName || ""}
                  onChange={(e) =>
                    setForm({ ...form, medicalName: e.target.value })
                  }
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <textarea
                  placeholder="Description"
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="textarea w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <input
                  type="date"
                  value={form.diagnosisDate || new Date()}
                  onChange={(e) =>
                    setForm({ ...form, diagnosisDate: e.target.value })
                  }
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <input
                  type="text"
                  placeholder="Severity"
                  value={form.severity || ""}
                  onChange={(e) =>
                    setForm({ ...form, severity: e.target.value })
                  }
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <input
                  type="text"
                  placeholder="Status"
                  value={form.status || ""}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
              </>
            )}

            {collectionId === "treatmentplans" && (
              <>
                <input
                  type="text"
                  placeholder="Treatment Note"
                  value={form.treatmentNote || ""}
                  onChange={(e) =>
                    setForm({ ...form, treatmentNote: e.target.value })
                  }
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <input
                  type="datetime-local"
                  value={form.treatmentDate || new Date()}
                  onChange={(e) =>
                    setForm({ ...form, treatmentDate: e.target.value })
                  }
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
              </>
            )}

            {collectionId === "notes" && (
              <>
                <input
                  type="text"
                  placeholder="Name / Title"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
                <textarea
                  placeholder="Description / Content"
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="textarea w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-action flex justify-between">
            <button
              onClick={handleAddOrUpdate}
              disabled={adding || loading}
              className="btn border-0 text-white bg-gradient-to-r from-[#A8E6CF] to-[#56C596]"
            >
              {editingId
                ? adding
                  ? "Saving..."
                  : "Update"
                : adding
                ? "Adding..."
                : "Add"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="btn bg-[#E6D8BA] text-[#1E2B1F]"
                disabled={adding}
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              className="btn bg-[#E6D8BA] text-[#1E2B1F]"
              disabled={adding || loading}
            >
              Close
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
