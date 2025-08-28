import FilterPanel from "./components/FilterPanel";
import useData from "./hooks/useData";
import ImageCard from "./components/ImageCard";
import DetailsModal from "./components/DetailsModal";
import VisualizationPanel from "./components/VisualizationPanel";
import CaptionParamPicker from "./components/CaptionParamPicker";
import MorphoLogo from "./assets/morpho-logo.png";
import { useState, useEffect } from "react";

function NoResultsToast({ onClose }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-rose-100 shadow-xl backdrop-blur">
        <svg className="h-5 w-5 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/>
        </svg>
        <span className="text-sm">No designs match the selected parameters. Adjust filters or reset.</span>
        <button
          onClick={onClose}
          className="ml-1 rounded-md px-2 py-0.5 text-rose-200/80 hover:text-rose-100 hover:bg-rose-500/20"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function SidePanel({ open, onClose, title = "Visualizations", children }) {
  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      {/* overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* panel */}
      <aside
        className={[
          "absolute right-0 top-0 h-dvh w-full sm:w-[560px] lg:w-[880px]",
          "bg-slate-900 border-l border-slate-800 shadow-2xl",
          "transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-modal="true"
        role="dialog"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="Close panel"
            title="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100dvh-56px)]">{children}</div>
      </aside>
    </div>
  );
}

function App() {
  const { data, loading } = useData();
  const [isFiltered, setIsFiltered] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedView, setSelectedView] = useState("front");
  const [filteredData, setFilteredData] = useState([]);
  const [showVisuals, setShowVisuals] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [captionParams, setCaptionParams] = useState([]);

  const numericParameters = Object.keys(data[0]?.params || {}).filter(
    (k) => typeof data[0]?.params[k] === "number"
  );

  const applyFilters = (filters) => {
    const result = data.filter((item) =>
      Object.entries(filters).every(([key, conditions]) =>
        conditions.every(({ operator, value }) => {
          const v = item.params[key];
          switch (operator) {
            case "=":  return v === value;
            case "!=": return v !== value;
            case ">":  return v > value;
            case ">=": return v >= value;
            case "<":  return v < value;
            case "<=": return v <= value;
            default:   return true;
          }
        })
      )
    );
  
    if (result.length === 0) {
      // keep whatever is currently displayed, just show toast
      setNoResults(true);
      return;
    }
  
    setIsFiltered(true);
    setFilteredData(result);
    setNoResults(false);
  };

  const applySort = (param) => {
    if (!param) return;
    const sorted = [...(filteredData.length ? filteredData : data)].sort(
      (a, b) => a.params[param] - b.params[param]
    );
    setFilteredData(sorted);
  };

  const displayed = isFiltered ? filteredData : data;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
  <img
    src={MorphoLogo}
    alt="Morpho logo"
    className="h-9 w-9 rounded-md ring-1 ring-slate-700/60 bg-slate-900 object-contain"
  />
  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
    Morpho Design Explorer
  </h1>
</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden"> {/* fixed viewport shell, never resizes */}
    <div className="h-full w-full overflow-y-scroll [scrollbar-gutter:stable] overflow-x-hidden">
    {noResults && <NoResultsToast onClose={() => setNoResults(false)} />}
    <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
  <div className="flex items-center gap-3 mb-6">
    <img
      src={MorphoLogo}
      alt="Morpho logo"
      className="h-10 w-10 shrink-0 rounded-md ring-1 ring-slate-700/60 bg-slate-900 object-contain"
    />
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
      Morpho Design Explorer
    </h1>
  </div>
</div>

        {/* Filters */}
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-300 mb-3">Filters</div>
          <FilterPanel
            data={data}
            onFilter={applyFilters}
            onReset={() => { setFilteredData([]); setIsFiltered(false); setNoResults(false); }}
            onSort={applySort}
          />
        </div>
        

        {/* Toolbar */}
        <div className="flex flex-wrap items-end gap-4 md:gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 shadow-lg">
          <div className="flex flex-col gap-2 min-w-[220px]">
            <label className="text-slate-400 font-semibold">Select Image View</label>
            <select
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
            >
              <option value="front">Front View</option>
              <option value="top">Top View</option>
              <option value="iso">Isometric View</option>
              <option value="deformation">Truss Deformation</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-36">
            <label className="text-slate-400 font-semibold">Images per row</label>
            <input
              type="number"
              min={1}
              max={10}
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={columnsPerRow}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setColumnsPerRow(isNaN(val) ? 1 : Math.max(1, val));
              }}
            />
          </div>

          <div className="flex flex-col gap-2 w-full sm:min-w-[260px] sm:w-[320px]">
            <label className="text-slate-400 font-semibold">
              Caption parameters (max 2)
            </label>
            <CaptionParamPicker
              options={numericParameters}
              value={captionParams}
              onChange={setCaptionParams}
              max={2}
              placeholder="Pick parameters…"
            />
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setShowVisuals(true)}
              className="h-10 px-4 rounded-xl font-semibold text-white bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 shadow-lg"
            >
              Visualize
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div
  className="mt-6 grid w-full gap-4"
  style={{ gridTemplateColumns: `repeat(${Math.max(1, columnsPerRow)}, minmax(0, 1fr))` }}
>
  {displayed.map((item) => (
    <ImageCard
      key={item.id}
      item={item}
      view={selectedView}
      onClick={() => setSelectedItem(item)}
      captionParams={captionParams}
    />
  ))}
</div>

        {/* Visualizations */}
        <SidePanel open={showVisuals} onClose={() => setShowVisuals(false)} title="Visualizations">
  <VisualizationPanel
    filteredData={filteredData.length > 0 ? filteredData : data}
    onSelectItem={(item) => setSelectedItem(item)}
    selectedItem={selectedItem}
  />
</SidePanel>

        {/* Modal */}
        {selectedItem && (
          <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </div>
  );
}

export default App;
