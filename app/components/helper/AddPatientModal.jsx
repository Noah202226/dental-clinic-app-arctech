"use client";

import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";

export default function AddPatientModal({
  isOpen,
  setIsOpen,
  onSave,
  loading,
}) {
  const [form, setForm] = useState({
    patientName: "",
    address: "",
    birthdate: "",
    gender: "",
    contact: "",
    // New fields
    civilStatus: "", // Added Civil Status
    occupation: "", // Added Occupation
    emergencyToContact: "",
    emergencyToContactNumber: "",
    note: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Retain original validation
    if (!form.patientName || !form.contact) return;
    onSave(form);
    // Reset state after save
    setForm({
      patientName: "",
      address: "",
      birthdate: "",
      gender: "",
      contact: "",
      civilStatus: "", // Reset Civil Status
      occupation: "", // Reset Occupation
      emergencyToContact: "",
      emergencyToContactNumber: "",
      note: "",
    });
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset form on modal close
      setForm({
        patientName: "",
        address: "",
        birthdate: "",
        gender: "",
        contact: "",
        civilStatus: "", // Reset Civil Status
        occupation: "", // Reset Occupation
        emergencyToContact: "",
        emergencyToContactNumber: "",
        note: "",
      });
    }
  }, [isOpen]);

  return (
    <>
      <dialog
        id="add_patient_modal"
        className={`modal ${isOpen ? "modal-open" : ""}`}
      >
        <div className="modal-box max-w-3xl bg-white text-gray-800 rounded-2xl shadow-2xl border border-[#B3E6C2]">
          <h3 className="font-bold text-2xl mb-4 text-white flex items-center gap-2">
            🧾 Add New Patient
          </h3>

          {/* Tabs */}
          <div
            role="tablist"
            className="tabs tabs-boxed bg-[#C9FDD7]/70 mb-5 rounded-xl"
          >
            {/* General Info */}
            <input
              type="radio"
              name="tabset"
              role="tab"
              className="tab text-green-500 font-semibold"
              aria-label="General Info"
              defaultChecked
              id="tab-general"
            />
            <div
              role="tabpanel"
              className="tab-content p-4 bg-[#E9FFF0] rounded-xl"
              htmlFor="tab-general"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1: Name and Gender */}
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    placeholder="Enter full name"
                    value={form.patientName}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">Gender</span>
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="select select-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                {/* Row 2: Birthdate and Contact */}
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">Birthdate</span>
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                    className="input input-bordered w-full  bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">
                      Contact Number
                    </span>
                  </label>
                  <input
                    type="text"
                    name="contact"
                    placeholder="Enter contact number"
                    value={form.contact}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                    required
                  />
                </div>
                {/* Row 3: Civil Status and Occupation (NEW) */}
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">
                      Civil Status
                    </span>
                  </label>
                  <select
                    name="civilStatus"
                    value={form.civilStatus}
                    onChange={handleChange}
                    className="select select-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  >
                    <option value="">Select</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">Occupation</span>
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="Enter occupation/job title"
                    value={form.occupation}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  />
                </div>
                {/* Row 4: Address (Full Width) */}
                <div className="md:col-span-2">
                  <label className="label">
                    <span className="label-text text-gray-700">Address</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    value={form.address}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Info */}
            <input
              type="radio"
              name="tabset"
              role="tab"
              className="tab text-green-500 font-semibold"
              aria-label="Emergency"
              id="tab-emergency"
            />
            <div
              role="tabpanel"
              className="tab-content p-4 bg-[#E9FFF0] rounded-xl"
              htmlFor="tab-emergency"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">
                      Emergency Contact Name
                    </span>
                  </label>
                  <input
                    type="text"
                    name="emergencyToContact"
                    placeholder="Enter emergency contact name"
                    value={form.emergencyToContact}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-700">
                      Emergency Contact Number
                    </span>
                  </label>
                  <input
                    type="text"
                    name="emergencyToContactNumber"
                    placeholder="Enter emergency number"
                    value={form.emergencyToContactNumber}
                    onChange={handleChange}
                    className="input input-bordered w-full bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <input
              type="radio"
              name="tabset"
              role="tab"
              className="tab text-green-500 font-semibold"
              aria-label="Note"
              id="tab-note"
            />
            <div
              role="tabpanel"
              className="tab-content p-4 bg-[#E9FFF0] rounded-xl"
              htmlFor="tab-note"
            >
              <label className="label">
                <span className="label-text text-gray-700">
                  Additional Notes
                </span>
              </label>
              <textarea
                name="note"
                placeholder="Enter any important notes..."
                value={form.note}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-32 bg-[#D9FFE5] border-[#B3E6C2] text-gray-800 rounded-xl"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-6 gap-3">
            <button
              className="btn btn-outline border-[#B3E6C2] text-gray-700 hover:bg-[#D9FFE5] rounded-xl"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className={`btn bg-green-500 hover:bg-green-400 text-white border-none rounded-xl shadow-md ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
              }`}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  );
}
