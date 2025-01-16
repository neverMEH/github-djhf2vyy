import { config } from './config';

interface ApifyReviewTask {
  id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  startedAt?: string;
  finishedAt?: string;
  progress?: {
    percent: number;
  };
}

interface ApifyReview {
  id: string;
  title: string;
  text: string;
  rating: number;
  date: string;
  verified: boolean;
  author: string;
  images?: string[];
  helpful: {
    votes: number;
    total: number;
  };
  attributes?: Array<{
    name: string;
    value: string;
  }>;
}

class ApifyReviewService {
  private readonly baseUrl = 'https://api.apify.com/v2';
  private readonly token: string;
  private readonly actorId = 'ZhSGsaq9MHRnWtStl';

  constructor() {
    const token = config.services.apify.token;
    if (!token) {
      throw new Error('Apify API token is not configured');
    }
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.token;

    if (!token || token === 'your-apify-token') {
      throw new Error('Invalid Apify API token');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Apify API request failed:', error);
      throw error instanceof Error ? error : new Error('Failed to make Apify request');
    }
  }

  async startScraping(asin: string): Promise<string> {
    try {
      const input = {
        asins: [asin],
        amazonDomain: "amazon.com",
        maxReviews: 500,
        maxAnswers: 20,
        scrapeReviews: true,
        scrapeDescription: true,
        scrapeFilters: true,
        scrapeSpecifications: true,
        scrapeBuyingOptions: true,
        scrapeQuestions: true,
        scrapeVariants: false,
        proxyConfiguration: {
          useApifyProxy: true,
          countryCode: "US"
        },
        proxyCountry: "AUTO_SELECT_PROXY_COUNTRY",
        useCaptchaSolver: false
      };

      const result = await this.request<{ data: { id: string } }>(
        `/acts/${this.actorId}/runs`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );

      return result.data.id;
    } catch (error) {
      console.error('Failed to start review scraping task:', error);
      throw error instanceof Error ? error : new Error('Failed to start review scraping task');
    }
  }

  async getTaskStatus(taskId: string): Promise<{
    status: string;
    progress: number;
    error?: string;
  }> {
    try {
      const result = await this.request<{ data: ApifyReviewTask }>(
        `/acts/${this.actorId}/runs/${taskId}`
      );

      return {
        status: result.data.status,
        progress: result.data.progress?.percent || 0,
      };
    } catch (error) {
      console.error('Failed to get review task status:', error);
      throw new Error('Failed to get review task status');
    }
  }

  async getResults(taskId: string): Promise<ApifyReview[]> {
    try {
      const result = await this.request<ApifyReview[]>(
        `/actor-runs/${taskId}/dataset/items`
      );

      return result;
    } catch (error) {
      console.error('Failed to get review results:', error);
      throw new Error('Failed to get review results');
    }
  }
}

export const apifyReviewService = new ApifyReviewService();