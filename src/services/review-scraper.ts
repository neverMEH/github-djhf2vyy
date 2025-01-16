import { apifyReviewService } from '@/lib/apify-reviews';
import { supabase } from '@/lib/supabase';

interface ReviewScrapingTask {
  id: string;
  asin: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

class ReviewScraperService {
  private tasks: Map<string, ReviewScrapingTask> = new Map();

  async startScraping(asin: string): Promise<string> {
    try {
      console.log('Starting review scraping for ASIN:', asin);
      
      // Start Apify task
      const taskId = await apifyReviewService.startScraping(asin);
      console.log('Review scraping task started with ID:', taskId);

      // Store task information
      const task: ReviewScrapingTask = {
        id: taskId,
        asin,
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString(),
      };

      this.tasks.set(taskId, task);

      // Start monitoring task progress
      this.monitorTask(taskId);

      return taskId;
    } catch (error) {
      console.error('Failed to start review scraping:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<ReviewScrapingTask | null> {
    return this.tasks.get(taskId) || null;
  }

  private async monitorTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      const status = await apifyReviewService.getTaskStatus(taskId);
      console.log(`Review scraping task ${taskId} status:`, status);

      // Update task status
      task.status =
        status.status === 'SUCCEEDED'
          ? 'completed'
          : status.status === 'FAILED'
          ? 'failed'
          : 'processing';
      task.progress = status.progress;

      if (status.error) {
        task.error = status.error;
      }

      this.tasks.set(taskId, task);

      // If task is completed, process results
      if (task.status === 'completed') {
        await this.processResults(taskId);
      }
      // If task is still running, continue monitoring
      else if (task.status === 'processing') {
        setTimeout(() => this.monitorTask(taskId), 5000);
      }
    } catch (error) {
      console.error('Error monitoring review scraping task:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.tasks.set(taskId, task);
    }
  }

  private async processResults(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    try {
      console.log(`Processing review results for task ${taskId}`);
      
      const results = await apifyReviewService.getResults(taskId);
      if (!Array.isArray(results)) {
        throw new Error('Invalid results format from Apify');
      }

      // Get the product using the ASIN
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('asin', task.asin)
        .single();

      if (productError || !product) {
        throw new Error(`Product not found for ASIN ${task.asin}`);
      }

      // Calculate review statistics
      const reviewStats = {
        totalReviews: results.length,
        verifiedReviews: results.filter(r => r.verified_purchase).length,
        averageRating: results.reduce((acc, r) => acc + r.rating, 0) / results.length || 0,
        starsBreakdown: {
          '5star': results.filter(r => r.rating === 5).length / results.length || 0,
          '4star': results.filter(r => r.rating === 4).length / results.length || 0,
          '3star': results.filter(r => r.rating === 3).length / results.length || 0,
          '2star': results.filter(r => r.rating === 2).length / results.length || 0,
          '1star': results.filter(r => r.rating === 1).length / results.length || 0
        }
      };

      // Update the product with the new reviews and statistics
      const { error: updateError } = await supabase
        .from('products')
        .update({
          reviews: results.map(review => ({
            id: review.id || crypto.randomUUID(),
            reviewId: review.reviewId || null,
            reviewTitle: review.reviewTitle || '',
            reviewDescription: review.reviewDescription || '',
            ratingScore: review.ratingScore || 0,
            reviewedIn: review.reviewedIn || review.date,
            isVerified: review.isVerified || false,
            author: review.author || 'Anonymous',
            userId: review.userId || null,
            userProfileLink: review.userProfileLink || null,
            reviewUrl: review.reviewUrl || null,
            reviewReaction: review.reviewReaction || null,
            isAmazonVine: review.isAmazonVine || false,
            variant: review.variant || null,
            variantAttributes: review.variantAttributes || null,
            reviewImages: review.reviewImages || [],
            position: review.position || null
          })),
          review_summary: {
            rating: Number((results.reduce((acc, r) => acc + (r.ratingScore || 0), 0) / results.length || 0).toFixed(1)),
            reviewCount: results.length,
            starsBreakdown: {
              '5star': results.filter(r => r.ratingScore === 5).length / results.length || 0,
              '4star': results.filter(r => r.ratingScore === 4).length / results.length || 0,
              '3star': results.filter(r => r.ratingScore === 3).length / results.length || 0,
              '2star': results.filter(r => r.ratingScore === 2).length / results.length || 0,
              '1star': results.filter(r => r.ratingScore === 1).length / results.length || 0
            },
            verifiedPurchases: results.filter(r => r.isVerified).length,
            amazonVineReviews: results.filter(r => r.isAmazonVine).length,
            lastUpdated: new Date().toISOString()
          },
          review_data: {
            lastScraped: new Date().toISOString(),
            scrapedReviews: results.length,
            scrapeStatus: 'completed'
          }
        })
        .eq('id', product.id);

      if (updateError) {
        throw updateError;
      }

      // Mark task as completed
      task.completedAt = new Date().toISOString();
      task.status = 'completed';
      this.tasks.set(taskId, task);

      console.log(`Successfully processed ${results.length} reviews for ASIN ${task.asin}`);
    } catch (error) {
      console.error('Error processing review results:', error);
      
      // Update product status to indicate error
      try {
        await supabase
          .from('products')
          .update({
            review_data: {
              lastScraped: new Date().toISOString(),
              scrapeStatus: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('asin', task.asin);
      } catch (updateError) {
        console.error('Failed to update product review status:', updateError);
      }

      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.tasks.set(taskId, task);
      throw error;
    }
  }
}

export const reviewScraperService = new ReviewScraperService();