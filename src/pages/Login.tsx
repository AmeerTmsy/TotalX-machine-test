import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import Logo from "../assets/logo.png";
import loginIllustration from "../assets/login-illustration.png";
import { useAppDispatch } from "../app/hooks";
import { checkUserAfterOtp } from "../app/features/auth/authSlice";
import { authentication } from "../config/firebase";
import { getFirebaseErrorMessage } from "../utils/firebaseHelpers";
import {
  loginSchema,
  verifyOtpSchema,
  type LoginFormData,
  type VerifyOtpFormData,
} from "../validations/login.schema";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaParentRef = useRef<HTMLDivElement>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [phoneSendError, setPhoneSendError] = useState("");

  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobileNumber: "" },
    mode: "onBlur",
  });

  const {
    setValue: setOtpValue,
    control: otpControl,
    reset: resetOtpForm,
    setError,
    clearErrors,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
    mode: "onChange",
  });

  const otpCode = useWatch({ control: otpControl, name: "code" }) ?? "";

  const clearRecaptchaVerifier = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // Widget might already be cleared.
      }
      recaptchaVerifierRef.current = null;
    }

    if (recaptchaParentRef.current) {
      recaptchaParentRef.current.innerHTML = "";
    }
  }, []);

  const createRecaptchaVerifier = useCallback(() => {
    clearRecaptchaVerifier();

    const parent = recaptchaParentRef.current;
    if (!parent) {
      throw new Error("reCAPTCHA container not found.");
    }

    const container = document.createElement("div");
    container.id = `recaptcha-${Date.now()}`;
    parent.appendChild(container);

    const verifier = new RecaptchaVerifier(authentication, container.id, {
      size: "invisible",
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  }, [clearRecaptchaVerifier]);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    const verifier = createRecaptchaVerifier();

    try {
      return await signInWithPhoneNumber(authentication, phoneNumber, verifier);
    } catch (error) {
      clearRecaptchaVerifier();
      throw error;
    }
  }, [clearRecaptchaVerifier, createRecaptchaVerifier]);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmationResult || isVerifying || code.length !== 6) {
      return;
    }

    setIsVerifying(true);
    clearErrors("code");

    try {
      await confirmationResult.confirm(code);
    } catch {
      setError("code", {
        message: "Invalid verification code. Please try again.",
      });
      setOtpValue("code", "");
      return;
    }

    try {
      const result = await dispatch(checkUserAfterOtp(mobileNumber)).unwrap();
      navigate(result.exists ? "/" : "/register");
    } catch (error) {
      setError("code", {
        message: typeof error === "string"
          ? error
          : "Could not verify your account. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [clearErrors, confirmationResult, dispatch, isVerifying, mobileNumber, navigate, setError, setOtpValue]);

  const handleOtpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpValue("code", digits, { shouldValidate: false });
    clearErrors("code");

    if (digits.length === 6) {
      void verifyOtp(digits);
    }
  };

  const onGetOtp: SubmitHandler<LoginFormData> = async (data) => {
    if (isSendingOtp) {
      return;
    }

    setMobileNumber(data.mobileNumber);
    setPhoneSendError("");
    setIsSendingOtp(true);

    try {
      const result = await sendOtp(data.mobileNumber);
      setConfirmationResult(result);
      setOtpSent(true);
      resetOtpForm();
    } catch (error) {
      setPhoneSendError(getFirebaseErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onVerify: SubmitHandler<VerifyOtpFormData> = (data) => {
    void verifyOtp(data.code);
  };

  const handleBackToLogin = () => {
    setOtpSent(false);
    setConfirmationResult(null);
    setPhoneSendError("");
    resetOtpForm();
    clearErrors("code");
    clearRecaptchaVerifier();
  };

  const handleResend = async () => {
    if (!mobileNumber || isSendingOtp) {
      return;
    }

    resetOtpForm();
    clearErrors("code");
    setIsSendingOtp(true);

    try {
      const result = await sendOtp(mobileNumber);
      setConfirmationResult(result);
    } catch (error) {
      setError("code", {
        message: getFirebaseErrorMessage(error),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  useEffect(() => {
    return () => clearRecaptchaVerifier();
  }, [clearRecaptchaVerifier]);

  // Handle Web OTP API for auto-filling codes from incoming SMS
  useEffect(() => {
    if (!otpSent || !("OTPCredential" in window)) {
      return;
    }

    const abortController = new AbortController();

    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: abortController.signal,
      } as CredentialRequestOptions)
      .then((credential) => {
        if (!credential || !("code" in credential)) {
          return;
        }

        const code = String((credential as { code: string }).code)
          .replace(/\D/g, "")
          .slice(0, 6);

        if (code.length === 6) {
          setOtpValue("code", code, { shouldValidate: false });
          void verifyOtp(code);
        }
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [otpSent, setOtpValue, verifyOtp]);

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col px-8 py-8 lg:px-16">
          <div>
            <img
              src={Logo}
              alt="Logo"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div className="flex flex-1 items-center justify-center lg:justify-start">
            <div className="w-full max-w-lg">
              {!otpSent ? (
                <>
                  <h1 className="text-5xl font-semibold tracking-tight text-gray-900 drop-shadow-md">
                    Login
                  </h1>

                  <p className="mt-5 text-lg text-gray-500">
                    Login to access your travelwise account
                  </p>

                  <form
                    onSubmit={(e) => void handlePhoneSubmit(onGetOtp)(e)}
                    className="mt-10 space-y-8"
                    noValidate
                  >
                    <div>
                      <div className="relative">
                        <label className="absolute -top-3 left-4 bg-white px-2 text-lg text-gray-700">
                          Enter mobile number
                        </label>

                        <input
                          type="tel"
                          {...registerPhone("mobileNumber")}
                          className={`h-16 w-full rounded-md border px-5 text-lg outline-none ${
                            phoneErrors.mobileNumber
                              ? "border-red-500"
                              : "border-gray-400 focus:border-indigo-500"
                          }`}
                        />
                      </div>

                      {phoneErrors.mobileNumber && (
                        <p className="mt-2 text-sm text-red-500">
                          {phoneErrors.mobileNumber.message}
                        </p>
                      )}

                      {phoneSendError && (
                        <p className="mt-2 text-sm text-red-500">
                          {phoneSendError}
                        </p>
                      )}
                    </div>

                    <div ref={recaptchaParentRef} className="min-h-px" />

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="h-14 w-full rounded-md bg-indigo-600 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingOtp ? "Sending..." : "Get OTP"}
                    </button>

                    <p className="text-center text-lg text-gray-700">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className="font-semibold text-red-400 hover:underline"
                      >
                        Sign up
                      </Link>
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex items-center gap-2 text-lg text-gray-700 transition hover:text-gray-900"
                  >
                    <span aria-hidden="true">&lt;</span>
                    Back to login
                  </button>

                  <h1 className="mt-8 text-5xl font-semibold tracking-tight text-gray-900 drop-shadow-md">
                    Verify code
                  </h1>

                  <p className="mt-5 text-lg text-gray-500">
                    An authentication code has been sent to {mobileNumber}.
                  </p>

                  <form
                    onSubmit={handleOtpSubmit(onVerify)}
                    className="mt-10 space-y-8"
                    noValidate
                  >
                    <div>
                      <div className="relative">
                        <label className="absolute -top-3 left-4 bg-white px-2 text-lg text-gray-700">
                          Enter Code
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={otpCode}
                          onChange={handleOtpChange}
                          className={`h-16 w-full rounded-md border px-5 text-lg tracking-[0.4em] outline-none ${
                            otpErrors.code
                              ? "border-red-500"
                              : "border-gray-400 focus:border-indigo-500"
                          }`}
                        />
                      </div>

                      {otpErrors.code && (
                        <p className="mt-2 text-sm text-red-500">
                          {otpErrors.code.message}
                        </p>
                      )}
                    </div>

                    <p className="text-lg text-gray-700">
                      Didn't receive a code?{" "}
                      <button
                        type="button"
                        onClick={() => void handleResend()}
                        className="font-semibold text-red-400 hover:underline"
                      >
                        Resend
                      </button>
                    </p>

                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length !== 6}
                      className="h-14 w-full rounded-md bg-indigo-600 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-center p-10 lg:flex">
          <div className="w-full max-w-2xl rounded-sm p-8">
            <img
              src={loginIllustration}
              alt="Login Illustration"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
