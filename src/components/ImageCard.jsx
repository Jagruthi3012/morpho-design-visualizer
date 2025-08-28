import React from "react";

export default function ImageCard({ item, view, onClick, captionParams = [] }) {
  const imageSrc = item.views?.[view];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open details for solution ${item.id}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow transition hover:shadow-xl hover:-translate-y-0.5"
    >
      <img
        src={imageSrc}
        alt={`${view} view of item ${item.id}`}
        className="w-full h-auto object-cover bg-slate-950"
        loading="lazy"
      />
      {captionParams.length > 0 && (
        <div className="border-t border-slate-800 px-3 py-2 text-slate-300 text-sm space-y-0.5">
          {captionParams.map((param) => (
            <div key={param}>
              <span className="font-semibold text-slate-200">{param}</span>:{" "}
              {String(item.params?.[param] ?? "—")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
