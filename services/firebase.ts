import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { config } from '../config';

let app;
let db: Firestore | null = null;

// Validate that we have real configuration values and not placeholders
const { apiKey, projectId } = config.firebase;
const isConfigured = apiKey && 
                     apiKey !== "YOUR_API_KEY" && 
                     projectId && 
                     projectId !== "YOUR_PROJECT_ID";

if (isConfigured) {
  try {
    app = initializeApp(config.firebase);
    db = getFirestore(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.log("Firebase not configured. Cloud sync disabled.");
}

export { db };