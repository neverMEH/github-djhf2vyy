import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APIFY_API_TOKEN: z.string().optional(),
  VITE_N8N_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  VITE_CLAUDE_API_KEY: z.string().optional(),
  VITE_APP_ENV: z.enum(['development', 'production']).default('development'),
  VITE_API_TIMEOUT: z.coerce.number().positive().default(30000),
  VITE_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
});

// Environment variables type
type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): EnvConfig {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_APIFY_API_TOKEN: import.meta.env.VITE_APIFY_API_TOKEN,
      VITE_N8N_WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
      VITE_CLAUDE_API_KEY: import.meta.env.VITE_CLAUDE_API_KEY,
      VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
      VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join('.'));
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(', ')}`
      );
    }
    throw error;
  }
}

// Config object with environment variables and derived values
export const config = {
  env: validateEnv(),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  services: {
    apify: {
      token: import.meta.env.VITE_APIFY_API_TOKEN,
    },
    n8n: {
      webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
    },
    claude: {
      apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
    },
  },
  api: {
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
} as const;