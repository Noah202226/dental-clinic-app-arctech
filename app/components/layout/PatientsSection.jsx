"use client";

import { useEffect, useState } from "react";
import { FiUserPlus, FiSearch, FiEye, FiTrash2 } from "react-icons/fi";
import AddPatientModal from "../helper/AddPatientModal";
import ViewPatientDetailsModal from "../helper/ViewPatientDetailsModal";
import { usePatientStore } from "@/app/stores/usePatientStore";
import { useTransactionsStore } from "@/app/stores/useTransactionsStore";

export default function PatientsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    patient: null,
  });

  const { patients, fetchPatients, addPatient, deletePatient } =
    usePatientStore();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = (patient) => {
    setConfirmModal({ isOpen: true, patient });
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deletePatient(confirmModal.patient.$id);
      setConfirmModal({ isOpen: false, patient: null });
      fetchPatients();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePatient = async (newData) => {
    try {
      setLoading(true);
      await addPatient(newData);
      setIsOpen(false);
      fetchPatients();
    } catch (err) {
      console.error("Add patient failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    transactions,
    installments,
    withBalancePatients,
    getWithBalancePatients,
  } = useTransactionsStore();

  useEffect(() => {
    fetchPatients();
    getWithBalancePatients();
  }, [fetchPatients]);

  console.log(withBalancePatients);

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-color)] flex items-center gap-2">
            👥 Patients
          </h1>
          <p className="text-sm text-[var(--theme-color)]">
            Manage and view patient records
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className={`btn bg-[var(--theme-color)] hover:bg-[#5A54E0] text-white border-none flex items-center gap-2 rounded-xl shadow transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
          }`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Adding...
            </>
          ) : (
            <>
              <FiUserPlus /> Add Patient
            </>
          )}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-[var(--theme-color)]/50 backdrop-blur rounded-2xl p-4 shadow-md border border-[#B3E6C2]">
          <div className="stat-title text-gray-600">Total Patients</div>
          <div className="stat-value text-white">{patients.length}</div>
        </div>

        <div className="stat bg-[var(--theme-color)]/50 backdrop-blur rounded-2xl p-4 shadow-md border border-[#B3E6C2]">
          <div className="stat-title text-gray-600">With Balance</div>
          <div className="stat-value text-error">
            {withBalancePatients.length}
          </div>
        </div>

        <div className="stat bg-[var(--theme-color)]/50 backdrop-blur rounded-2xl p-4 shadow-md border border-[#B3E6C2]">
          <div className="stat-title text-gray-600">
            Total Amount of Balance
          </div>
          <div className="stat-value text-[var(--theme-color)]">
            {withBalancePatients.reduce((sum, p) => sum + p.remaining, 0)}
          </div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="flex flex-col h-full">
        <label className="input input-bordered flex items-center gap-2 w-full md:w-1/3 rounded-xl shadow-sm border border-[#B3E6C2] bg-[#E9FFF0]">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            className="grow bg-transparent focus:outline-none"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        {/* Table */}
        <div className="flex-1 overflow-hidden mt-4">
          <div className="h-[55vh] overflow-y-auto pr-2">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="table w-full h-full rounded-xl overflow-hidden border border-[#B3E6C2]">
                <thead className="sticky top-0 bg-[var(--theme-color)] text-gray-600 z-10">
                  <tr className="text-sm text-white">
                    <th>Name</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    // 1. Create a copy of the array and sort it
                    [...filteredPatients]
                      .sort((a, b) =>
                        a.patientName.localeCompare(b.patientName)
                      )
                      // 2. Map over the sorted array
                      .map((patient) => (
                        <tr
                          key={patient.$id}
                          className="hover:bg-[#D9FFE5]/70 transition-all"
                        >
                          {/* ... table data cells for patient ... */}
                          <td className="font-medium text-[var(--theme-color)]">
                            {patient.patientName}
                          </td>
                          <td className="text-[var(--theme-color)]">
                            {patient.address}
                          </td>
                          <td className="text-[var(--theme-color)]">
                            {patient.contact}
                          </td>
                          <td className="flex gap-2 justify-center">
                            <button
                              className="btn btn-sm bg-[var(--theme-color)] hover:bg-[#2CA6E0] text-white border-none rounded-lg flex items-center gap-1"
                              onClick={() => handleView(patient)}
                            >
                              <FiEye /> View
                            </button>
                            <button
                              className="btn btn-sm bg-[#F87171] hover:bg-[#EF4444] text-white border-none rounded-lg flex items-center gap-1"
                              onClick={() => handleDeleteConfirm(patient)}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center text-gray-500 py-6"
                      >
                        No patients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="grid gap-4 md:hidden">
              {
                // 1. Create a copy of the array and sort it
                [...filteredPatients]
                  .sort((a, b) => a.patientName.localeCompare(b.patientName))
                  // 2. Map over the sorted array
                  .map((patient) => (
                    <div
                      key={patient.$id}
                      className="card bg-[var(--theme-color)]/30 backdrop-blur shadow-md p-4 rounded-2xl border border-[#B3E6C2] hover:shadow-lg transition-all"
                    >
                      <h2 className="font-semibold text-lg text-primary">
                        {patient.patientName}
                      </h2>
                      <p className="text-sm text-gray-600">{patient.address}</p>
                      <p className="text-sm">{patient.contact}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          className="btn btn-info btn-sm flex-1"
                          onClick={() => handleView(patient)}
                        >
                          <FiEye /> View
                        </button>
                        <button
                          className="btn btn-error btn-sm flex-1"
                          onClick={() => handleDeleteConfirm(patient)}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSave={handleSavePatient}
        loading={loading}
      />

      <ViewPatientDetailsModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {confirmModal.isOpen && (
        <dialog open className="modal">
          <div className="modal-box rounded-2xl bg-[var(--theme-color)]">
            <h3 className="font-bold text-xl text-white">⚠ Confirm Delete</h3>
            <p className="py-3 text-lg text-gray-300">
              Are you sure you want to delete{" "}
              <strong>{confirmModal.patient?.patientName}</strong>? <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="btn btn-outline border-[#B3E6C2] text-gray-600 rounded-lg"
                onClick={() =>
                  setConfirmModal({ isOpen: false, patient: null })
                }
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-error rounded-lg text-white"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
