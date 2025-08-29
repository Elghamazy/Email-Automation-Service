import { EmailService } from './email.service.js';
import { BusinessDetails } from '../types/index.js';
import { readFileSync } from 'fs';
import path from 'path';

export class BusinessDiscoveryService {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    private loadBusinesses(): BusinessDetails[] {
        try {
            const dataPath = path.join(process.cwd(), 'data', 'businesses.json');
            const data = readFileSync(dataPath, 'utf-8');
            return JSON.parse(data).businesses;
        } catch (error) {
            console.error('Error loading businesses:', error);
            return [];
        }
    }

    async discoverAndContactBusinesses(options: {
        type?: string;
        keyword?: string;
        emailTemplate?: {
            from: string;
            subject: string;
            templateName: string;
            templateData?: Record<string, any>;
        };
    }): Promise<Array<{ business: BusinessDetails; emailSent: boolean }>> {
        let businesses = this.loadBusinesses();

        // Apply filters if provided
        if (options.type) {
            businesses = businesses.filter(b => b.type.toLowerCase().includes(options.type!.toLowerCase()));
        }
        if (options.keyword) {
            businesses = businesses.filter(b => 
                b.name.toLowerCase().includes(options.keyword!.toLowerCase()) ||
                b.description?.toLowerCase().includes(options.keyword!.toLowerCase()) ||
                b.tags?.some(tag => tag.toLowerCase().includes(options.keyword!.toLowerCase()))
            );
        }

        const results = await Promise.all(
            businesses.map(async (business) => {
                if (!business.email) {
                    return { business, emailSent: false };
                }

                if (options.emailTemplate) {
                    const emailResult = await this.emailService.sendBusinessProposal({
                        from: options.emailTemplate.from,
                        to: [business.email],
                        subject: options.emailTemplate.subject,
                        templateName: options.emailTemplate.templateName,
                        businessDetails: business,
                        templateData: {
                            ...options.emailTemplate.templateData,
                            businessName: business.name
                        },
                        trackingEnabled: true
                    });

                    return { business, emailSent: emailResult.success };
                }

                return { business, emailSent: false };
            })
        );

        return results;
    }

    async getBusinessSummary(businesses: BusinessDetails[]): Promise<string> {
        const summary = businesses.map(business => ({
            name: business.name,
            type: business.type,
            hasWebsite: business.currentWebPresence?.hasWebsite,
            rating: business.currentWebPresence?.onlineReviews
        }));

        return JSON.stringify(summary, null, 2);
    }
}
