import type { TransportOptions } from 'nodemailer';
import { envConfig } from './env.js';

// Email configuration with validated env variables
export const emailConfig = {
    service: 'gmail',
    auth: {
        user: envConfig.EMAIL_USER,
        pass: envConfig.EMAIL_PASS,
    }
} as TransportOptions;

// Rate limiting with validated env variables
export const rateLimit = {
    windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    max: envConfig.RATE_LIMIT_MAX_REQUESTS
};
