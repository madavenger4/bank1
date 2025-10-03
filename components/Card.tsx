import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-surface rounded-xl border border-slate-700 overflow-hidden animate-slide-in-up ${className}`}>
      {title && <h2 className="text-xl font-bold text-slate-100 p-6 border-b border-slate-700">{title}</h2>}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;