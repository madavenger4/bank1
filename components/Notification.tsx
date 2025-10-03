
import React, { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseStyles = 'fixed top-5 right-5 p-4 rounded-md shadow-lg text-white z-50 animate-fade-in';
  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">X</button>
    </div>
  );
};

export default Notification;
