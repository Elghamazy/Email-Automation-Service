import nodemailer from 'nodemailer';
import { validate as validateEmail } from 'email-validator';
import path from 'path';
import { readFileSync } from 'fs';
import type { EmailOptions, EmailResponse } from '../types/index.js';
import { AIService } from './ai.service.js';
import { emailConfig } from '../config/index.js';

export class EmailService {
    private transporter: nodemailer.Transporter;
    private templateCache: Map<string, string> = new Map();
    private aiService: AIService;

    constructor() {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.aiService = new AIService();
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
            const proposal = await this.aiService.generateBusinessProposal(options.businessDetails);

            // Prepare template data with the proposal
            const templateData = {
                ...options.templateData,
                businessName: options.businessDetails.name,
                websiteRecommendations: proposal.websiteServices?.recommendations.join('\n'),
                marketingRecommendations: proposal.marketingServices?.recommendations.join('\n'),
                brandingRecommendations: proposal.brandingServices?.recommendations.join('\n'),
                businessType: options.businessDetails.type,
                customizedIntro: await this.aiService.generateCustomIntro(options.businessDetails)
            };

            let htmlContent = options.html || '';

            // Load and process template if specified
            if (options.templateName && options.templateData) {
                htmlContent = await this.loadTemplate(options.templateName, templateData);
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
