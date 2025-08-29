import { Command } from 'commander';
import inquirer from 'inquirer';
import { BusinessService } from '../services/business.service.js';
import type { BusinessDetails } from '../types/index.js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export class CliService {
    private program: Command;
    private businessService: BusinessService;

    constructor() {
        this.program = new Command();
        this.businessService = new BusinessService();
        this.setupCommands();
    }

    private setupCommands(): void {
        this.program
            .name('email-campaign')
            .description('CLI tool for managing business email campaigns')
            .version('1.0.0');

        // Add a new business
        this.program
            .command('add-business')
            .description('Add a new business to the database')
            .action(async () => {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Business name:',
                        validate: (input) => input.length > 0
                    },
                    {
                        type: 'input',
                        name: 'type',
                        message: 'Business type:',
                        validate: (input) => input.length > 0
                    },
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Business email:',
                        validate: (input) => input.includes('@')
                    },
                    {
                        type: 'input',
                        name: 'address',
                        message: 'Business address:'
                    },
                    {
                        type: 'input',
                        name: 'phone',
                        message: 'Business phone:'
                    },
                    {
                        type: 'input',
                        name: 'website',
                        message: 'Business website (optional):'
                    },
                    {
                        type: 'input',
                        name: 'description',
                        message: 'Business description:'
                    },
                    {
                        type: 'input',
                        name: 'tags',
                        message: 'Tags (comma-separated):'
                    },
                    {
                        type: 'confirm',
                        name: 'hasWebsite',
                        message: 'Does the business have a website?',
                        default: false
                    },
                    {
                        type: 'confirm',
                        name: 'hasSocialMedia',
                        message: 'Does the business have social media presence?',
                        default: false
                    },
                    {
                        type: 'list',
                        name: 'websiteQuality',
                        message: 'Website quality:',
                        choices: ['none', 'basic', 'outdated', 'modern'],
                        when: (answers) => answers.hasWebsite
                    }
                ]);

                const business: BusinessDetails = {
                    name: answers.name,
                    type: answers.type,
                    email: answers.email,
                    address: answers.address,
                    phone: answers.phone,
                    website: answers.website,
                    description: answers.description,
                    tags: answers.tags.split(',').map((tag: string) => tag.trim()),
                    currentWebPresence: {
                        hasWebsite: answers.hasWebsite,
                        hasSocialMedia: answers.hasSocialMedia,
                        websiteQuality: answers.websiteQuality || 'none'
                    }
                };

                await this.addBusinessToFile(business);
                console.log('Business added successfully!');
            });

        // List all businesses
        this.program
            .command('list')
            .description('List all businesses')
            .action(() => {
                const businesses = this.loadBusinesses();
                console.table(businesses.map(b => ({
                    Name: b.name,
                    Type: b.type,
                    Email: b.email,
                    Website: b.website || 'No website',
                    Tags: b.tags?.join(', ') || 'No tags'
                })));
            });

        // Send campaign
        this.program
            .command('send-campaign')
            .description('Send email campaign')
            .action(async () => {
                const { type } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'type',
                        message: 'Select campaign type:',
                        choices: ['all', 'filtered']
                    }
                ]);

                const emailConfig = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'from',
                        message: 'From email:',
                        validate: (input) => input.includes('@')
                    },
                    {
                        type: 'input',
                        name: 'subject',
                        message: 'Email subject:',
                        validate: (input) => input.length > 0
                    },
                    {
                        type: 'input',
                        name: 'templateName',
                        message: 'Template name:',
                        default: 'business-proposal'
                    },
                    {
                        type: 'input',
                        name: 'phoneNumber',
                        message: 'Contact phone number:'
                    },
                    {
                        type: 'input',
                        name: 'replyEmail',
                        message: 'Reply-to email:'
                    },
                    {
                        type: 'input',
                        name: 'consultationLink',
                        message: 'Consultation booking link:'
                    }
                ]);

                if (type === 'all') {
                    await this.businessService.sendProposalsToAll({
                        from: emailConfig.from,
                        subject: emailConfig.subject,
                        templateName: emailConfig.templateName,
                        templateData: {
                            phoneNumber: emailConfig.phoneNumber,
                            replyEmail: emailConfig.replyEmail,
                            consultationLink: emailConfig.consultationLink
                        }
                    });
                } else {
                    const filterOptions = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'businessType',
                            message: 'Filter by business type (leave empty for all):'
                        },
                        {
                            type: 'input',
                            name: 'tags',
                            message: 'Filter by tags (comma-separated, leave empty for all):'
                        },
                        {
                            type: 'confirm',
                            name: 'filterByWebsite',
                            message: 'Filter by website presence?',
                            default: false
                        },
                        {
                            type: 'confirm',
                            name: 'hasWebsite',
                            message: 'Should have website?',
                            when: (answers) => answers.filterByWebsite
                        }
                    ]);

                    interface FilterOptions {
                        businessType?: string;
                        tags?: string;
                        filterByWebsite?: boolean;
                        hasWebsite?: boolean;
                    }

                    interface EmailConfig {
                        from: string;
                        subject: string;
                        templateName: string;
                        phoneNumber: string;
                        replyEmail: string;
                        consultationLink: string;
                    }

                    await this.businessService.sendProposalsFiltered({
                        filters: {
                            type: (filterOptions as FilterOptions).businessType || undefined,
                            tags: (filterOptions as FilterOptions).tags ? (filterOptions as FilterOptions).tags!.split(',').map((t: string) => t.trim()) : undefined,
                            hasWebsite: (filterOptions as FilterOptions).filterByWebsite ? (filterOptions as FilterOptions).hasWebsite : undefined
                        },
                        emailOptions: {
                            from: (emailConfig as EmailConfig).from,
                            subject: (emailConfig as EmailConfig).subject,
                            templateName: (emailConfig as EmailConfig).templateName,
                            templateData: {
                                phoneNumber: (emailConfig as EmailConfig).phoneNumber,
                                replyEmail: (emailConfig as EmailConfig).replyEmail,
                                consultationLink: (emailConfig as EmailConfig).consultationLink
                            }
                        }
                    });
                }

                console.log('Campaign sent successfully!');
            });

        // View campaign results
        this.program
            .command('results')
            .description('View latest campaign results')
            .action(() => {
                try {
                    const resultsPath = path.join(process.cwd(), 'data', 'campaign-results.json');
                    const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
                    console.log('Campaign from:', results.timestamp);
                    console.table(results.results);
                } catch (error) {
                    console.error('No campaign results found');
                }
            });
    }

    private async addBusinessToFile(business: BusinessDetails): Promise<void> {
        const dataPath = path.join(process.cwd(), 'data', 'businesses.json');
        try {
            const data = readFileSync(dataPath, 'utf-8');
            const json = JSON.parse(data);
            json.businesses.push(business);
            writeFileSync(dataPath, JSON.stringify(json, null, 2));
        } catch (error) {
            // If file doesn't exist, create it
            const json = { businesses: [business] };
            writeFileSync(dataPath, JSON.stringify(json, null, 2));
        }
    }

    private loadBusinesses(): BusinessDetails[] {
        const dataPath = path.join(process.cwd(), 'data', 'businesses.json');
        try {
            const data = readFileSync(dataPath, 'utf-8');
            return JSON.parse(data).businesses;
        } catch (error) {
            return [];
        }
    }

    run(): void {
        this.program.parse(process.argv);
    }
}
