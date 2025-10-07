import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";
import CaptionParamPicker from "./CaptionParamPicker";

export default function VisualizationPanel({ filteredData, onSelectItem, selectedItem }) {
  // 2D axes
  const [x2d, setX2d] = useState("");
  const [y2d, setY2d] = useState("");
  // 3D axes
  const [x3d, setX3d] = useState("");
  const [y3d, setY3d] = useState("");
  const [z3d, setZ3d] = useState("");
  // Parallel coordinates
  const [pcParams, setPcParams] = useState([]);
  const [pcDiv, setPcDiv] = useState(null);
  const [pcColorParam, setPcColorParam] = useState(""); 
  const [numericParams, setNumericParams] = useState([]);
  const [chartFont, setChartFont] = useState("Arial, sans-serif");
  

  const AXIS = '#6b7280';            // labels/ticks
  const GRID_SOLID = '#64748b';      // slate-500 solid (no alpha)
  const GRID_BOLD  = '#475569';

  const basePlotLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',   
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 80, r: 80, t: 80, b: 80 },
    font: { color: AXIS, family: chartFont },
  };

  const downloadConfig = {
    displaylogo: false,
    toImageButtonOptions: { format: 'png', scale: 2, filename: 'morpho-plot'},
  };

 // subtle grid (slate-400 @ 25%)

const axis2D = {
  showline: true,
  linewidth: 1,
  linecolor: AXIS,
  tickcolor: AXIS,
  tickfont: { color: AXIS },
  title: { font: { color: AXIS } },
  gridcolor: GRID_SOLID,
  zerolinecolor: AXIS,
};

