import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  FirestoreError 
} from 'firebase/firestore';
import { FamilyMember, Task } from '../types';

const COLLECTION_NAME = 'familyGroups';

interface StorageData {
  tasks: Task[];
  members: FamilyMember[];
}

export const createFamilyGroup = async (data: StorageData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    return docRef.id;
  } catch (error) {
    console.error("Error creating family group:", error);
    throw error;
  }
};

export const getFamilyGroup = async (id: string): Promise<StorageData> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
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
    const docRef = doc(db, COLLECTION_NAME, id);
    // Use merge: true to avoid overwriting fields if we partially update, 
    // though here we are syncing the whole state.
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
  const docRef = doc(db, COLLECTION_NAME, id);
  
  // onSnapshot provides real-time updates
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      // We pass the data to the callback.
      // Note: We might want to check doc.metadata.hasPendingWrites to avoid
      // "echo" updates from our own local writes, but React's diffing usually handles it.
      onUpdate(doc.data() as StorageData);
    }
  }, onError);
};