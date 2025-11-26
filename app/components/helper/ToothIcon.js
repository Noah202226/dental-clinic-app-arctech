import React from "react";

// You'd have actual SVG paths for different tooth shapes or a generic one.
// For this example, let's use a very simplified generic shape.
// You'd have actual SVG paths for different tooth shapes or a generic one.
const GenericToothSVG = ({ fill, stroke, hasNote }) => (
  <svg width="40" height="40" viewBox="0 0 100 100" className="tooth-svg">
    <path
      d="M50 10 Q 70 0, 90 20 Q 100 50, 90 80 Q 70 100, 50 90 Q 30 100, 10 80 Q 0 50, 10 20 Q 30 0, 50 10 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="2" // Keep stroke width consistent
      className="stroke-gray-400"
    />
  </svg>
);

export default function ToothIcon({
  status,
  hasNote,
  toothNumber,
  isSelected,
}) {
  let fillColor = "white";
  let strokeColor = "gray";

  if (status === "caries") {
    fillColor = "#FCA5A5"; // bg-red-300
    strokeColor = "#DC2626"; // border-red-500
  } else if (status === "filled") {
    fillColor = "#FEF08A"; // bg-yellow-200
    strokeColor = "#EAB308"; // border-yellow-500
  } else {
    fillColor = "#F3F4F6"; // a light gray or white
    strokeColor = "#D1D5DB"; // border-gray-300
  } // 1. Thick Blue Ring for Notes

  // --- VISUAL STYLING MODIFICATION ---
  const noteRingClass = hasNote
    ? "ring-2 ring-offset-1 ring-blue-500" // Use a ring for notes
    : "";

  // 2. Determine Note Style (Soft Blue Border)
  // Use a simple, visible blue border instead of a ring.
  const noteStyleClass = hasNote
    ? "border-2 border-blue-400"
    : "border border-gray-200"; // Use a light default border when no note

  // 3. Determine Selection Style (Shadow, Subtle Background, and Distinct Border)
  let selectionStyleClass = "";
  if (isSelected) {
    // Use a shadow and a custom border/background color combination for prominence
    selectionStyleClass =
      "shadow-md bg-indigo-100 border-2 border-indigo-600 scale-105";
    // Override default fill color if selected, but preserve status color inside SVG
  }

  // This is where you would select a specific SVG based on toothNumber
  // For now, we use a generic one.
  return (
    <div
      className={`
                relative flex flex-col items-center justify-center p-2 rounded-lg 
                transition-all duration-200
                ${noteStyleClass} 
                ${selectionStyleClass}
            `}
    >
      {hasNote && (
        <div className="absolute bottom-[-2px] w-1.5 h-1.5 rounded-full bg-blue-500"></div>
      )}
      <GenericToothSVG
        fill={fillColor}
        stroke={strokeColor}
        hasNote={hasNote}
      />
      <span className="absolute bottom-1 text-xs font-semibold text-gray-800 pointer-events-none">
        {toothNumber}
      </span>
    </div>
  );
}
