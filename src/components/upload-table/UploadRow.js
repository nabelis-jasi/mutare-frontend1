// src/components/engineer/UploadRow.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Define constants for field types (matching your backend)
const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTAREA: 'textarea',
  DATE: 'date',
  LOCATION: 'location',
  PHOTO: 'photo',
  README: 'readme',
  BRANCH: 'branch',
  GROUP: 'group',
};

// Helper to check if a field is a location (has lat, lon, accuracy)
const isLocationField = (fieldType) => fieldType === FIELD_TYPES.LOCATION;

export default function UploadRow({
  rowIndex,
  dataRow,               // the data object for this row (e.g., manhole properties)
  fields,                // array of field definitions (label, type, key, etc.)
  errors,                // array of error objects { fieldKey, message }
  expandedErrorRows,     // array of row indices that have errors expanded
  filterByFailed,        // if true, only show rows with errors (for filtering)
  isEven,                // whether this is an even row (for alternating styling)
  onToggleExpandError,   // callback to expand/collapse error details
}) {
  // If this is an even row (or odd, depending on your logic), you might render an error detail row
  // For simplicity, we render the data row normally and show error badges inline.
  // If you want a separate error row like in the original, you can adapt.

  // Helper to get error message for a specific field key
  const getFieldError = (fieldKey) => {
    if (!errors) return null;
    return errors.find(err => err.fieldKey === fieldKey)?.message;
  };

  return (
    <tr className={`upload-row ${rowIndex % 2 === 0 ? 'even' : 'odd'}`}>
      {fields.map((field, idx) => {
        // First column: usually the UUID or identifier
        if (idx === 0) {
          const identifier = dataRow.id || dataRow.uuid || dataRow.manhole_id || dataRow.pipe_id || '—';
          return <td key="identifier">{identifier}</td>;
        }

        const fieldKey = field.key || field.ref;
        const value = dataRow[fieldKey];
        const error = getFieldError(fieldKey);
        const hasError = !!error;

        // Handle location field (split into lat/lon/accuracy)
        if (isLocationField(field.type)) {
          const lat = dataRow[`${fieldKey}_lat`] || value?.lat || '';
          const lng = dataRow[`${fieldKey}_lng`] || value?.lng || '';
          const accuracy = dataRow[`${fieldKey}_accuracy`] || value?.accuracy || '';
          return (
            <td key={fieldKey} className={hasError ? 'has-error' : ''}>
              <div>
                {hasError && <span className="error-icon">⚠️</span>}
                <span className="location-coords">
                  {lat ? `${lat}, ${lng}` : '—'}
                  {accuracy && ` (±${accuracy}m)`}
                </span>
                {hasError && <span className="error-message">{error}</span>}
              </div>
            </td>
          );
        }

        // Handle group fields (if any) – you can expand recursively
        if (field.type === FIELD_TYPES.GROUP && field.children) {
          // For simplicity, render children inline or as separate columns
          return field.children.map(child => (
            <td key={child.key}>
              {dataRow[child.key] || '—'}
            </td>
          ));
        }

        // Default rendering
        return (
          <td key={fieldKey} className={hasError ? 'has-error' : ''}>
            <div>
              {hasError && <span className="error-icon">⚠️</span>}
              <span>{value !== undefined && value !== null ? String(value) : '—'}</span>
              {hasError && <span className="error-message">{error}</span>}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

UploadRow.propTypes = {
  rowIndex: PropTypes.number.isRequired,
  dataRow: PropTypes.object.isRequired,
  fields: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.string,
    children: PropTypes.array,
  })).isRequired,
  errors: PropTypes.arrayOf(PropTypes.shape({
    fieldKey: PropTypes.string,
    message: PropTypes.string,
  })),
  expandedErrorRows: PropTypes.array,
  filterByFailed: PropTypes.bool,
  isEven: PropTypes.bool,
  onToggleExpandError: PropTypes.func,
};
