import React from 'react';

const Avatar = ({ initial, color }: { initial: string; color: string }) => (
  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-bold text-white text-xl shadow-sm flex-shrink-0`}>
    {initial}
  </div>
);

export default Avatar;
