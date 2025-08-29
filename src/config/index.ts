// config/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import type { TransportOptions } from 'nodemailer';

dotenv.config();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const aiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

export const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
} as TransportOptions;

export const rateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
};
