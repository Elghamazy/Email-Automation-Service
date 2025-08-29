// types/index.ts
export interface BusinessDetails {
    name: string;
    type: string;
    website?: string;
    address: string;
    phone?: string;
    email?: string;
    description?: string;
    tags?: string[];
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

export type ServiceProposal = {
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

export type Attachment = {
    filename: string;
    path: string;
    contentType?: string;
};

export type EmailOptions = {
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

export type EmailResponse = {
    success: boolean;
    messageId?: string;
    error?: string;
};
