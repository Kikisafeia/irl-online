import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: (id: string) => void;
  duration?: number; // Duration in milliseconds, default 5000
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Give some time for fade-out animation before removing from DOM
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }[type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  }[type];

  return (
    <div
      className={`relative flex items-center justify-between p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out ${bgColor} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ minWidth: '250px' }}
    >
      <div className="flex items-center">
        <Icon size={20} className="mr-2" />
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <XCircle size={16} />
      </button>
    </div>
  );
};

export default Toast;
