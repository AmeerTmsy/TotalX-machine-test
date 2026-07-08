import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARTn5ycRcpevbEUwU7TIOgaciaS-AuoUw",
  authDomain: "phone-number-varificatio-b6890.firebaseapp.com",
  projectId: "phone-number-varificatio-b6890",
  storageBucket: "phone-number-varificatio-b6890.firebasestorage.app",
  messagingSenderId: "978635340682",
  appId: "1:978635340682:web:066cd421bef75f27caa673",
  measurementId: "G-YTN02TTQKR"
};

const app = initializeApp(firebaseConfig);

export const authentication = getAuth(app);
export const db = getFirestore(app);

// Use Firebase test phone numbers on localhost without real reCAPTCHA/SMS.
if (import.meta.env.VITE_DEV_MODE === "true") {
  authentication.settings.appVerificationDisabledForTesting = true;
}
