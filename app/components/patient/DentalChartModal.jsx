"use client";
import { useDentalChartStore } from "@/app/stores/useDentalChartStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DentalChartModal({ patientId, onClose }) {
  const { chart, fetchChart, updateTooth, loading } = useDentalChartStore();
  const [selectedTooth, setSelectedTooth] = useState(null);

  // tooth numbers: 11–18, 21–28, 31–38, 41–48
  const TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
    45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];

  useEffect(() => {
    fetchChart(patientId);
  }, [patientId]);

  const getToothStatus = (toothNumber) => {
    const tooth = chart.find((x) => x.toothNumber === String(toothNumber));
    return tooth ? tooth.status : "healthy";
  };

  const handleUpdate = async (status) => {
    await updateTooth(patientId, selectedTooth, status);
    toast.success("Tooth updated");
    setSelectedTooth(null);
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-4xl bg-white rounded-xl">
        <h3 className="font-bold text-xl text-[#00A388] mb-4">Dental Chart</h3>

        {/* Chart Layout */}
        <div className="grid grid-cols-8 gap-2 p-3 bg-mint-50 rounded-xl">
          {TEETH.map((tooth) => (
            <button
              key={tooth}
              onClick={() => setSelectedTooth(tooth)}
              className={`h-14 rounded-lg border text-xs font-semibold flex items-center justify-center
                ${
                  getToothStatus(tooth) === "caries"
                    ? "bg-red-300 border-red-500"
                    : getToothStatus(tooth) === "filled"
                    ? "bg-yellow-200 border-yellow-500"
                    : "bg-white border-mint-400"
                }
              `}
            >
              {tooth}
            </button>
          ))}
        </div>

        {selectedTooth && (
          <div className="mt-4 p-4 bg-mint-100 rounded-xl">
            <h4 className="font-semibold">Tooth {selectedTooth}</h4>
            <p className="text-sm mb-2">Select condition:</p>

            <div className="flex gap-2">
              <button
                className="btn btn-sm bg-green-500 text-white"
                onClick={() => handleUpdate("healthy")}
              >
                Healthy
              </button>
              <button
                className="btn btn-sm bg-red-500 text-white"
                onClick={() => handleUpdate("caries")}
              >
                Caries
              </button>
              <button
                className="btn btn-sm bg-yellow-500 text-white"
                onClick={() => handleUpdate("filled")}
              >
                Filled
              </button>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn bg-[#00A388] text-white" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
