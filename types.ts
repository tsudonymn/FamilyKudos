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
  uuid: string; // Unique identifier for external tracking
  description: string;
  memberId: number;
  appreciatorIds: number[]; // Stores IDs of members who thanked the task
  timestamp: string; // Storing as ISO string for localStorage compatibility
}

export interface User {
  name: string;
  email: string;
  picture: string;
}