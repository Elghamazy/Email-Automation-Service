# AI-Powered Business Email Campaign Tool

This tool helps you send personalized, AI-generated business proposals to potential clients. It uses Gemini AI to analyze business information and create customized proposals for web services, marketing, and branding improvements.

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Optional: Email tracking URL
TRACKING_URL=your-tracking-url
```

4. Add your target businesses to `data/businesses.json`. Follow this format:
```json
{
  "businesses": [
    {
      "name": "Business Name",
      "type": "Business Type",
      "email": "contact@business.com",
      "address": "Business Address",
      "phone": "Phone Number",
      "website": "website-url",
      "description": "Brief description of the business",
      "currentWebPresence": {
        "hasWebsite": true/false,
        "hasSocialMedia": true/false,
        "websiteQuality": "none|basic|outdated|modern",
        "onlineReviews": 4.5
      },
      "tags": ["relevant", "tags", "here"]
    }
  ]
}
```

## Usage

### CLI Commands

The tool provides a command-line interface for managing businesses and sending campaigns:

```bash
# Run the CLI
npm run cli

# Available commands:
email-campaign add-business  # Add a new business to the database
email-campaign list         # List all businesses
email-campaign send-campaign # Send email campaign
email-campaign results      # View latest campaign results
```

#### Adding a Business
```bash
email-campaign add-business
```
This will start an interactive prompt asking for:
- Business name
- Business type
- Email address
- Physical address
- Phone number
- Website (optional)
- Description
- Tags
- Web presence details

#### Listing Businesses
```bash
email-campaign list
```
Shows a table of all businesses in the database.

#### Sending Campaigns
```bash
email-campaign send-campaign
```
Interactive prompt to:
1. Choose campaign type (all businesses or filtered)
2. Configure email settings
3. Set filter criteria (if applicable)

#### Viewing Results
```bash
email-campaign results
```
Shows the results of the latest campaign.

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Send Proposals to All Businesses
```typescript
import { businessService } from './src';

// Send proposals to all businesses
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
```

### Send Proposals to Filtered Businesses
```typescript
// Send proposals to specific business types
await businessService.sendProposalsFiltered({
    filters: {
        type: "Restaurant",
        tags: ["italian"]
    },
    emailOptions: {
        from: "your@agency.com",
        subject: "Enhance Your Restaurant's Online Presence",
        templateName: "restaurant-proposal"
    }
});
```

## Email Templates

Templates are stored in the `templates` directory. The default template includes:
- Business-specific recommendations
- Website improvement suggestions
- Digital marketing strategies
- Branding recommendations
- Call-to-action buttons
- Tracking pixels (if enabled)

### Customizing Templates

Create new templates in `templates/` directory using HTML with these variables:
- `{{businessName}}` - Name of the business
- `{{customizedIntro}}` - AI-generated introduction
- `{{websiteRecommendations}}` - Website improvement suggestions
- `{{marketingRecommendations}}` - Marketing strategies
- `{{brandingRecommendations}}` - Branding improvements
- `{{businessType}}` - Type of business
- `{{consultationLink}}` - Booking link
- `{{phoneNumber}}` - Your contact number
- `{{replyEmail}}` - Your email address

## Managing Business Data

### Adding New Businesses
Add new entries to `data/businesses.json`. Required fields:
- name
- type
- email
- description

### Updating Business Information
Manually update entries in `data/businesses.json` as needed.

### Tracking Results
The tool creates a log file in `data/campaign-results.json` with:
- Email delivery status
- Opening tracking (if enabled)
- Response status

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm start` - Run production version
- `npm run lint` - Check code quality
- `npm run format` - Format code
- `npm test` - Run tests

## Best Practices

1. **Email Content**
   - Keep proposals concise and professional
   - Include clear call-to-action
   - Highlight specific improvements for their business
   - Follow anti-spam regulations

2. **Campaign Management**
   - Send in small batches
   - Monitor response rates
   - Update business information regularly
   - Respect unsubscribe requests

3. **Data Management**
   - Regularly backup businesses.json
   - Verify email addresses before sending
   - Keep tracking data for analysis
   - Update web presence information periodically

## Troubleshooting

Common issues and solutions:

1. **Email Not Sending**
   - Check EMAIL_USER and EMAIL_PASS in .env
   - Verify Gmail "Less secure app access"
   - Check daily sending limits

2. **AI Generation Errors**
   - Verify GEMINI_API_KEY in .env
   - Check business description quality
   - Ensure internet connectivity

3. **Template Errors**
   - Verify template exists in templates/
   - Check variable syntax {{varName}}
   - Validate HTML structure
