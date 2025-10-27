import { useState, useEffect } from 'react';

const operators = ['=', '!=', '>', '>=', '<', '<='];

export default function FilterPanel({ data, onFilter, onReset, onSort }) {
  const [parameters, setParameters] = useState([]);
  const [conditions, setConditions] = useState([{ parameter: '', operator: '=', value: '' }]);
  const [sortParam, setSortParam] = useState('');

  useEffect(() => {
    if (!data || data.length === 0) {
      setParameters([]);   
      return;
    }
  
    if (data[0].params) {
      const keys = Object.keys(data[0].params).filter(
        (key) => typeof data[0].params[key] === "number"
      );
      setParameters(keys);
    }
  }, [data]);

  const handleChange = (index, key, value) => {
    const updated = [...conditions];
    updated[index][key] = value;
    setConditions(updated);
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { parameter: '', operator: '=', value: '' }]);
  };

  const handleApply = () => {
    const filterObject = {};
    conditions.forEach(({ parameter, operator, value }) => {
      if (parameter && operator && value !== '') {
        if (!filterObject[parameter]) filterObject[parameter] = [];
        filterObject[parameter].push({ operator, value: parseFloat(value) });
      }
    });
    onFilter(filterObject);
  };

  const handleReset = () => {
    setConditions([{ parameter: '', operator: '=', value: '' }]);
    setSortParam('');
    onReset();
  };

  const handleSort = () => {
    onSort(sortParam);
  };

return (
  <div className="bg-gray p-4 rounded shadow">
    <h2 className="text-lg font-semibold mb-2">Filter by Parameters</h2>

    {(!data || data.length === 0) ? (
      <p className="text-slate-400 text-sm italic">
        Upload a dataset to enable filters.
      </p>
    ) : (
      <>
        {conditions.map((cond, i) => (
          <div key={i} className="flex items-center space-x-2 mb-2">
            <select
              disabled={parameters.length === 0}
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100"
              value={cond.parameter}
              onChange={(e) => handleChange(i, 'parameter', e.target.value)}
            >
              <option value="">Select parameter</option>
              {parameters.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              disabled={parameters.length === 0}
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100"
              value={cond.operator}
              onChange={(e) => handleChange(i, 'operator', e.target.value)}
            >
              {operators.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="value"
              disabled={parameters.length === 0}
              className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100"
              value={cond.value}
              onChange={(e) => handleChange(i, 'value', e.target.value)}
            />
          </div>
        ))}

        <div className="space-x-2 mb-4">
          <button onClick={handleAddCondition} disabled={parameters.length === 0} className="bg-blue-600 text-white text-sm px-3 py-1 rounded disabled:opacity-40">+ Add Condition</button>
          <button onClick={handleApply} disabled={parameters.length === 0} className="bg-blue-600 text-white text-sm px-3 py-1 rounded disabled:opacity-40">Apply Filters</button>
          <button onClick={handleReset} disabled={parameters.length === 0} className="bg-blue-600 text-white text-sm px-3 py-1 rounded disabled:opacity-40">Reset Filters</button>
        </div>

        <div className="mb-4">
          <label className="mr-2 font-medium">Sort by:</label>
          <select
            disabled={parameters.length === 0}
            className="h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-slate-100"
            value={sortParam}
            onChange={(e) => setSortParam(e.target.value)}
          >
            <option value="">Select parameter</option>
            {parameters.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={handleSort} disabled={parameters.length === 0} className="bg-blue-600 text-white text-sm px-3 py-1 rounded disabled:opacity-40">Sort</button>
        </div>
      </>
    )}
  </div>
);
}
