// src/components/DatasetUploader.jsx
import { useState, useMemo } from "react";
import Papa from "papaparse";

const field =
  "h-10 w-full rounded-xl border border-slate-600 bg-slate-800/70 " +
  "px-3 text-slate-100 placeholder:text-slate-400 placeholder:opacity-90 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const views = [
  { key: "front",       label: "Front view" },
  { key: "top",         label: "Top view" },
  { key: "iso",         label: "Isometric view" },
  { key: "deformation", label: "Truss deformation" },
];

function lastIntIn(str) {
  const m = String(str || "").match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
}
function toNumber(v) {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}
function indexById(files) {
  // { id -> blobUrl }
  const map = new Map();
  for (const f of files || []) {
    const id = lastIntIn(f.name);
    if (id != null) map.set(id, URL.createObjectURL(f));
  }
  return map;
}

export default function DatasetUploader({ onReady, showIdField = false }) {  const [csv, setCsv] = useState(null);
  const [folders, setFolders] = useState({
    front: [], top: [], iso: [], deformation: []
  });
  const [idColumn, setIdColumn] = useState("");     // user can override
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState("");

  const counts = useMemo(() => ({
    front: folders.front.length,
    top: folders.top.length,
    iso: folders.iso.length,
    deformation: folders.deformation.length,
  }), [folders]);

  const handleFolder = (key) => (e) => {
    setFolders((s) => ({ ...s, [key]: Array.from(e.target.files || []) }));
  };

  function sortByName(files) {
    return Array.from(files || []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
  }
  
  function fileAt(files, i) {
      if (!files || i == null || i < 0 || i >= files.length) return "";
      const f = files[i];
    return f ? URL.createObjectURL(f) : "";
  }
  
  function buildItems(csvRows, chosenIdCol) {
    // 1) Index-based arrays (sorted by filename)
    const seq = {
      front: sortByName(folders.front),
      top: sortByName(folders.top),
      iso: sortByName(folders.iso),
      deformation: sortByName(folders.deformation),
    };
  
    // 2) ID-based maps (optional / fallback)
    const byId = {
      front: indexById(folders.front),
      top: indexById(folders.top),
      iso: indexById(folders.iso),
      deformation: indexById(folders.deformation),
    };
  
    const items = [];
  
    csvRows.forEach((row, rowIndex) => {
      // prefer explicit or detect first column; fallback to rowIndex+1
      let id = rowIndex + 1;
 if (chosenIdCol) {
   const idRaw = row[chosenIdCol];
   const parsedId = lastIntIn(idRaw);
   if (parsedId != null) id = parsedId;
 }
  
      // Build params (numbers become numbers)
      const params = {};
      for (const [k, v] of Object.entries(row)) {
        if (chosenIdCol && k === chosenIdCol) continue;
        const n = toNumber(v);
        if (n !== undefined) params[k] = n;
      }
  
      // --- Primary: index-based mapping (nth image -> (n+1)th row) ---
      const idx = rowIndex - 1;
  const frontSeq = fileAt(seq.front, idx);
  const topSeq   = fileAt(seq.top, idx);
  const isoSeq   = fileAt(seq.iso, idx);
  const defSeq   = fileAt(seq.deformation, idx);
  
      // --- Fallback: ID-based lookup (if present and matched) ---
      const frontById = byId.front.get(id) || "";
      const topById = byId.top.get(id) || "";
      const isoById = byId.iso.get(id) || "";
      const defById = byId.deformation.get(id) || "";
  
      items.push({
        id,                 
        _row: rowIndex,     
        _key: `${rowIndex}-${id}`,   
        params,
        images: { front: frontSeq || frontById, top: topSeq || topById, iso: isoSeq || isoById, deformation: defSeq || defById }
      });
    });
  
    return items;
  }
  

  function parseCsv() {
    if (!csv) return setErr("Please choose a CSV file.");
    setErr("");
    setParsing(true);

    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rawRows = (res.data || []).filter((r) => Object.keys(r).length);

  const rows = rawRows.map((r) => {
    const out = {};
   for (const [k, v] of Object.entries(r)) {
      out[String(k).trim()] = v;
    }
    return out;
  });
        if (!rows.length) {
          setErr("CSV seems empty or unreadable.");
          setParsing(false);
          return;
        }
        // Pick id column: explicit, or 'id', or first column
        const headers = (res.meta?.fields || Object.keys(rows[0])).map(h => String(h).trim());
        const hasExplicitId = headers.some(h => h.toLowerCase() === "id");
        const chosen = idColumn || (hasExplicitId ? headers.find(h => h.toLowerCase() === "id") : null);
        const items = buildItems(rows, chosen);

        if (!items.length) {
          setErr("Could not infer any IDs from CSV rows.");
        } else {
          onReady(items, { idColumn: chosen });
        }
        setParsing(false);
      },
      error: (e) => { setErr(String(e)); setParsing(false); }
    });
  }

  function downloadJson() {
    parseCsv(); // will call onReady; better: make onReady provide items back
  }

  return (
    <div className="space-y-4">
      <div className="text-slate-200 text-lg font-semibold">Upload dataset</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">CSV file</div>
          <input type="file" accept=".csv" className={field}
                 onChange={(e)=>setCsv(e.target.files?.[0]||null)} />
        </label>

        {showIdField && (
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">ID column (optional)</div>
            <input
              className={field}
              placeholder="e.g., id (leave blank to auto)"
              value={idColumn}
              onChange={(e)=>setIdColumn(e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {views.map(v => (
          <label key={v.key} className="block">
            <div className="text-sm text-slate-400 mb-1">
              {v.label} folder {counts[v.key] ? <span className="text-slate-300">• {counts[v.key]} images</span> : null}
            </div>
            {/* directory picker: works in Chrome/Edge/Safari */}
            <input
              type="file"
              multiple
              // Firefox doesn't implement directory picking, but Chrome & Safari do:
              webkitdirectory="true"
              directory="true"
              className={field}
              onChange={handleFolder(v.key)}
              accept="image/*"
            />
            <div className="text-xs text-slate-500 mt-1">Pick the folder for {v.label} images</div>
          </label>
        ))}
      </div>

      {err && <div className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-rose-100">{err}</div>}

      <div className="flex gap-3">
        <button
          className="h-10 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
          onClick={parseCsv}
          disabled={parsing}
          title="Parse CSV and build dataset"
        >
          {parsing ? "Building…" : "Use dataset"}
        </button>
      </div>

      <div className="text-xs text-slate-400 pt-2">
        Tip: we match images to rows using the <em>last number</em> in each filename (e.g., 17.png → id 17).
      </div>
    </div>
  );
}
