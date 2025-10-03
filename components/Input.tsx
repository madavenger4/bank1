import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-3 py-2 bg-subtle border border-slate-600 rounded-md shadow-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-light focus:border-primary-light transition duration-200"
        {...props}
      />
    </div>
  );
};

export default Input;