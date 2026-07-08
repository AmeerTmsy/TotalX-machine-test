import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import registrationIllustration from "../assets/registration-illustration.png";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  clearAuthError,
  registerUserInDb,
  selectAuthError,
  selectAuthLoading,
} from "../app/features/auth/authSlice";
import {
  registerSchema,
  type RegisterFormData,
} from "../validations/register.schema";

const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authLoading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      agree: false,
    },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setSubmitError("");
    dispatch(clearAuthError());

    try {
      await dispatch(registerUserInDb({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      })).unwrap();

      navigate("/");
    } catch (error) {
      setSubmitError(typeof error === "string" ? error : "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-20 items-center">
        {/* Left */}
        <div className="hidden lg:flex justify-center">
          <div className="rounded-[30px] overflow-hidden w-125 h-175 flex items-center justify-center">
            <img
              src={registrationIllustration}
              alt="Signup"
              className="max-h-full object-contain"
            />
          </div>
        </div>

        {/* Right */}
        <div className="max-w-xl w-full">
          <h1 className="text-5xl font-semibold text-gray-800">
            Sign up
          </h1>

          <p className="mt-5 text-lg text-gray-500">
            Let's get you all set up so you can access your personal account.
            {/* Complete your profile for {user.mobileNumber}. */}
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-12 space-y-8"
            noValidate
          >
            {(submitError || authError) && (
              <p className="text-sm text-red-500">
                {submitError || authError}
              </p>
            )}
            {/* First & Last Name */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative">
                  <label className="absolute -top-3 left-4 bg-white px-2 text-lg text-gray-700">
                    First Name
                  </label>

                  <input
                    type="text"
                    {...register("firstName")}
                    className={`w-full h-16 px-5 border rounded-md text-xl outline-none ${errors.firstName
                        ? "border-red-500"
                        : "border-gray-400 focus:border-indigo-500"
                      }`}
                  />
                </div>

                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <label className="absolute -top-3 left-4 bg-white px-2 text-lg text-gray-700">
                    Last Name
                  </label>

                  <input
                    type="text"
                    {...register("lastName")}
                    className={`w-full h-16 px-5 border rounded-md text-xl outline-none ${errors.lastName
                        ? "border-red-500"
                        : "border-gray-400 focus:border-indigo-500"
                      }`}
                  />
                </div>

                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <label className="absolute -top-3 left-4 bg-white px-2 text-lg text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  {...register("email")}
                  className={`w-full h-16 px-5 border rounded-md text-xl outline-none ${errors.email
                      ? "border-red-500"
                      : "border-gray-400 focus:border-indigo-500"
                    }`}
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Agreement */}
            <div>
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("agree")}
                  className="w-6 h-6 accent-indigo-600"
                />

                <span className="text-lg text-gray-700">
                  I agree to all the{" "}
                  <span className="text-red-400 font-medium">Terms</span> and{" "}
                  <span className="text-red-400 font-medium">
                    Privacy Policies
                  </span>
                </span>
              </label>

              {errors.agree && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.agree.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full h-14 rounded-md bg-indigo-600 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting || authLoading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-center text-lg text-gray-700">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-red-400 hover:underline"
              >
                Login
              </Link>
            </p>

            <div className="flex items-center gap-5 pt-5">
              <div className="flex-1 border-t border-gray-200" />
              <div className="flex-1 border-t border-gray-200" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;