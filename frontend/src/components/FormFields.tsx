import React, { memo } from 'react';

// Types for form fields
interface BaseFieldProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}

export const TextField = memo(({
  type,
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder
}: TextFieldProps) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      required
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:text-white disabled:opacity-70 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-200"
      disabled={disabled}
    />
  </div>
));
TextField.displayName = 'TextField';

export const SelectField = memo(({
  type,
  id,
  label,
  value,
  onChange,
  options,
  disabled
}: SelectFieldProps) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="w-full px-4 py-3 pr-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:text-white disabled:opacity-70 transition-colors duration-200 appearance-none cursor-pointer"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Dropdown arrow indicator */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
));
SelectField.displayName = 'SelectField'; 