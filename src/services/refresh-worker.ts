import { supabase } from '@/lib/supabase';
import { productScraperService } from './product-scraper';
import { useToast } from '@/hooks/use-toast';

class RefreshWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private batchSize = 5; // Number of products to refresh in each batch
  private checkInterval = 2 * 60 * 1000; // Check every 2 minutes
  private retryDelay = 30 * 1000; // Retry after 30 seconds on error

  async start() {
    if (this.isRunning) {
      console.log('Refresh worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting refresh worker...');

    // Start the refresh cycle
    this.intervalId = setInterval(() => this.refreshCycle(), this.checkInterval);
    
    // Run first cycle immediately
    this.refreshCycle();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Refresh worker stopped');
  }

  private async refreshCycle() {
    try {
      // Get products that need refreshing
      const { data: products, error } = await supabase.rpc('get_products_to_refresh', {
        batch_size: this.batchSize
      });

      if (error) throw error;
      if (!products || products.length === 0) {
        console.log('No products need refreshing');
        return; // No products need refreshing
      }

      console.log(`Found ${products.length} products to refresh:`, 
        products.map(p => p.asin).join(', '));

      // Group products by batch to avoid overloading the scraper
      const asins = products.map(product => product.asin);
      const productIds = products.map(product => product.product_id);

      try {
        // Start scraping
        console.log('Starting scraping for ASINs:', asins.join(', '));
        await productScraperService.startScraping(asins);

        // Mark products as successfully refreshed
        for (const productId of productIds) {
          const { error: markError } = await supabase.rpc('mark_product_refreshed', {
            p_product_id: productId,
            p_success: true
          });
          
          if (markError) {
            console.error(`Error marking product ${productId} as refreshed:`, markError);
          }
        }
        
        console.log('Successfully refreshed products:', asins.join(', '));
      } catch (error) {
        console.error('Error refreshing products:', error);
        
        // Mark products as failed
        for (const productId of productIds) {
          const { error: markError } = await supabase.rpc('mark_product_refreshed', {
            p_product_id: productId,
            p_success: false,
            p_error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          if (markError) {
            console.error(`Error marking product ${productId} as failed:`, markError);
          }
        }
        
        // Schedule retry after delay
        setTimeout(() => this.refreshCycle(), this.retryDelay);
      }
    } catch (error) {
      console.error('Error in refresh cycle:', error);
      // Schedule retry after delay
      setTimeout(() => this.refreshCycle(), this.retryDelay);
    }
  }
}

// Create singleton instance
export const refreshWorker = new RefreshWorker();