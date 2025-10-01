import FilterPanel from "./components/FilterPanel";
import DatasetUploader from "./components/DatasetUploader";
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

function Toast({ children, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl
                      border border-emerald-500/30 bg-emerald-500/15
                      px-3 py-2 text-emerald-100 shadow-xl backdrop-blur">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10A8 8 0 1 0 4 12c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
        </svg>
        <span className="text-sm">{children}</span>
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
    "absolute right-0 top-0 h-dvh w-full lg:w-[min(95vw,1400px)]",  // allow much wider
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
  const { data: defaultDataRaw, loading } = useData();
  const defaultData = defaultDataRaw.map((d, i) => ({ ...d, id: i + 1 }));
  const [uploadedData, setUploadedData] = useState([]);
  const data = uploadedData.length ? uploadedData : defaultData;
  const [isFiltered, setIsFiltered] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedView, setSelectedView] = useState("front");
  const [filteredData, setFilteredData] = useState([]);
  const [showVisuals, setShowVisuals] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [columnsPerRow, setColumnsPerRow] = useState(4);
  const [captionParams, setCaptionParams] = useState([]);
  const [openUploader, setOpenUploader] = useState(false);
  const [showDatasetToast, setShowDatasetToast] = useState(false);
  const [folderLabels, setFolderLabels] = useState(null);

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
    const base = isFiltered && filteredData.length ? filteredData : data;
    const sorted = [...base].sort((a, b) => a.params[param] - b.params[param]);
    setFilteredData(sorted);
    setIsFiltered(true);            // <- make UI render the sorted list
  };

  const displayed = isFiltered ? filteredData : data;
  const totalCount = data.length;
  const shownCount = displayed.length;

  if (loading && uploadedData.length === 0) {
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
      {/* Result count fixed top-right */}
<div className="fixed top-4 right-6 z-50">
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-200 shadow-lg backdrop-blur">
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8h4M8 12h8M9 16h6" />
    </svg>
    {isFiltered
      ? `${shownCount} / ${totalCount} results`
      : `${totalCount} results`}
  </span>
</div>
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
    <div className="ml-auto">
      <button
        onClick={() => setOpenUploader(true)}
        className="h-10 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow"
        title="Upload CSV + image folders"
      >
        Upload Dataset
      </button>
    </div>
  </div>
</div>

{showDatasetToast && (
  <Toast onClose={() => setShowDatasetToast(false)}>
    Using uploaded dataset ({uploadedData.length} items)
  </Toast>
)}

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
  {uploadedData.length === 0 ? (
    <>
      <option value="front">Front View</option>
      <option value="top">Top View</option>
      <option value="iso">Isometric View</option>
      <option value="deformation">Truss Deformation</option>
    </>
  ) : (
    Object.keys(data[0]?.images || {}).map((key, i) => (
      <option key={key} value={key}>
        {folderLabels?.[i] || `Folder ${i + 1}`}   
      </option>
    ))
  )}
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
              Caption parameters
            </label>
            <CaptionParamPicker
              options={numericParameters}
              value={captionParams}
              onChange={setCaptionParams}
              max={numericParameters.length}
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
    key={item._key || item.id}         // <-- use unique key
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

{/* Uploader panel*/}
<SidePanel open={openUploader} onClose={() => setOpenUploader(false)} title="Upload Dataset">
 <div className="space-y-4">
    <p className="text-slate-300 text-sm">
      Pick one CSV and the four image folders (Ex: Front, Top, Isometric, Truss deformation).
    </p>
    <DatasetUploader
     showIdField={false}              // hide the ID column input
      onReady={(items, { folderLabels }) => {
        const withIds = items.map((d, i) => ({
          ...d,
          id: i + 1,  
        }));
       setUploadedData(items); 
       setFolderLabels(folderLabels);       // switch app to the uploaded dataset
       setFilteredData([]);           // clear filters/sort
       setIsFiltered(false);
       setNoResults(false);
        setSelectedItem(null);
        setSelectedView("front");
        setOpenUploader(false); 
        setShowDatasetToast(true);       // close the panel
      }}
    />
    {uploadedData.length > 0 && (
     <div className="pt-2 text-xs text-slate-400">
        Currently using uploaded dataset ({uploadedData.length} items).
      </div>
   )}
  </div>
+</SidePanel>

        {/* Modal */}
        {selectedItem && (
          <DetailsModal
          item={selectedItem}
          view={selectedView}        // <— tell the modal which view is active
          onClose={() => setSelectedItem(null)}
          folderLabels={folderLabels}
        />
        )}
      </div>
    </div>
  );
}

export default App;
