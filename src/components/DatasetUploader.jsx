import { useState, useMemo } from "react";
import Papa from "papaparse";

const field =
  "h-10 w-full rounded-xl border border-slate-600 bg-slate-800/70 " +
  "px-3 text-slate-100 placeholder:text-slate-400 placeholder:opacity-90 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

function toNumber(v) {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}
function indexById(files) {
  const map = new Map();
  for (const f of files || []) {
    // keep map available, but we won’t rely on IDs for ordering anymore
    const m = String(f.name || "").match(/(\d+)(?!.*\d)/);
    if (m) map.set(Number(m[1]), URL.createObjectURL(f));
  }
  return map;
}

export default function DatasetUploader({ onReady, showIdField = false }) {
  const [csv, setCsv] = useState(null);
  const [folders, setFolders] = useState([{ key: "folder1", files: [] }]); // start with one folder
  const [idColumn, setIdColumn] = useState("");
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState("");

  const counts = useMemo(() => {
    const out = {};
    folders.forEach((f) => {
      out[f.key] = f.files.length;
    });
    return out;
  }, [folders]);

  const handleFolder = (key) => (e) => {
    const files = Array.from(e.target.files || []);
    let label = key; // fallback
    if (files.length > 0) {
      // extract the immediate folder name from first file’s relative path
      const parts = files[0].webkitRelativePath.split("/");
      if (parts.length > 1) {
        label = parts[parts.length - 2];   // parent folder
      }
    }
  
    setFolders((prev) =>
      prev.map((f) =>
        f.key === key ? { ...f, files, label } : f
      )
    );
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

  function buildItems(csvRows) {
    const seq = {};
    const byId = {};

    folders.forEach((f) => {
      seq[f.key] = sortByName(f.files);
      byId[f.key] = indexById(f.files);
    });

    const items = [];
    csvRows.forEach((row, rowIndex) => {
      // ✅ Always sequential IDs based on CSV row order
      const id = rowIndex + 1;

      const params = {};
      for (const [k, v] of Object.entries(row)) {
        const n = toNumber(v);
        if (n !== undefined) params[k] = n;
      }

      const images = {};
      folders.forEach((f) => {
        const seqImg = fileAt(seq[f.key], rowIndex); // rowIndex matches CSV order
        const byIdImg = byId[f.key].get(id) || "";
        images[f.key] = seqImg || byIdImg;
      });

      items.push({
        id,
        _row: rowIndex,
        _key: `${rowIndex}-${id}`,
        params,
        images,
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
  
        const items = buildItems(rows);
  
        if (!items.length) {
          setErr("Could not build dataset from CSV rows.");
        } else {
          const folderLabels = folders.map(
            (f, i) => f.label || `Folder ${i + 1}`
          );
          onReady(items, { folderLabels });   // ✅ pass labels up
        }
        setParsing(false);
      },
      error: (e) => {
        setErr(String(e));
        setParsing(false);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-slate-200 text-lg font-semibold">Upload dataset</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-slate-400 mb-1">CSV file</div>
          <input
            type="file"
            accept=".csv"
            className={field}
            onChange={(e) => setCsv(e.target.files?.[0] || null)}
          />
        </label>

        {showIdField && (
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">ID column (optional)</div>
            <input
              className={field}
              placeholder="e.g., id (leave blank to auto)"
              value={idColumn}
              onChange={(e) => setIdColumn(e.target.value)}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {folders.map((f, i) => (
          <label key={f.key} className="block">
            <div className="text-sm text-slate-400 mb-1">
              Folder {i + 1}{" "}
              {counts[f.key] ? (
                <span className="text-slate-300">• {counts[f.key]} images</span>
              ) : null}
            </div>
            <input
              type="file"
              multiple
              webkitdirectory="true"
              directory="true"
              className={field}
              onChange={handleFolder(f.key)}
              accept="image/*"
            />
            <div className="text-xs text-slate-500 mt-1">
              {f.label
              ? <>📁 <span className="text-slate-300 font-medium">{f.label}</span></>
              : "Pick the folder containing images"}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={() =>
          setFolders((prev) => [
            ...prev,
            { key: `folder${prev.length + 1}`, files: [] },
          ])
        }
        className="mt-2 h-9 px-3 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
      >
        ➕ Add another folder
      </button>

      {err && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-rose-100">
          {err}
        </div>
      )}

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
        Tip: images are matched to rows in order. Row 1 → ID 1, Row 2 → ID 2.
      </div>
    </div>
  );
}

