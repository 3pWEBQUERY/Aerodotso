import { z } from "zod";

// Auth validation schemas
export const emailSchema = z
  .string()
  .email("Bitte gib eine gültige E-Mail-Adresse ein");

export const passwordSchema = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Das Passwort muss Groß-, Kleinbuchstaben und eine Zahl enthalten"
  );

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(["student", "creator"], {
    message: "Bitte wähle eine Rolle aus",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein"),
});

// Document validation schemas
export const documentUploadSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(255, "Titel darf maximal 255 Zeichen lang sein"),
  type: z.enum(["pdf", "image", "note", "link"]),
  subject: z.string().optional(),
  topic: z.string().optional(),
});

export const documentSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Suchanfrage ist erforderlich")
    .max(500, "Suchanfrage darf maximal 500 Zeichen lang sein"),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// Chat validation schemas
export const chatMessageSchema = z.object({
  question: z
    .string()
    .min(1, "Frage ist erforderlich")
    .max(4000, "Frage darf maximal 4000 Zeichen lang sein"),
  documentId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

// Profile validation schemas
export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .max(100, "Anzeigename darf maximal 100 Zeichen lang sein")
    .optional(),
  role: z.enum(["student", "creator"]).optional(),
});

// Utility functions
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  return result.data;
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }
  return { success: true, data: result.data };
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
