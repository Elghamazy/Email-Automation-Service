import type { BusinessDetails, ServiceProposal } from '../types/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { envConfig } from '../config/env.js';

export class AIService {
    private model;
    
    constructor() {
        const genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        try {
            const genAI = new GoogleGenerativeAI(envConfig.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            
            // Test the API key with a simple request
            this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'Test connection' }] }]
            }).catch((error: unknown) => {
                throw new Error(`Failed to initialize Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`);
            });
        } catch (error) {
            console.error('Failed to initialize AI service:', error);
            throw new Error(`AI service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async generateBusinessProposal(businessDetails: BusinessDetails): Promise<ServiceProposal> {
        const prompt = `
        You are a digital services consultant. Analyze this business and provide specific recommendations.
        
        Business Details:
        - Name: ${businessDetails.name}
        - Type: ${businessDetails.type}
        - Current Web Presence: ${businessDetails.currentWebPresence ? JSON.stringify(businessDetails.currentWebPresence) : 'Unknown'}
        - Description: ${businessDetails.description || 'Not provided'}
        
        Format your response as a JSON object with exactly this structure:
        {
            "websiteServices": {
                "needed": true or false,
                "recommendations": ["2-3 specific, actionable recommendations"],
                "estimatedPrice": "realistic price range"
            },
            "marketingServices": {
                "needed": true or false,
                "recommendations": ["2-3 specific, actionable recommendations"],
                "estimatedPrice": "realistic price range"
            },
            "brandingServices": {
                "needed": true or false,
                "recommendations": ["2-3 specific, actionable recommendations"],
                "estimatedPrice": "realistic price range"
            }
        }
        
        Include only JSON in your response, no other text.
        `;

        try {
            const generatedContent = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            
            const response = await generatedContent.response;
            const text = response.text();
            
            try {
                // Try to clean the response by removing any potential markdown code block indicators
                const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
                return JSON.parse(cleanedText);
            } catch (parseError) {
                console.error('Original AI response:', text);
                console.error('JSON parse error:', parseError);
                throw new Error('Failed to parse AI response as JSON');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            
            // Return a more informative error message
            const defaultResponse = {
                needed: true,
                recommendations: ['An error occurred while generating recommendations. Please try again.'],
                estimatedPrice: 'Contact for quote'
            };
            
            return {
                websiteServices: defaultResponse,
                marketingServices: defaultResponse,
                brandingServices: defaultResponse
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

        const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        const response = await result.response;
        return response.text() || 'Thank you for considering our web services.';
    }
}