const axis3D = {
    color: AXIS,
    tickfont: { color: AXIS },
    title: { font: { color: AXIS } },
    showgrid: true,
    gridcolor: GRID_SOLID,
    gridwidth: 2,
    zeroline: true,
    zerolinecolor: GRID_BOLD,
    zerolinewidth: 2,
    showbackground: true,
    backgroundcolor: 'rgba(0,0,0,0)',
  };

  useEffect(() => {
    if (filteredData.length > 0) {
      const keys = Object.keys(filteredData[0].params).filter(
        (k) => typeof filteredData[0].params[k] === "number"
      );
      setNumericParams(keys);
      if (!pcColorParam && keys.length > 0) {
        setPcColorParam(keys[0]);   
      }
      if (!x2d) setX2d(keys[0]);
      if (!y2d) setY2d(keys[1] || keys[0]);
      if (!x3d) setX3d(keys[0]);
      if (!y3d) setY3d(keys[1] || keys[0]);
      if (!z3d) setZ3d(keys[2] || keys[0]);

      if (pcParams.length < 2) {
        const initial = keys.slice(0, Math.max(2, Math.min(3, keys.length)));
        setPcParams(initial);
      }
    }
  }, [filteredData]);

  useEffect(() => {
    if (!pcDiv) return;
    const handler = () => {
      const dims = pcDiv?.data?.[0]?.dimensions || [];
      const sel = indicesMatchingBrush(dims, filteredData);
      if (sel.length === 1) onSelectItem?.(filteredData[sel[0]]);
    };
    pcDiv.on("plotly_restyle", handler);
    return () => {
      if (pcDiv.off) {
        pcDiv.off("plotly_restyle", handler);   // ✅ correct cleanup
      }
    };
  }, [pcDiv, filteredData, onSelectItem]);

  const ids = filteredData.map((d) => `ID: ${d.id}`);
  const x2dVals = filteredData.map((d) => d.params[x2d]);
  const y2dVals = filteredData.map((d) => d.params[y2d]);
  const x3dVals = filteredData.map((d) => d.params[x3d]);
  const y3dVals = filteredData.map((d) => d.params[y3d]);
  const z3dVals = filteredData.map((d) => d.params[z3d]);
  

  const pcDimensions = pcParams.map((param) => {
    const vals = filteredData.map((d) => d.params[param]);
    return { label: param, values: vals, range: [Math.min(...vals), Math.max(...vals)] };
  });

  function indicesMatchingBrush(dimensions, rows) {
    if (!dimensions?.length) return rows.map((_, i) => i);
    const byLabel = Object.fromEntries(dimensions.map((d) => [d.label, d]));
    const out = [];
    rows.forEach((row, idx) => {
      let ok = true;
      for (const label of Object.keys(byLabel)) {
        const dim = byLabel[label];
        const cr = dim.constraintrange;
        if (cr == null) continue;
        const v = row.params[label];
        const inRange = Array.isArray(cr?.[0])
          ? cr.some(([lo, hi]) => v >= lo && v <= hi)
          : v >= cr[0] && v <= cr[1];
        if (!inRange) { ok = false; break; }
      }
      if (ok) out.push(idx);
    });
    return out;
  }

  const handlePointClick = (e) => {
    if (selectedItem) return;
    const p = e.points?.[0];
    if (!p) return;
    let idx = -1;
    const m = p.text?.match(/ID: (\d+)/);
    if (m) {
      const clickedId = parseInt(m[1], 10);
      idx = filteredData.findIndex((d) => d.id === clickedId);
    }
    if (idx < 0 && typeof p.pointNumber === "number") idx = p.pointNumber;
    if (idx >= 0) onSelectItem?.(filteredData[idx]);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Visualizations</h2>

      <div className="flex flex-col gap-2 w-60 mb-4">
  <label className="text-slate-400 font-semibold">Chart Font</label>
  <select
    className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
    value={chartFont}
    onChange={(e) => setChartFont(e.target.value)}
  >
    <option value="Arial, sans-serif">Arial</option>
    <option value="'Times New Roman', serif">Times New Roman</option>
    <option value="'Courier New', monospace">Courier New</option>
    <option value="Verdana, sans-serif">Verdana</option>
  </select>
</div>

      {/* 2D controls */}
      <div className="flex flex-wrap items-end gap-4 mb-3">
        <div className="flex flex-col gap-2 w-60">
          <label className="text-slate-400 font-semibold">Scatter Plot: X</label>
          <select className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={x2d} onChange={(e) => setX2d(e.target.value)}>
            {numericParams.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-60">
          <label className="text-slate-400 font-semibold">Y</label>
          <select className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={y2d} onChange={(e) => setY2d(e.target.value)}>
            {numericParams.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
  <Plot
    className="w-full"
    useResizeHandler
    style={{ width: '100%', height: 600 }}
    data={[
      {
        x: x2dVals,
        y: y2dVals,
        type: 'scatter',
        mode: 'markers',
        marker: {
          size: 12,                // bigger dots
          opacity: 0.85,
          color: 'rgba(99,102,241,0.85)',
        },
        hovertemplate:
  `%{text}<br><b>${x2d}</b>: %{x}<br><b>${y2d}</b>: %{y}<extra></extra>`,
text: ids,
      },
    ]}
    layout={{
        ...basePlotLayout,
        title: { text: `${x2d} vs ${y2d}`, font: { color: AXIS } },
        xaxis: { ...axis2D, title: { text: x2d, font: { color: AXIS } } },
        yaxis: { ...axis2D, title: { text: y2d, font: { color: AXIS } } },
        hovermode: 'closest',
        hoverlabel: {
          bgcolor: '#f472b6',
          bordercolor: '#f472b6',
          font: { color: '#0b1220', size: 14 },
        },
        autosize: true,
      }}
    config={downloadConfig}
    onClick={handlePointClick}
  />
</div>


      {/* 3D controls */}
      <div className="flex flex-wrap items-end gap-4 mt-6 mb-3 justify-start">
        {[
          { label: "3D Plot: X", val: x3d, set: setX3d },
          { label: "Y", val: y3d, set: setY3d },
          { label: "Z", val: z3d, set: setZ3d },
        ].map(({ label, val, set }) => (
          <div className="flex flex-col gap-2 w-full sm:w-60" key={label}>
            <label className="text-slate-400 font-semibold">{label}</label>
            <select className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={val} onChange={(e) => set(e.target.value)}>
              {numericParams.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-lg w-full max-w-5xl mx-auto mt-6">
      <Plot
  className="w-full"
  useResizeHandler
  style={{ width: "100%", height: 700 }}
  data={[
    {
      x: x3dVals,
      y: y3dVals,
      z: z3dVals,
      text: ids,
      type: "scatter3d",
      mode: "markers",
      marker: {
        size: 8,
        opacity: 0.9,
        color: "rgba(236,72,153,0.9)",
      },
      hovertemplate:
        `%{text}<br><b>${x3d}</b>: %{x}<br><b>${y3d}</b>: %{y}<br><b>${z3d}</b>: %{z}<extra></extra>`,
    },
  ]}
  layout={{
    ...basePlotLayout,
    autosize: true,
    width: 1000,
    height: 800,
    margin: { l: 80, r: 80, t: 40, b: 60 }, 
    title: { 
      text: `${x3d} vs ${y3d} vs ${z3d}`, 
      font: { color: AXIS, size: 26 }, 
      y: 0.96, 
    },
    font: { family: chartFont, color: AXIS, size: 18 }, 
    scene: {
      bgcolor: "rgba(0,0,0,0)",
      aspectmode: "cube",
      xaxis: { ...axis3D, title: { text: x3d, font: { size: 20 } }, tickfont: { size: 16, color: AXIS } },
      yaxis: { ...axis3D, title: { text: y3d, font: { size: 20 } }, tickfont: { size: 16, color: AXIS } },
      zaxis: { ...axis3D, title: { text: z3d, font: { size: 20 } }, tickfont: { size: 16, color: AXIS } },
    },
  }}
  config={{
    displaylogo: false,
    modeBarButtonsToRemove: ["toImage"],   // remove default download
    modeBarButtonsToAdd: [
        {
          name: "Download plot (large font)",
          icon: Plotly.Icons.camera,
          click: (gd) => {
            // make a deep copy of figure
            const figure = {
              data: gd.data,
              layout: {
                ...gd.layout,
                font: { family: chartFont, size: 38, color: AXIS },
                title: { ...gd.layout.title, font: { size: 44, color: AXIS } },
                scene: {
                  ...gd.layout.scene,
                  xaxis: {
                    ...gd.layout.scene.xaxis,
                    title: { text: gd.layout.scene.xaxis.title.text, font: { size: 36 } ,standoff: 30,},
                    tickfont: { size: 20 },
                  },
                  yaxis: {
                    ...gd.layout.scene.yaxis,
                    title: { text: gd.layout.scene.yaxis.title.text, font: { size: 36 } ,standoff: 30,},
                    tickfont: { size: 20 },
                  },
                  zaxis: {
                    ...gd.layout.scene.zaxis,
                    title: { text: gd.layout.scene.zaxis.title.text, font: { size: 36 } ,standoff: 30,},
                    tickfont: { size: 20 },
                  },
                },
              },
            };
        
            // generate image directly from the figure object (no relayout flicker)
            Plotly.toImage(figure, {
              format: "png",
              width: 2000,
              height: 1600,
              scale: 2,
            }).then((url) => {
              const a = document.createElement("a");
              a.href = url;
              a.download = "morpho-3dplot.png";
              a.click();
            });
          },
        }
    ],
  }}
  onClick={handlePointClick}
/>

      </div>

      {/* Parallel Coordinates */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
        <div className="text-lg font-semibold mb-3">Parallel Coordinates</div>
        <div className="flex flex-col gap-2 mb-2">
          <span className="text-slate-400 font-semibold">Choose 2 or more parameters</span>
          <CaptionParamPicker
            options={numericParams}
            value={pcParams}
            onChange={(next) => {
              if (next.length < 2) return alert("Please select at least 2 parameters.");
              setPcParams(next);
            }}
            max={numericParams.length}
            placeholder="Pick parameters for parallel coordinates…"
          />
          <span className="text-xs text-slate-400">
            Tip: drag on an axis to brush a range. If brushing narrows to one line, its details will open.
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-2 shadow">
        <div className="flex flex-col gap-2 mb-2">
  <label className="text-slate-400 font-semibold">Color by parameter</label>
  <select
    className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100"
    value={pcColorParam}
    onChange={(e) => setPcColorParam(e.target.value)}
  >
    {numericParams.map((p) => (
      <option key={p} value={p}>{p}</option>
    ))}
  </select>
</div>
          <Plot
            data={[{
              type: "parcoords",
              line: {
                color: pcColorParam
                  ? filteredData.map((d) => d.params[pcColorParam])
                  : filteredData.map((_, i) => i),
                colorscale: "Viridis",   // or any Plotly scale
                showscale: true,
              },
              dimensions: pcDimensions,
            }]}
            useResizeHandler
 style={{ width: '100%', height: 520 }}
 layout={{
  ...basePlotLayout,
  autosize: true,
  height: 600,
  margin: { l: 80, r: 80, t: 60, b: 40 },
  font: { family: chartFont, size: 20, color: AXIS },   
  title: { font: { size: 20, color: AXIS } },
}}
 config={{ responsive: true }}
            onInitialized={(fig, gd) => setPcDiv(gd)}
            onUpdate={(fig, gd) => setPcDiv(gd)}
          />
        </div>
      </div>
    </div>
  );
}
