import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { BusinessDetails, EmailOptions, EmailResponse } from '../types/index.js';
import { EmailService } from './email.service.js';

export class BusinessService {
    private emailService: EmailService;
    private dataPath: string;
    private resultsPath: string;

    constructor() {
        this.emailService = new EmailService();
        this.dataPath = path.join(process.cwd(), 'data', 'businesses.json');
        this.resultsPath = path.join(process.cwd(), 'data', 'campaign-results.json');
    }

    private loadBusinesses(): BusinessDetails[] {
        try {
            const data = readFileSync(this.dataPath, 'utf-8');
            return JSON.parse(data).businesses;
        } catch (error) {
            console.error('Error loading businesses:', error);
            return [];
        }
    }

    private saveResults(results: Array<{ business: BusinessDetails; result: EmailResponse }>) {
        try {
            const timestamp = new Date().toISOString();
            const campaignResults = {
                timestamp,
                results: results.map(({ business, result }) => ({
                    businessName: business.name,
                    businessEmail: business.email,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                }))
            };

            writeFileSync(this.resultsPath, JSON.stringify(campaignResults, null, 2));
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }

    async sendProposalsToAll(emailOptions: {
        from: string;
        subject: string;
        templateName: string;
        templateData?: Record<string, any>;
    }): Promise<void> {
        const businesses = this.loadBusinesses();
        const results = await this.sendProposals(businesses, emailOptions);
        this.saveResults(results);
    }

    async sendProposalsFiltered(options: {
        filters: {
            type?: string;
            tags?: string[];
            hasWebsite?: boolean;
        };
        emailOptions: {
            from: string;
            subject: string;
            templateName: string;
            templateData?: Record<string, any>;
        };
    }): Promise<void> {
        let businesses = this.loadBusinesses();

        // Apply filters
        if (options.filters.type) {
            businesses = businesses.filter(b => b.type === options.filters.type);
        }
        if (options.filters.tags) {
            businesses = businesses.filter(b => 
                b.tags?.some(tag => options.filters.tags?.includes(tag))
            );
        }
        if (options.filters.hasWebsite !== undefined) {
            businesses = businesses.filter(b => 
                b.currentWebPresence?.hasWebsite === options.filters.hasWebsite
            );
        }

        const results = await this.sendProposals(businesses, options.emailOptions);
        this.saveResults(results);
    }

    private async sendProposals(
        businesses: BusinessDetails[],
        emailOptions: {
            from: string;
            subject: string;
            templateName: string;
            templateData?: Record<string, any>;
        }
    ): Promise<Array<{ business: BusinessDetails; result: EmailResponse }>> {
        const results: Array<{ business: BusinessDetails; result: EmailResponse }> = [];

        for (const business of businesses) {
            if (!business.email) {
                console.log(`Skipping ${business.name}: No email address`);
                continue;
            }

            const result = await this.emailService.sendBusinessProposal({
                from: emailOptions.from,
                to: [business.email],
                subject: emailOptions.subject,
                templateName: emailOptions.templateName,
                businessDetails: business,
                templateData: {
                    ...emailOptions.templateData,
                    businessName: business.name
                },
                trackingEnabled: true
            });

            results.push({ business, result });
            
            // Add a small delay between emails
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }
}
