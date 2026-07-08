import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper to strip any accidental surrounding quotes from env variables in Vercel
const getEnv = (value: string | undefined): string => {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
};

const apiKey = getEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const authDomain = getEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const projectId = getEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const storageBucket = getEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
const messagingSenderId = getEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
const appId = getEnv(import.meta.env.VITE_FIREBASE_APP_ID);
const measurementId = getEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);

if (!apiKey) {
  console.error(
    "Firebase API Key is missing! Please check your Vercel Environment Variables: " +
    "ensure they have the 'VITE_' prefix (e.g., VITE_FIREBASE_API_KEY) and that you redeployed the app."
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

const app = initializeApp(firebaseConfig);

export const authentication = getAuth(app);
export const db = getFirestore(app);

// Use Firebase test phone numbers on localhost without real reCAPTCHA/SMS.
if (import.meta.env.VITE_DEV_MODE === "DEVELOPMENT") {
  authentication.settings.appVerificationDisabledForTesting = true;
}

