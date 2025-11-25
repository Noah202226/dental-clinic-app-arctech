"use client";

import { useEffect, useState } from "react";
import { usePersonalizationStore } from "@/app/stores/usePersonalizationStore";
import { Loader2, Save } from "lucide-react";

export default function PersonalizationSettings() {
  const {
    personalization,
    fetchPersonalization,
    savePersonalization,
    loading,
  } = usePersonalizationStore();
  const [form, setForm] = useState({
    businessName: "",
    initial: "",
  });

  useEffect(() => {
    fetchPersonalization();
  }, []);

  useEffect(() => {
    if (personalization) {
      setForm({
        businessName: personalization.businessName || "",
        initial: personalization.initial || "",
      });
    }
  }, [personalization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await savePersonalization(form);
  };

  if (loading && !personalization)
    return (
      <div className="flex justify-center items-center py-10 text-[var(--theme-color)]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-semibold text-[var(--theme-color)] mb-4">
        Personalization
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Customize your clinic information that appears across the app.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Business Name
          </label>
          <input
            type="text"
            className="input input-bordered text-[var(--theme-color)] bg-white w-full border-green-300"
            placeholder="e.g. DentServe Dental Clinic"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Initial</label>
          <input
            type="text"
            maxLength={2}
            className="input input-bordered text-[var(--theme-color)] bg-white w-full border-green-300"
            placeholder="e.g. DS"
            value={form.initial}
            onChange={(e) => setForm({ ...form, initial: e.target.value })}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Shown in app headers or branding.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-[var(--theme-color)] hover:bg-[var(--theme-color)]/80 text-white px-5 py-2 rounded-lg shadow mt-4"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save size={16} />
          {personalization ? "Update Settings" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
