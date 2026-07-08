
import { z } from "zod";

export const registerSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    agree: z.boolean().refine((value) => value, { message: "You must accept the Terms and Privacy Policy." }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;