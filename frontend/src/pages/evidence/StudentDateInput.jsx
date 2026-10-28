import React from 'react';
import { parseFilterDate } from '../../utils/parseFilterDate';
import { formatDate } from '../../utils/formatDate';

export default function StudentDateInput({ label, value, onChange }) {
  return (
    <div className="student-date-field">
      <input
        type="text"
        placeholder="dd/mm/yyyy"
        maxLength={10}
        className="input-stu input-date"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="student-date-calendar" title={`Chọn lịch: ${label}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
        </svg>
        <input
          type="date"
          className="student-date-native"
          aria-label={`Chọn lịch: ${label}`}
          value={parseFilterDate(value) || ''}
          onChange={(event) => onChange(formatDate(event.target.value))}
          onClick={(event) => {
            if (typeof event.currentTarget.showPicker === 'function') {
              event.currentTarget.showPicker();
            }
          }}
        />
      </span>
    </div>
  );
}
