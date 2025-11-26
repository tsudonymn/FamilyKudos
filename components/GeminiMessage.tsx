
import React, { useEffect, useState } from 'react';

interface GeminiMessageProps {
  message: string | null;
  onClose: () => void;
}

const GeminiMessage: React.FC<GeminiMessageProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Allow time for fade-out transition
  };

  if (!message) return null;

  return (
    <div 
      className={`fixed top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-lg z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
    >
      <div className="bg-gradient-to-r from-sky-400 to-blue-500 text-white p-4 rounded-lg shadow-2xl flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3 animate-pulse">✨</span>
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GeminiMessage;
