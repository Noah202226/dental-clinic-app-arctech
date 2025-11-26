"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesStore } from "../../stores/useNotesStore";
import { useMedicalHistoryStore } from "../../stores/useMedicalHistoryStore";
import { useTreatmentPlanStore } from "../../stores/useTreatmentPlanStore";
import { useDentalChartStore } from "@/app/stores/useDentalChartStore";
import toast from "react-hot-toast";
import ToothIcon from "./ToothIcon";

// Mapping for different sections to their respective stores
const sectionMap = {
  notes: useNotesStore,
  medicalhistory: useMedicalHistoryStore,
  treatmentplans: useTreatmentPlanStore,
  dentalchart: useDentalChartStore,
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

  // --- General States ---
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // --- Dental Chart States ---
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothDetails, setToothDetails] = useState({
    note: "",
  });
  const [selectedToothDocId, setSelectedToothDocId] = useState(null);

  // Define the 32 teeth in the standard 16-column format (Upper Left to Right, Lower Left to Right)
  const UPPER_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const LOWER_TEETH = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];
  const TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

  // --- Data Loading Effect ---
  useEffect(() => {
    fetchItems(patientId);
  }, [patientId, fetchItems]);

  // --- Form Initialization Effect ---
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

  // --- General Handlers ---
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
      toast.error("Failed to save record");
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

  // --- Dental Chart Handlers & Getters ---
  const getToothDetails = (toothNumber) => {
    if (!items || !Array.isArray(items)) return { status: "healthy", note: "" };

    const found = items.find(
      (x) => String(x.toothNumber) === String(toothNumber)
    );

    return {
      status: found?.status || "healthy",
      note: found?.note || "",
    };
  };

  const getSelectedToothDetails = (toothNumber) => {
    if (!items || !Array.isArray(items))
      return { status: "healthy", note: "", docId: null };

    const found = items.find(
      (x) => String(x.toothNumber) === String(toothNumber)
    );
    return {
      status: found?.status || "healthy",
      note: found?.note || "",
      docId: found?.$id || null,
    };
  };

  const updateToothStatus = async (status) => {
    if (!selectedTooth) return;

    await useDentalChartStore
      .getState()
      .updateTooth(patientId, selectedTooth, status, toothDetails.note);

    toast.success("Tooth updated");
    setSelectedTooth(null);
    setSelectedToothDocId(null); // Reset Doc ID
    setToothDetails({
      note: "",
    }); // Reset details
  };

  const handleDeleteTooth = async () => {
    if (!selectedToothDocId) {
      toast.error("No tooth record selected for deletion.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this tooth's record? This cannot be undone."
      )
    ) {
      await useDentalChartStore.getState().deleteTooth(selectedToothDocId);
      // Reset selected tooth and details after deletion
      setSelectedTooth(null);
      setSelectedToothDocId(null);
      setToothDetails({ note: "" });
    }
  };

  return (
    <dialog open className="modal modal-open z-[1000]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // 📌 WIDER & RESPONSIVE MODAL BOX
          // max-w-lg (default) -> max-w-md (sm) -> max-w-xl (md) -> max-w-3xl (lg)
          className="modal-box w-full max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 
                     bg-white text-[#1E2B1F] shadow-xl border border-[#DCD1B4] rounded-2xl"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center border-b border-[#E6D8BA] pb-3 mb-3">
            <h3 className="font-bold text-lg text-[#1E2B1F]">
              {title}
              {editingId && " (Editing)"}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-sm bg-transparent text-[#1E2B1F] hover:bg-[#E6D8BA]"
            >
              ✕
            </button>
          </div>

          {/* ------------------------- */}
          {/* 🦷 SPECIAL UI FOR DENTAL CHARTING */}
          {/* ------------------------- */}
          {collectionId === "dentalchart" ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Click a tooth to update its status
              </p>
              {/* START: SCROLLABLE WRAPPER */}
              {/* Use overflow-x-auto to enable horizontal scrolling on small screens */}
              <div className="overflow-x-auto p-1 -mx-2">
                {/* 📌 We use min-w-[500px] or min-w-[600px] to force the 16-column grid 
                   to maintain its width, enabling scroll on smaller screens. */}
                <div className="grid grid-cols-16 min-w-[600px] gap-x-3 sm:gap-x-4 md:gap-x-6 lg:gap-x-8 p-2 bg-[#FFF8EA] rounded-xl border border-[#DCD1B4] relative">
                  {/* Visual midline separator for upper/lower arches */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-[#DCD1B4]" />
                  {/* Visual midline separator for left/right sides */}
                  <div className="absolute top-0 bottom-0 left-[50%] w-px h-full bg-[#DCD1B4]" />

                  {TEETH.map((tooth) => {
                    const details = getToothDetails(tooth);
                    const status = details.status;
                    const hasNote = !!details.note;

                    return (
                      <button
                        key={tooth}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          const toothDetailsData =
                            getSelectedToothDetails(tooth);
                          setToothDetails({ note: toothDetailsData.note });
                          setSelectedToothDocId(toothDetailsData.docId);
                        }}
                        // 📌 Ensure height and width are optimized for this narrow column space
                        className={`h-14 w-full flex items-center justify-center p-0 border-0 bg-transparent relative 
                    transition-all duration-150 transform hover:scale-110 hover:opacity-90 hover:cursor-pointer 
                    ${
                      selectedTooth === tooth ? "z-10" : ""
                    } // Bring selected tooth to front
                   `}
                      >
                        <ToothIcon
                          status={status}
                          hasNote={hasNote}
                          toothNumber={tooth}
                          // 📌 PASS THE NEW PROP
                          isSelected={selectedTooth === tooth}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 🏆 NEW LEGEND / COLOR DETAILS SECTION */}
              <div className="mt-4 p-3 bg-white border border-[#DCD1B4] rounded-xl shadow-inner">
                <h4 className="text-sm font-semibold text-[#1E2B1F] mb-2">
                  Chart Legend
                </h4>

                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm">
                  {/* Healthy */}
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></span>
                    <span>Healthy</span>
                  </div>

                  {/* Caries */}
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>Caries</span>
                  </div>

                  {/* Filled */}
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span>Filled</span>
                  </div>

                  {/* Has Note (Blue Dot) */}
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </span>
                    <span>Has Note</span>
                  </div>

                  {/* Selected (Indigo Border) */}
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm border-2 border-indigo-600 bg-indigo-100"></span>
                    <span>Selected</span>
                  </div>
                </div>
              </div>
              {/* 🏆 END LEGEND SECTION */}

              {/* Update Tooth Panel */}
              {selectedTooth && (
                <div className="mt-4 bg-[#EDE6D2] p-3 rounded-xl">
                  <p className="font-semibold mb-2">
                    Update Tooth {selectedTooth}           
                  </p>
                  {/* 🏆 NEW: INSTRUCTION/LEGEND BLOCK - OPTIMIZED FOR MOBILE */}
                  <div className="mb-3 p-2 bg-white rounded-lg border border-[#DCD1B4]">
                    <h5 className="font-bold text-sm text-[#1E2B1F] mb-1">
                      How to Update Tooth Status:        
                    </h5>

                    {/* 📌 MODIFICATION: Use simpler dashes for list items and tighter spacing (space-y-0) */}

                    <ul className="text-[11px] sm:text-xs text-gray-700 space-y-0">
                      <li className="flex items-start">
                        <span className="mr-1 mt-[2px]">-</span>
                        **Save Note:** Type your note and click any status
                        button (**Healthy, Caries, or Filled**) to save both the
                        note and the status.
                      </li>

                      <li className="flex items-start">
                        <span className="mr-1 mt-[2px]">-</span>
                        **Mark Healthy:** Click **Healthy** to **clear** any
                        existing status and mark the tooth as healthy (no
                        damage).
                      </li>

                      <li className="flex items-start">
                        <span className="mr-1 mt-[2px]">-</span>
                        **Apply Status:** Click **Caries** or **Filled** to
                        apply that specific status to the tooth.            
                      </li>
                    </ul>
                  </div>
                  {/* 🏆 END INSTRUCTION BLOCK */}
                  {/* --- Tooth Note Field --- */}           
                  <div className="space-y-2 mb-3">
                    <label className="text-sm block text-gray-700">
                      Tooth Note:
                    </label>
                    <input
                      type="text"
                      className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                      value={toothDetails.note}
                      onChange={(e) =>
                        setToothDetails({
                          ...toothDetails,
                          note: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/* --- End Tooth Note Field --- */}
                  <div className="flex gap-2">
                    {/* 1. HEALTHY BUTTON */}
                    <button // 📌 MODERN STYLES: Shadow, rounded-lg, better hover effect
                      className="btn btn-sm bg-green-500 text-white shadow-md rounded-lg hover:bg-green-600 transition-all duration-150 flex items-center justify-center"
                      onClick={() => updateToothStatus("healthy")}
                    >
                      {/* 📌 RESPONSIVE TEXT/ICON */}
                      <span className="sm:hidden">✅</span>
                      {/* Icon for mobile */}
                      <span className="hidden sm:inline">Healthy</span>
                      {/* Text for desktop */}
                    </button>
                    {/* 2. CARIES BUTTON */}
                    <button // 📌 MODERN STYLES
                      className="btn btn-sm bg-red-500 text-white shadow-md rounded-lg hover:bg-red-600 transition-all duration-150 flex items-center justify-center"
                      onClick={() => updateToothStatus("caries")}
                    >
                      {/* 📌 RESPONSIVE TEXT/ICON */}
                      <span className="sm:hidden">⚠️</span>
                      {/* Icon for mobile */}
                      <span className="hidden sm:inline">Caries</span>
                      {/* Text for desktop */}
                    </button>
                    {/* 3. FILLED BUTTON */}
                    <button // 📌 MODERN STYLES
                      className="btn btn-sm bg-yellow-500 text-white shadow-md rounded-lg hover:bg-yellow-600 transition-all duration-150 flex items-center justify-center"
                      onClick={() => updateToothStatus("filled")}
                    >
                      {/* 📌 RESPONSIVE TEXT/ICON */}
                      <span className="sm:hidden">🛠️</span>
                      {/* Icon for mobile (square/fill) */}
                      <span className="hidden sm:inline">Filled</span>
                      {/* Text for desktop */}
                    </button>
                    {/* 4. DELETE BUTTON */}
                    {selectedToothDocId && ( // Only show if a record exists for this tooth
                      <button // 📌 MODERN STYLES
                        className="btn btn-sm bg-gray-500 text-white shadow-md rounded-lg hover:bg-gray-600 transition-all duration-150 ml-auto flex items-center justify-center"
                        onClick={handleDeleteTooth}
                      >
                        {/* 📌 RESPONSIVE TEXT/ICON */}
                        <span className="sm:hidden">🗑️</span>
                        {/* Icon for mobile */}
                        <span className="hidden sm:inline">
                          Delete Tooth Record
                        </span>{" "}
                        {/* Text for desktop */} 
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="modal-action mt-4">
                <button
                  onClick={onClose}
                  className="btn bg-[#E6D8BA] text-[#1E2B1F] hover:bg-[#DCD1B4]"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ----------------------------- */}
              {/* Normal List UI for other sections */}
              {/* ----------------------------- */}

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
                        >
                          ✎
                        </button>
                        <button
                          className="btn btn-xs bg-[#E86D6D] text-white hover:bg-[#d65a5a]"
                          onClick={() => deleteItem(i.$id)}
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

              {/* ----------------------------- */}
              {/* Dynamic Form for add/update */}
              {/* ----------------------------- */}
              <div className="space-y-2">
                {/* Medical History Form */}
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
                      value={form.diagnosisDate || ""}
                      onChange={(e) =>
                        setForm({ ...form, diagnosisDate: e.target.value })
                      }
                      className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                    />
                  </>
                )}

                {/* Treatment Plans Form */}
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
                      value={form.treatmentDate || ""}
                      onChange={(e) =>
                        setForm({ ...form, treatmentDate: e.target.value })
                      }
                      className="input w-full bg-[#FFF8EA] border border-[#DCD1B4]"
                    />
                  </>
                )}

                {/* Notes Form */}
                {collectionId === "notes" && (
                  <>
                    <input
                      type="text"
                      placeholder="Name / Title"
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
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
                  </>
                )}
              </div>

              {/* FOOTER - Normal List UI */}
              <div className="modal-action flex justify-between">
                <button
                  onClick={handleAddOrUpdate}
                  disabled={adding || loading}
                  className="btn border-0 text-white bg-gradient-to-r from-[#A8E6CF] to-[#56C596] hover:from-[#56C596] hover:to-[#4BAE85]"
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
                    className="btn bg-[#E6D8BA] text-[#1E2B1F] hover:bg-[#DCD1B4]"
                    disabled={adding}
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="btn bg-[#E6D8BA] text-[#1E2B1F] hover:bg-[#DCD1B4]"
                  disabled={adding || loading}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
