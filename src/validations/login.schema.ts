import { z } from "zod";

export const formatMobileNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    const mobile = digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits;

    return `+91${mobile}`;
};

export const loginSchema = z.object({
    mobileNumber: z.string().trim()
        .refine((value) => {
            const digits = value.replace(/\D/g, "");
            const mobile = digits.length === 12 && digits.startsWith("91")
                ? digits.slice(2)
                : digits;

            return /^[6-9]\d{9}$/.test(mobile);
        }, "Please enter a valid 10-digit mobile number")
        .transform(formatMobileNumber),
});

export const verifyOtpSchema = z.object({
    code: z.string().trim()
        .regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;