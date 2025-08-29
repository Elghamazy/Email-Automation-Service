import { z } from 'zod';
import { config } from 'dotenv';

// Configure dotenv with debug off
config({
    debug: false
});

// Define environment schema with validation rules
const envSchema = z.object({
    // Email configuration
    EMAIL_USER: z.string().email('Invalid email format for EMAIL_USER'),
    EMAIL_PASS: z.string().min(1, 'EMAIL_PASS is required'),
    
    // API Keys
    GEMINI_API_KEY: z.string()
        .min(1, 'GEMINI_API_KEY is required')
        .regex(/^AIza[0-9A-Za-z-_]{35}$/, 'Invalid Gemini API key format'),
    
    // Optional settings with defaults
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    TRACKING_URL: z.string().url().optional(),
    
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100)
});

// Parse and validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(env.error.format());
    throw new Error('Invalid environment variables');
}

// Export validated environment variables with proper typing
export const envConfig = env.data;

// Type for accessing environment variables
export type EnvConfig = z.infer<typeof envSchema>;
