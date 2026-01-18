import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  FirestoreError,
  Firestore
} from 'firebase/firestore';
import { FamilyMember, Task } from '../types';

const COLLECTION_NAME = 'familyGroups';

interface StorageData {
  tasks: Task[];
  members: FamilyMember[];
  quickTaskSeeds?: string[];
}

// Helper to ensure DB is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Cloud database is not configured. Please add your Firebase Configuration in Settings.");
  }
  return db;
};

export const createFamilyGroup = async (data: StorageData): Promise<string> => {
  try {
    const database = getDb();
    const docRef = await addDoc(collection(database, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error("Error creating family group:", error);
    throw error;
  }
};

export const getFamilyGroup = async (id: string): Promise<StorageData> => {
  try {
    const database = getDb();
    const docRef = doc(database, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as StorageData;
    } else {
      throw new Error("Family group not found");
    }
  } catch (error) {
    console.error("Error fetching family group:", error);
    throw error;
  }
};

export const updateFamilyGroup = async (id: string, data: StorageData): Promise<void> => {
  try {
    const database = getDb();
    const docRef = doc(database, COLLECTION_NAME, id);
    // Use merge: true to avoid overwriting fields if we partially update
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error updating family group:", error);
    throw error;
  }
};

export const subscribeToFamilyGroup = (
  id: string, 
  onUpdate: (data: StorageData) => void,
  onError: (error: FirestoreError) => void
) => {
  try {
    const database = getDb();
    const docRef = doc(database, COLLECTION_NAME, id);
    
    // onSnapshot provides real-time updates
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        onUpdate(doc.data() as StorageData);
      }
    }, onError);
  } catch (e) {
    // If DB isn't ready, we can't subscribe. 
    // Return a no-op unsubscribe function.
    console.error("Cannot subscribe:", e);
    return () => {};
  }
};