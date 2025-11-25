"use client";
import { useState } from "react";
import PaymentModal from "./PaymentModal"; // make sure filename matches

export default function PaymentSectionCard({ patient }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Card View */}
      <div
        className="bg-[var(--theme-color)] p-4 rounded-xl hover:bg-[var(--theme-color)]/50 transition cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Payments</h3>
        </div>
        <p className="text-sm text-gray-200">View and manage payments</p>
      </div>

      {/* Modal */}
      <PaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        patient={patient}
      />
    </>
  );
}
