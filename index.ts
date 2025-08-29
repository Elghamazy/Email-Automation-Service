import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { validate as validateEmail } from 'email-validator';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

type BusinessDetails = {
    name: string;
    type: string;
    website?: string;
    address: string;
    phone?: string;
    email?: string;
    description?: string;
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    currentWebPresence?: {
        hasWebsite: boolean;
        hasSocialMedia: boolean;
        websiteQuality?: string;
        onlineReviews?: number;
    };
};

type ServiceProposal = {
    websiteServices?: {
        needed: boolean;
        recommendations: string[];
        estimatedPrice?: string;
    };
    marketingServices?: {
        needed: boolean;
        recommendations: string[];
        estimatedPrice?: string;
    };
    brandingServices?: {
        needed: boolean;
        recommendations: string[];
        estimatedPrice?: string;
    };
};

type Attachment = {
    filename: string;
    path: string;
    contentType?: string;
};

type EmailOptions = {
    from: string;
    to: string[]; // Multiple receivers
    subject: string;
    text?: string;
    html?: string;
    templateName?: string;
    templateData?: Record<string, any>;
    attachments?: Attachment[];
    trackingEnabled?: boolean;
    businessDetails?: BusinessDetails;
};

type EmailResponse = {
    success: boolean;
    messageId?: string;
    error?: string;
};

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

class EmailService {
    private transporter: nodemailer.Transporter;
    private templateCache: Map<string, string> = new Map();

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    private async generateBusinessProposal(businessDetails: BusinessDetails): Promise<ServiceProposal> {
        const prompt = `
        Analyze this business and provide specific recommendations:
        Business Name: ${businessDetails.name}
        Type: ${businessDetails.type}
        Current Web Presence: ${businessDetails.currentWebPresence ? JSON.stringify(businessDetails.currentWebPresence) : 'Unknown'}
        Description: ${businessDetails.description || 'Not provided'}

        Provide specific recommendations for:
        1. Website needs
        2. Digital marketing strategy
        3. Branding improvements
        Be specific and actionable.
        
        Format your response in JSON with these exact keys:
        {
            "websiteServices": {
                "needed": boolean,
                "recommendations": string[],
                "estimatedPrice": string
            },
            "marketingServices": {
                "needed": boolean,
                "recommendations": string[],
                "estimatedPrice": string
            },
            "brandingServices": {
                "needed": boolean,
                "recommendations": string[],
                "estimatedPrice": string
            }
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();
        
        // Parse AI response and structure it (simplified for example)
        const proposal: ServiceProposal = {
            websiteServices: {
                needed: true,
                recommendations: [],
                estimatedPrice: ''
            },
            marketingServices: {
                needed: true,
                recommendations: [],
                estimatedPrice: ''
            },
            brandingServices: {
                needed: true,
                recommendations: [],
                estimatedPrice: ''
            }
        };

        // Here you would parse the AI response to fill in the proposal structure
        // For now, we'll use the raw AI response in the email template

        return proposal;
    }

    private validateEmails(emails: string[]): boolean {
        return emails.every(email => validateEmail(email));
    }

    private async loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
        if (!this.templateCache.has(templateName)) {
            const templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
            const template = readFileSync(templatePath, 'utf-8');
            this.templateCache.set(templateName, template);
        }

        let html = this.templateCache.get(templateName) || '';
        
        // Replace template variables
        Object.entries(data).forEach(([key, value]) => {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });

        return html;
    }

    private addTracking(html: string, messageId: string): string {
        const pixelUrl = `${process.env.TRACKING_URL}/pixel/${messageId}`;
        const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none">`;
        return html + trackingPixel;
    }

    private async generateCustomIntro(businessDetails: BusinessDetails): Promise<string> {
        const prompt = `
        Write a personalized, engaging 2-3 sentence introduction for this business:
        Business Name: ${businessDetails.name}
        Type: ${businessDetails.type}
        Current Web Presence: ${businessDetails.currentWebPresence ? JSON.stringify(businessDetails.currentWebPresence) : 'Unknown'}
        
        The introduction should be warm, professional, and highlight the importance of digital presence in their specific industry.
        Keep it concise and impactful.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || 'Thank you for considering our web services.';
    }

    async sendBusinessProposal(options: EmailOptions): Promise<EmailResponse> {
        try {
            if (!options.businessDetails) {
                throw new Error('Business details are required for sending a proposal');
            }

            // Validate email addresses
            if (!this.validateEmails([options.from, ...options.to])) {
                throw new Error('Invalid email address detected');
            }

            // Generate AI-powered business proposal
            const proposal = await this.generateBusinessProposal(options.businessDetails);

            // Prepare template data with the proposal
            const templateData = {
                ...options.templateData,
                businessName: options.businessDetails.name,
                websiteRecommendations: proposal.websiteServices?.recommendations.join('\n'),
                marketingRecommendations: proposal.marketingServices?.recommendations.join('\n'),
                brandingRecommendations: proposal.brandingServices?.recommendations.join('\n'),
                businessType: options.businessDetails.type,
                customizedIntro: await this.generateCustomIntro(options.businessDetails)
            };

            let htmlContent = options.html || '';

            // Load and process template if specified
            if (options.templateName && options.templateData) {
                htmlContent = await this.loadTemplate(options.templateName, options.templateData);
            }

            const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Add tracking pixel if tracking is enabled
            if (options.trackingEnabled && htmlContent) {
                htmlContent = this.addTracking(htmlContent, messageId);
            }

            const result = await this.transporter.sendMail({
                from: options.from,
                to: options.to.join(','),
                subject: options.subject,
                text: options.text,
                html: htmlContent,
                attachments: options.attachments,
                messageId,
                headers: {
                    'X-Marketing-Campaign': 'true',
                    'List-Unsubscribe': `<mailto:unsubscribe@yourdomain.com?subject=unsubscribe_${messageId}>`
                }
            });

            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}

// Create email service instance
const emailService = new EmailService();

// Example usage with AI-generated business proposal
await emailService.sendBusinessProposal({
    from: 'your@agency.com',
    to: ['business@example.com'],
    subject: 'Customized Web Services Proposal',
    templateName: 'business-proposal',
    businessDetails: {
        name: "Joe's Restaurant",
        type: "Restaurant",
        address: "123 Main St, City, State",
        website: "joesrestaurant.com",
        currentWebPresence: {
            hasWebsite: true,
            hasSocialMedia: true,
            websiteQuality: "outdated",
            onlineReviews: 4.2
        },
        description: "A family-owned Italian restaurant established in 1990, known for authentic recipes and warm atmosphere. Currently has a basic website and some social media presence."
    },
    templateData: {
        phoneNumber: "1-800-WEB-PROS",
        replyEmail: "sales@youragency.com",
        consultationLink: "https://calendly.com/youragency/consultation"
    },
    trackingEnabled: true
});
