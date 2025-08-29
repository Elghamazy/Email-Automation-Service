import { BusinessService } from './services/business.service.js';

const businessService = new BusinessService();

export { businessService };

// Example usage:
/*
// Send to all businesses
await businessService.sendProposalsToAll({
    from: "your@agency.com",
    subject: "Boost Your Online Presence",
    templateName: "business-proposal",
    templateData: {
        phoneNumber: "1-800-WEB-PROS",
        replyEmail: "sales@youragency.com",
        consultationLink: "https://calendly.com/youragency/consultation"
    }
});

// Send to filtered businesses
await businessService.sendProposalsFiltered({
    filters: {
        type: "Restaurant",
        tags: ["italian"],
        hasWebsite: false
    },
    emailOptions: {
        from: "your@agency.com",
        subject: "Enhance Your Restaurant's Online Presence",
        templateName: "business-proposal",
        templateData: {
            phoneNumber: "1-800-WEB-PROS",
            replyEmail: "sales@youragency.com",
            consultationLink: "https://calendly.com/youragency/consultation"
        }
    }
});
*/
