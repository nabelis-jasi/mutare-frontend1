import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chartTypes = { bar: BarChart, line: LineChart, pie: PieChart };

export default function CustomChartBuilder({ data, availableFields }) {
  const [chartType, setChartType] = useState('bar');
  const [xField, setXField] = useState(availableFields[0]);
  const [yField, setYField] = useState(availableFields[1]);

  const ChartComponent = chartTypes[chartType];
  const chartData = data.map(d => ({ name: d[xField], value: d[yField] }));

  return (
    <div className="chart-builder">
      <select value={chartType} onChange={e => setChartType(e.target.value)}>
        <option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie</option>
      </select>
      <select value={xField} onChange={e => setXField(e.target.value)}>{availableFields.map(f => <option key={f}>{f}</option>)}</select>
      <select value={yField} onChange={e => setYField(e.target.value)}>{availableFields.map(f => <option key={f}>{f}</option>)}</select>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'pie' ? (
          <PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label /></PieChart>
        ) : (
          <ChartComponent data={chartData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#8884d8" /></ChartComponent>
        )}
      </ResponsiveContainer>
    </div>
  );
}
