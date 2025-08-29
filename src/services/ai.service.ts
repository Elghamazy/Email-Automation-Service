import type { BusinessDetails, ServiceProposal } from '../types/index.js';
import { aiModel } from '../config/index.js';

export class AIService {
    async generateBusinessProposal(businessDetails: BusinessDetails): Promise<ServiceProposal> {
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

        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();
        
        try {
            return JSON.parse(analysis);
        } catch (error) {
            return {
                websiteServices: {
                    needed: true,
                    recommendations: ['Could not parse AI response'],
                    estimatedPrice: 'Contact for quote'
                },
                marketingServices: {
                    needed: true,
                    recommendations: ['Could not parse AI response'],
                    estimatedPrice: 'Contact for quote'
                },
                brandingServices: {
                    needed: true,
                    recommendations: ['Could not parse AI response'],
                    estimatedPrice: 'Contact for quote'
                }
            };
        }
    }

    async generateCustomIntro(businessDetails: BusinessDetails): Promise<string> {
        const prompt = `
        Write a personalized, engaging 2-3 sentence introduction for this business:
        Business Name: ${businessDetails.name}
        Type: ${businessDetails.type}
        Current Web Presence: ${businessDetails.currentWebPresence ? JSON.stringify(businessDetails.currentWebPresence) : 'Unknown'}
        
        The introduction should be warm, professional, and highlight the importance of digital presence in their specific industry.
        Keep it concise and impactful.
        `;

        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        return response.text() || 'Thank you for considering our web services.';
    }
}
