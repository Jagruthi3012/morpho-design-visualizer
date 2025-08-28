import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function DetailsModal({ item, onClose }) {
  if (!item) return null;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const imageDefs = [
    ['front', 'Front view'],
    ['top', 'Top view'],
    ['iso', 'Isometric view'],
    ['deformation', 'Truss deformation'],
  ];

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* centered dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <h3 className="text-lg font-semibold">Design details</h3>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-800"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* ---- YOUR REAL CONTENT HERE ---- */}
          <div className="p-4 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
  <div className="grid grid-cols-2 gap-3">
    {imageDefs
      .filter(([k]) => item?.views?.[k])
      .map(([k, label]) => (
        <figure key={k} className="relative overflow-hidden rounded-lg border border-slate-800">
          <img
            src={item.views[k]}
            alt={label}
            className="w-full h-48 sm:h-52 lg:h-60 bg-slate-900 object-contain"
          />
          <figcaption className="absolute left-2 bottom-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[11px] text-slate-200">
            {label}
          </figcaption>

          {/* open in new tab */}
          <a
            href={item.views[k]}
            target="_blank"
            rel="noopener noreferrer"
            title="Open image in a new tab"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 rounded-md p-1.5 ring-1 ring-slate-700/60 bg-slate-900/70 hover:bg-slate-900 text-slate-100"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3h7v7" />
              <path d="M21 3l-9 9" />
              <path d="M5 12v7a2 2 0 0 0 2 2h7" />
            </svg>
          </a>
        </figure>
      ))}
  </div>
</div>

              {/* Parameters */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(item.params || {}).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-slate-400 text-sm">{k}</dt>
                      <dd className="font-medium text-slate-100">
                        {typeof v === "number" ? v.toLocaleString() : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
