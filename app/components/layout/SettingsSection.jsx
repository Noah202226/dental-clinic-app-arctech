"use client";

import { useState } from "react";
import { FiUser, FiBell, FiMoon, FiSave, FiMail } from "react-icons/fi";
import clsx from "clsx";
import PersonalizationSettings from "../helper/PersonalizationSettings";
import ServicesTab from "../helper/ServicesTab";
import DentistTab from "../helper/DentistTab";

export default function SettingsSection() {
  const [clinicName, setClinicName] = useState("NoaArc Dental Clinic");
  const [initial, setInitial] = useState("NoaArc Dental Clinic");

  const [activeTab, setActiveTab] = useState("Personalization");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--theme-color)]">
        ⚙️ Settings
      </h1>
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-green-200/50">
        {["Personalization", "Services", "Dentist"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 font-semibold rounded-t-md transition",
              activeTab === tab
                ? "bg-[var(--theme-color)] text-white"
                : "text-[var(--theme-color)] hover:bg-green-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Clinic Info */}
      {activeTab === "Personalization" ? <PersonalizationSettings /> : ""}
      {activeTab === "Services" ? <ServicesTab /> : ""}
      {activeTab === "Dentist" ? <DentistTab /> : ""}
    </div>
  );
}
