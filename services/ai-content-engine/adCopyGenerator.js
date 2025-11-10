const OpenAI = require('openai');
const config = require('../../shared/config');

class AdCopyGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openaiKey,
    });
  }

  async generate(product, platform = 'meta', objective = 'conversions') {
    const platformSpecs = {
      meta: {
        primaryText: 125,
        headline: 40,
        description: 30,
      },
      google: {
        headline: 30,
        description: 90,
      },
      tiktok: {
        text: 100,
        videoScript: 150,
      },
    };

    const prompt = `Create high-converting ad copy for:

Product: ${product.title}
Price: $${product.price}
Description: ${product.description?.substring(0, 150)}

Platform: ${platform}
Objective: ${objective}
Character Limits: ${JSON.stringify(platformSpecs[platform])}

Brand Voice: Premium, feminine, trustworthy, aspirational
Target Audience: Women 25-45, values quality and self-care

Create multiple variations (A/B testing):
- 3 attention-grabbing headlines
- 3 different primary text angles (benefit-focused, problem-solution, social proof)
- 2 calls-to-action

Make it:
- Scroll-stopping
- Benefit-driven (not feature-focused)
- Create desire and urgency (without being pushy)
- Build trust
- Clear CTA

Avoid:
- Generic phrases
- Being too salesy
- Overused marketing language
- ALL CAPS (unless strategic)`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert direct response copywriter specializing in paid advertising for premium e-commerce brands. Your ad copy consistently drives high ROAS.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      return this.parseAdCopy(response.choices[0].message.content, platform);
    } catch (error) {
      console.error('Error generating ad copy:', error);
      throw error;
    }
  }

  async generateAdVariations(product, count = 5) {
    const variations = [];

    for (let i = 0; i < count; i++) {
      const variation = await this.generate(product, 'meta', 'conversions');
      variations.push(variation);
    }

    return variations;
  }

  async optimizeAdCopy(originalCopy, performanceData) {
    const prompt = `Optimize this ad copy based on performance data:

Original Copy:
${JSON.stringify(originalCopy, null, 2)}

Performance Data:
- CTR: ${performanceData.ctr}%
- Conversion Rate: ${performanceData.conversionRate}%
- ROAS: ${performanceData.roas}
- Feedback: ${performanceData.feedback || 'None'}

Analyze what's working and what's not. Create improved versions that address the weaknesses while maintaining the strengths.

Provide:
1. Analysis of current performance
2. 3 optimized variations
3. Testing recommendations`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing and optimizing ad performance. You understand what makes ad copy convert and how to iterate based on data.',
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
      console.error('Error optimizing ad copy:', error);
      throw error;
    }
  }

  parseAdCopy(content, platform) {
    return {
      headlines: this.extractMultiple(content, 'headline'),
      primaryText: this.extractMultiple(content, 'primary text'),
      descriptions: this.extractMultiple(content, 'description'),
      ctas: this.extractMultiple(content, 'call-to-action|cta'),
      platform,
      fullContent: content,
      createdAt: new Date(),
    };
  }

  extractMultiple(content, pattern) {
    const regex = new RegExp(`${pattern}[:\\s]*\\d*[:\\.]?\\s*([^\\n]+)`, 'gi');
    const matches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }
}

module.exports = AdCopyGenerator;
