const mongoose = require('mongoose');

// Social Post Schema
const socialPostSchema = new mongoose.Schema({
  content: String,
  platform: {
    type: String,
    enum: ['instagram', 'tiktok', 'facebook', 'pinterest', 'twitter'],
  },
  productId: String,
  scheduledTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'published', 'failed', 'cancelled'],
    default: 'scheduled',
  },
  mediaUrls: [String],
  hashtags: [String],
  caption: String,
  publishedAt: Date,
  engagementStats: {
    likes: Number,
    comments: Number,
    shares: Number,
    views: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

class SocialPostScheduler {
  async schedulePost(postData) {
    try {
      const post = await SocialPost.create({
        ...postData,
        status: 'scheduled',
      });

      console.log(`📅 Post scheduled for ${postData.platform} at ${postData.scheduledTime}`);

      // Schedule actual posting (integrate with n8n or direct API)
      await this.triggerN8nWorkflow(post);

      return post;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  async getScheduledPosts(filters = {}) {
    try {
      return await SocialPost.find({
        status: 'scheduled',
        ...filters,
      }).sort({ scheduledTime: 1 });
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }
  }

  async updatePostStatus(postId, status, stats = {}) {
    try {
      const update = { status };

      if (status === 'published') {
        update.publishedAt = new Date();
      }

      if (stats) {
        update.engagementStats = stats;
      }

      return await SocialPost.findByIdAndUpdate(postId, update, { new: true });
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  }

  async triggerN8nWorkflow(post) {
    // Integrate with n8n for actual posting
    const config = require('../../shared/config');
    const axios = require('axios');

    if (!config.n8n.webhookUrl) {
      console.log('⚠️  n8n webhook not configured, post scheduled locally only');
      return;
    }

    try {
      await axios.post(config.n8n.webhookUrl + '/social-post', {
        postId: post._id,
        platform: post.platform,
        content: post.content,
        scheduledTime: post.scheduledTime,
      });

      console.log('✅ n8n workflow triggered for post');
    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
    }
  }

  async getPostAnalytics(platform, dateRange) {
    try {
      const posts = await SocialPost.find({
        platform,
        status: 'published',
        publishedAt: {
          $gte: dateRange.start,
          $lte: dateRange.end,
        },
      });

      const analytics = {
        totalPosts: posts.length,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        avgEngagementRate: 0,
      };

      posts.forEach(post => {
        if (post.engagementStats) {
          analytics.totalLikes += post.engagementStats.likes || 0;
          analytics.totalComments += post.engagementStats.comments || 0;
          analytics.totalShares += post.engagementStats.shares || 0;
          analytics.totalViews += post.engagementStats.views || 0;
        }
      });

      if (analytics.totalViews > 0) {
        const totalEngagement = analytics.totalLikes + analytics.totalComments + analytics.totalShares;
        analytics.avgEngagementRate = (totalEngagement / analytics.totalViews) * 100;
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      throw error;
    }
  }
}

module.exports = SocialPostScheduler;
