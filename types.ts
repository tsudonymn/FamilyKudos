import React from 'react';

// FIX: Add a global declaration for window.google to resolve TypeScript errors.
declare global {
  interface Window {
    google: any;
  }
}

export interface AvatarData {
  initial: string;
  color: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  avatar: AvatarData;
}

export interface Task {
  id: number;
  description: string;
  memberId: number;
  appreciationCount: number;
  timestamp: string; // Storing as ISO string for localStorage compatibility
}

export interface User {
  name: string;
  email: string;
  picture: string;
}
