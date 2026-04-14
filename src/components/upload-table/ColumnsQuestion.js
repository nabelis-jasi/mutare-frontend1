// src/components/shared/ColumnsQuestions.jsx
import React from 'react';
import { Cell, Column } from 'fixed-data-table-2';
import PropTypes from 'prop-types';
import PARAMETERS from '../../config/parameters';

/**
 * Dynamically generates table columns based on the mapping of form fields.
 * Handles location fields specially (splits into latitude, longitude, accuracy).
 *
 * @param {Object} props
 * @param {Object} props.mapping - Mapping of field IDs to display names/types (e.g., { input_ref: { map_to: 'Manhole ID', type: 'text' } })
 * @param {Array} props.reverseEntries - Array of submission objects (each containing `data.entry.answers` or similar structure)
 */
const ColumnsQuestions = ({ mapping, reverseEntries }) => {
  if (!mapping || !reverseEntries) return null;

  return Object.values(mapping).map((entryMapping) => {
    // Handle location type: split into latitude, longitude, accuracy columns
    if (entryMapping.type === PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE) {
      const parts = {
        latitude: 'lat_',
        longitude: 'long_',
        accuracy: 'accuracy_',
      };

      return Object.entries(parts).map(([key, prefix]) => (
        <Column
          key={`${prefix}${entryMapping.map_to}`}
          header={<Cell>{`${prefix}${entryMapping.map_to}`}</Cell>}
          cell={({ rowIndex }) => {
            const answerObj =
              reverseEntries[rowIndex]?.data?.entry?.answers?.[entryMapping.input_ref]?.answer;
            let value = '';
            if (answerObj && typeof answerObj === 'object') {
              if (key === 'latitude') value = answerObj.latitude ?? '';
              else if (key === 'longitude') value = answerObj.longitude ?? '';
              else if (key === 'accuracy') value = answerObj.accuracy ?? '';
            }
            return <Cell>{value}</Cell>;
          }}
          width={150}
        />
      ));
    }

    // Default column for other field types
    return (
      <Column
        key={entryMapping.map_to}
        header={<Cell>{entryMapping.map_to}</Cell>}
        cell={({ rowIndex }) => {
          const answer =
            reverseEntries[rowIndex]?.data?.entry?.answers?.[entryMapping.input_ref]?.answer ?? '';
          return <Cell>{answer}</Cell>;
        }}
        width={200}
      />
    );
  });
};

ColumnsQuestions.propTypes = {
  mapping: PropTypes.object.isRequired,
  reverseEntries: PropTypes.array.isRequired,
};

export default ColumnsQuestions;
