import { useState, useEffect } from 'react';

const operators = ['=', '!=', '>', '>=', '<', '<='];

export default function FilterPanel({ data, onFilter, onReset, onSort }) {
  const [parameters, setParameters] = useState([]);
  const [conditions, setConditions] = useState([{ parameter: '', operator: '=', value: '' }]);
  const [sortParam, setSortParam] = useState('');

  useEffect(() => {
    if (data && data.length > 0 && data[0].params) {
      const keys = Object.keys(data[0].params).filter(
        (key) => typeof data[0].params[key] === 'number'
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
      {conditions.map((cond, i) => (
        <div key={i} className="flex items-center space-x-2 mb-2">
          <select
            className="border p-2 rounded"
            value={cond.parameter}
            onChange={(e) => handleChange(i, 'parameter', e.target.value)}
          >
            <option value="">parameter name...</option>
            {parameters.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            className="border p-2 rounded"
            value={cond.operator}
            onChange={(e) => handleChange(i, 'operator', e.target.value)}
          >
            {operators.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="parameter value..."
            className="border p-2 rounded"
            value={cond.value}
            onChange={(e) => handleChange(i, 'value', e.target.value)}
          />
        </div>
      ))}
      <div className="space-x-2 mb-4">
        <button
          onClick={handleAddCondition}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          + Add Condition
        </button>
        <button
          onClick={handleApply}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Reset Filters
        </button>
      </div>
      <div className="mb-4">
        <label className="mr-2 font-medium">Sort by:</label>
        <select
          className="border p-2 rounded mr-2"
          value={sortParam}
          onChange={(e) => setSortParam(e.target.value)}
        >
          <option value="">Select parameter</option>
          {parameters.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={handleSort}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Sort
        </button>
      </div>
    </div>
  );
}
