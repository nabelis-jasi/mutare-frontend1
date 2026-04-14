
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PARAMETERS from '../config/parameters';

const DistributionChart = ({ data, onFilterChange }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data && data.length) {
      // Transform data for recharts
      const transformed = data.map(item => ({
        name: item.label || item.value,
        count: item.count,
      }));
      setChartData(transformed);
    }
  }, [data]);

  const handleBarClick = (entry) => {
    if (onFilterChange && entry && entry.activeLabel) {
      onFilterChange(entry.activeLabel);
    }
  };

  if (!chartData.length) {
    return <div className="distribution-chart-empty">No distribution data available.</div>;
  }

  return (
    <div className="distribution-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} onClick={handleBarClick}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill={PARAMETERS.THEME.PRIMARY || '#2c7da0'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

DistributionChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
    count: PropTypes.number,
  })),
  onFilterChange: PropTypes.func,
};

export default DistributionChart;
