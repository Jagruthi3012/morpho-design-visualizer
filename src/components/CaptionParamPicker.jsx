import { useEffect, useMemo, useRef, useState } from "react";

export default function CaptionParamPicker({
  options = [],
  value = [],
  onChange,
  max = Infinity,
  placeholder = "Pick parameters…",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(s));
  }, [options, q]);

  const toggle = (opt) => {
    const exists = value.includes(opt);
    if (exists) {
      onChange(value.filter((v) => v !== opt));
    } else {
      if (value.length >= max) return; // respect max
      onChange([...value, opt]);
    }
  };

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => {
      if (!popRef.current) return;
      if (
        !popRef.current.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // summary chips in the trigger
  const visible = value.slice(0, 2);
  const hiddenCount = Math.max(0, value.length - visible.length);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-2 text-left outline-none focus:ring-2 focus:ring-indigo-500/50"
        title={value.length ? value.join(", ") : ""}
      >
        <div className="relative flex items-center gap-1 overflow-hidden">
          {value.length === 0 && (
            <span className="text-slate-400">{placeholder}</span>
          )}
          {visible.map((v) => (
            <span
              key={v}
              className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-100"
            >
              {v}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              +{hiddenCount} more
            </span>
          )}
          {/* right fade so long content never looks cut off harshly */}
          <span className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-slate-900 to-transparent" />
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popRef}
          className="absolute z-[90] mt-2 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          <div className="border-b border-slate-800 p-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filtered.map((opt) => {
              const checked = value.includes(opt);
              const disabled = !checked && value.length >= max;
              return (
                <li key={opt}>
                  <label
                    className={[
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                      checked
                        ? "bg-slate-800/60 text-slate-100"
                        : "hover:bg-slate-800/40",
                      disabled ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(opt)}
                      className="accent-indigo-500"
                    />
                    <span className="truncate">{opt}</span>
                  </label>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400">No matches</li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-slate-800 p-2">
            <button
              onClick={() => onChange([])}
              className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800/60"
            >
              Clear
            </button>
            <div className="text-xs text-slate-400">
              {value.length}/{Number.isFinite(max) ? max : "∞"} selected
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
