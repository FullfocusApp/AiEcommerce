const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../shared/config');

class ContentGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openaiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropicKey,
    });
  }

  async generateUGCContent(product, style = 'authentic') {
    const prompt = `Create authentic, user-generated style content for this product:

Product: ${product.title}
Description: ${product.description}
Price: $${product.price}
Category: ${product.productType}

Style: ${style}
Brand Voice: Premium, trustworthy, feminine, luxury yet approachable

Generate:
1. A caption for Instagram/TikTok (engaging, relatable, 2-3 sentences)
2. 5 hashtags
3. A hook/opening line that would grab attention
4. A call-to-action

Make it sound like a real person sharing their favorite product, not a corporate ad.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating authentic, engaging user-generated content for premium female products. Your content feels genuine, relatable, and aspirational.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      return this.parseUGCResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating UGC content:', error);
      throw error;
    }
  }

  async generateSocialPosts(product, brandStyle = 'feminine-luxury', platforms = ['instagram', 'tiktok', 'facebook']) {
    const posts = {};

    for (const platform of platforms) {
      const prompt = this.buildSocialPrompt(product, platform, brandStyle);

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert specializing in ${platform} content for premium female products. Your content is engaging, on-brand, and optimized for ${platform}'s algorithm.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        posts[platform] = {
          content: response.choices[0].message.content,
          platform,
          productId: product.shopifyId,
        };
      } catch (error) {
        console.error(`Error generating ${platform} post:`, error);
      }
    }

    return posts;
  }

  buildSocialPrompt(product, platform, brandStyle) {
    const platformGuidelines = {
      instagram: 'Instagram post with engaging caption, emojis, and relevant hashtags. Max 2200 chars.',
      tiktok: 'TikTok caption with hook, trending sounds suggestion, and hashtags. Short and punchy.',
      facebook: 'Facebook post with storytelling angle, questions to drive engagement. More detailed.',
      pinterest: 'Pinterest pin description with keywords, SEO-optimized. Benefits-focused.',
    };

    return `Create a ${platform} post for this product:

Product: ${product.title}
Description: ${product.description?.substring(0, 200)}
Price: $${product.price}
Category: ${product.productType}

Brand Style: ${brandStyle}
Colors: Rose gold, champagne, blush pink, cream
Vibe: Luxurious, trustworthy, high-end but approachable

Guidelines: ${platformGuidelines[platform]}

Create an engaging post that will:
- Stop the scroll
- Build trust
- Drive clicks
- Feel premium but relatable`;
  }

  async generateProductDescription(product) {
    const prompt = `Write a compelling, SEO-optimized product description for:

Product: ${product.title}
Current Description: ${product.description}
Price: $${product.price}
Category: ${product.productType}

Brand Voice: Premium, feminine, trustworthy, luxury
Target Audience: Women who value quality, self-care, and premium products

Create a description that:
1. Opens with a compelling benefit
2. Highlights key features with emotional benefits
3. Includes trust elements
4. Has a soft call-to-action
5. Is SEO-optimized with natural keyword integration
6. Maintains premium, warm tone

Length: 150-200 words`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce copywriter specializing in premium female products. Your descriptions are compelling, SEO-optimized, and drive conversions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating product description:', error);
      throw error;
    }
  }

  async generateEmailContent(customer, type = 'welcome') {
    const templates = {
      welcome: 'Welcome new customer with warm, premium tone. Introduce brand values.',
      abandoned_cart: 'Gentle reminder about items in cart. Focus on benefits, not pressure.',
      win_back: 'Re-engage inactive customer. Show what they\'ve been missing.',
      product_recommendation: 'Personalized product suggestions based on their preferences.',
    };

    const prompt = `Create an email for a customer:

Customer Segment: ${customer.segment}
Email Type: ${type}
Template Guide: ${templates[type]}

Brand Voice: Premium, feminine, warm, trustworthy
Tone: Conversational but sophisticated

Create:
1. Subject line (engaging, personal, not salesy)
2. Email body (HTML-friendly, 150-250 words)
3. Call-to-action

Make it feel personal, not automated.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email marketer for premium brands. Your emails feel personal, valuable, and drive action without being pushy.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      return this.parseEmailResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating email content:', error);
      throw error;
    }
  }

  parseUGCResponse(content) {
    // Parse the AI response into structured format
    const lines = content.split('\n');
    return {
      caption: this.extractSection(content, 'caption'),
      hashtags: this.extractSection(content, 'hashtags'),
      hook: this.extractSection(content, 'hook'),
      cta: this.extractSection(content, 'call-to-action'),
      fullContent: content,
    };
  }

  parseEmailResponse(content) {
    return {
      subject: this.extractSection(content, 'subject'),
      body: this.extractSection(content, 'body'),
      cta: this.extractSection(content, 'call-to-action'),
      fullContent: content,
    };
  }

  extractSection(content, section) {
    const regex = new RegExp(`${section}:?\\s*([^\\n]+(?:\\n(?!\\d+\\.|[A-Z][a-z]+:)[^\\n]+)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }
}

module.exports = ContentGenerator;
