import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div 
      className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down"
      role="alert"
    >
      <p>{message}</p>
    </div>
  );
};


const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-down {
    animation: fadeInDown 0.3s ease-out forwards;
}
`;
document.head.appendChild(style);
