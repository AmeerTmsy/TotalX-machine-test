import { FirebaseError } from "firebase/app";

//  Extracts the Firebase error code from an unknown error object.
export const getFirebaseErrorCode = (error: unknown): string | undefined => {
  if (error instanceof FirebaseError) {
    return error.code;
  }

  if (error instanceof Error) {
    const match = error.message.match(/auth\/[a-z-]+/i);
    if (match) {
      return match[0];
    }
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }

  return undefined;
};

export const getFirebaseErrorMessage = (error: unknown): string => {
  const code = getFirebaseErrorCode(error);

  switch (code) {
    case "auth/invalid-phone-number":
      return "Invalid phone number. Use a valid 10-digit Indian mobile number.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return "reCAPTCHA verification failed. Refresh the page and try again.";
    case "auth/operation-not-allowed":
      return "Phone sign-in is blocked. In Firebase Console enable Phone under Sign-in method, save it, then use your test number (8888888888) with OTP 111111.";
    case "auth/billing-not-enabled":
      return "Phone authentication requires billing on your Firebase project.";
    case "auth/missing-phone-number":
      return "Phone number is missing. Please enter your mobile number.";
    default:
      if (error instanceof Error && error.message) {
        if (error.message.includes("already been rendered")) {
          return "reCAPTCHA error. Please refresh the page and try again.";
        }
        return error.message.replace(/^Firebase:\s*/i, "");
      }
      return "Failed to send OTP. Please try again.";
  }
};
