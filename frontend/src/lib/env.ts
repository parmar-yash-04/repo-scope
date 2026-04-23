import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_APP_NAME: z.string().default("RepoScope"),
  VITE_APP_VERSION: z.string().default("1.0.0"),
});

const envValues = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
};

export const env = envSchema.parse(envValues);

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;