
// Helper to read parsed env config from local storage
const getStoredEnv = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem('familyKudos_envConfig');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

const storedEnv = getStoredEnv();

// Helper to get variable from stored config, process.env, or fallback
const getEnvVar = (key: string, processEnvVar: string | undefined, fallback?: string): string => {
  return storedEnv[key] || processEnvVar || fallback || "";
};

export const config = {
  // Google Auth Configuration
  googleClientId: getEnvVar('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID, "1088368351089-8dn0g5auntt7338ch65gp63jqdqsi2oa.apps.googleusercontent.com"),

  // Firebase Configuration
  firebase: {
    apiKey: getEnvVar('FIREBASE_API_KEY', process.env.FIREBASE_API_KEY, "YOUR_API_KEY"),
    authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', process.env.FIREBASE_AUTH_DOMAIN, "YOUR_PROJECT_ID.firebaseapp.com"),
    projectId: getEnvVar('FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID, "YOUR_PROJECT_ID"),
    storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', process.env.FIREBASE_STORAGE_BUCKET, "YOUR_PROJECT_ID.appspot.com"),
    messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', process.env.FIREBASE_MESSAGING_SENDER_ID, "YOUR_MESSAGING_SENDER_ID"),
    appId: getEnvVar('FIREBASE_APP_ID', process.env.FIREBASE_APP_ID, "YOUR_APP_ID")
  },

  // Gemini API Configuration
  // Note: The API key is injected automatically into process.env.API_KEY in the AI Studio environment
  geminiApiKey: getEnvVar('API_KEY', process.env.API_KEY)
};
