import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
        <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-30 ring-1 ring-black ring-opacity-5 py-1">
          <div className="px-4 py-2 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
            >
              <SettingsIcon className="w-5 h-5 text-slate-500" />
              <span>Family Settings</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
            >
              <LogoutIcon className="w-5 h-5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
