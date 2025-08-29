import { z } from 'zod';

export const BusinessDetailsSchema = z.object({
    name: z.string(),
    type: z.string(),
    website: z.string().optional(),
    address: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),
    }).optional(),
    currentWebPresence: z.object({
        hasWebsite: z.boolean(),
        hasSocialMedia: z.boolean(),
        websiteQuality: z.string().optional(),
        onlineReviews: z.number().optional(),
    }).optional(),
});

export const ServiceProposalSchema = z.object({
    websiteServices: z.object({
        needed: z.boolean(),
        recommendations: z.array(z.string()),
        estimatedPrice: z.string().optional(),
    }).optional(),
    marketingServices: z.object({
        needed: z.boolean(),
        recommendations: z.array(z.string()),
        estimatedPrice: z.string().optional(),
    }).optional(),
    brandingServices: z.object({
        needed: z.boolean(),
        recommendations: z.array(z.string()),
        estimatedPrice: z.string().optional(),
    }).optional(),
});

export const AttachmentSchema = z.object({
    filename: z.string(),
    path: z.string(),
    contentType: z.string().optional(),
});

export const EmailOptionsSchema = z.object({
    from: z.string().email(),
    to: z.array(z.string().email()),
    subject: z.string(),
    text: z.string().optional(),
    html: z.string().optional(),
    templateName: z.string().optional(),
    templateData: z.record(z.string(), z.any()).optional(),
    attachments: z.array(AttachmentSchema).optional(),
    trackingEnabled: z.boolean().optional(),
    businessDetails: BusinessDetailsSchema.optional(),
});

export const EmailResponseSchema = z.object({
    success: z.boolean(),
    messageId: z.string().optional(),
    error: z.string().optional(),
});
