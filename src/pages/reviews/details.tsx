import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { TrendChart } from '@/components/charts/trend-chart';
import { ArrowLeft, Star, Package, DollarSign, Calendar, RefreshCw, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { productScraperService } from '@/services/product-scraper';

interface ProductDetails {
  id: string;
  asin: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  availability: string;
  specifications: Record<string, string>;
  dimensions?: {
    width?: string;
    height?: string;
    length?: string;
    weight?: string;
  };
  best_sellers_rank?: Array<{
    category: string;
    rank: number;
  }>;
  variations?: Array<{
    title: string;
    asin: string;
    price?: number;
    available?: boolean;
  }>;
  frequently_bought_together?: Array<{
    asin: string;
    title: string;
    price?: number;
  }>;
  customer_questions?: Array<{
    question: string;
    answer: string;
    votes: number;
    date: string;
  }>;
  images: string[];
  categories: string[];
  features: string[];
  description: string;
  review_summary: {
    rating: number;
    reviewCount: number;
    starsBreakdown: {
      '5star': number;
      '4star': number;
      '3star': number;
      '2star': number;
      '1star': number;
    };
    verifiedPurchases: number;
    lastUpdated: string;
  };
  reviews: Array<{
    id: string;
    title: string;
    text: string;
    rating: number;
    date: string;
    verified: boolean;
    author: string;
    images?: string[];
    userId?: string;
    userProfileLink?: string;
    isAmazonVine?: boolean;
    variant?: string;
    helpful_votes?: number;
    reviewReaction?: string;
    reviewUrl?: string;
  }>;
  status: string;
  updated_at: string;
}

export function DetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [historicalData, setHistoricalData] = useState<{
    prices: Array<{ date: string; value: number }>;
    ratings: Array<{ date: string; value: number }>;
    reviews: Array<{ date: string; value: number }>;
    ranks: Array<{ date: string; value: number }>;
  }>({
    prices: [],
    ratings: [],
    reviews: [],
    ranks: []
  });

  useEffect(() => {
    if (id) {
      fetchProduct(id);
      fetchHistoricalData(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching product:', productId);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      console.log('Product data:', data);
      console.log('Reviews:', data.reviews);
      
      setProduct(data as ProductDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch product details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalData = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_history')
        .select('*')
        .eq('product_id', productId)
        .order('captured_at', { ascending: true });

      if (error) throw error;

      const prices: Array<{ date: string; value: number }> = [];
      const ratings: Array<{ date: string; value: number }> = [];
      const reviews: Array<{ date: string; value: number }> = [];
      const ranks: Array<{ date: string; value: number }> = [];

      data.forEach(record => {
        const date = record.captured_at;
        
        if (record.price) {
          prices.push({ date, value: record.price });
        }
        
        if (record.rating) {
          ratings.push({ date, value: record.rating });
        }
        
        if (record.review_count) {
          reviews.push({ date, value: record.review_count });
        }
        
        if (record.best_sellers_rank?.[0]?.rank) {
          ranks.push({ date, value: record.best_sellers_rank[0].rank });
        }
      });

      setHistoricalData({
        prices,
        ratings,
        reviews,
        ranks
      });
    } catch (error) {
      console.error('Error fetching historical data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch historical data',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = async () => {
    if (!product) return;

    try {
      setIsRefreshing(true);
      await productScraperService.startScraping([product.asin]);
      toast({
        title: 'Refresh Started',
        description: 'Product data refresh has been initiated.',
      });
      // Refetch after a short delay to allow for processing
      setTimeout(() => fetchProduct(product.id), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => navigate('/reviews')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container>
        <Section>
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/reviews')}
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Package className="h-4 w-4" />
                  <span>{product.brand}</span>
                  <span>•</span>
                  <code className="font-mono">{product.asin}</code>
                  <span>•</span>
                  <Badge variant={product.availability?.toLowerCase().includes('in stock') ? 'success' : 'secondary'}>
                    {product.availability || 'Unknown Status'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="shrink-0"
              >
                {isRefreshing ? (
                  <LoadingSpinner className="mr-2" size="sm" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Data
              </Button>
            </div>

            <div className="space-y-6">
              {/* Main Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-6">
                    {/* Product Image */}
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-48 h-48 object-cover rounded-lg border"
                      />
                    )}
                    
                    {/* Title and Basic Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <CardTitle className="text-2xl">{product.title}</CardTitle>
                        <p className="text-muted-foreground mt-2">by {product.brand}</p>
                      </div>
                      
                      {/* Price and Rating */}
                      <div className="flex items-center gap-8 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-primary text-primary" />
                          <span className="text-2xl font-bold">
                            {(product.review_summary?.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            ({(product.review_summary?.reviewCount || 0).toLocaleString()} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Images */}
                  {product.images && product.images.length > 0 && (
                    <div className="grid grid-cols-6 gap-2 pb-4">
                      {product.images.slice(1).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${product.title} - Image ${index + 1}`}
                          className="aspect-square w-24 h-24 object-cover rounded-md border hover:border-primary transition-colors cursor-zoom-in"
                        />
                      ))}
                    </div>
                  )}

                  {/* Categories */}
                  {product.categories && product.categories.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.categories.map((category, index) => (
                          <Badge key={index} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Key Features</h3>
                      <ul className="grid gap-3 pl-6">
                        {product.features.map((feature, index) => (
                          <li key={index} className="list-disc marker:text-primary">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Specifications */}
                  {Object.keys(product.specifications || {}).length > 0 && (
                    <Collapsible>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Specifications</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronsUpDown className="h-4 w-4" />
                            <span className="sr-only">Toggle specifications</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-4">
                        <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                          {Object.entries(product.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Best Sellers Rank */}
                  {product.best_sellers_rank && product.best_sellers_rank.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Best Sellers Rank</h3>
                      <div className="space-y-1">
                        {product.best_sellers_rank.map((rank, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">#{rank.rank}</Badge>
                            <span>{rank.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Frequently Bought Together */}
                  {product.frequently_bought_together && product.frequently_bought_together.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Frequently Bought Together</h3>
                      <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                        {product.frequently_bought_together.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.price && (
                              <span className="text-muted-foreground">
                                {formatCurrency(item.price)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Description</h3>
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{product.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trend Charts */}
              <div className="grid grid-cols-2 gap-6">
                <TrendChart
                  title="Price History"
                  data={historicalData.prices}
                  valueFormatter={(value) => formatCurrency(value)}
                />
                <TrendChart
                  title="Rating Trend"
                  data={historicalData.ratings}
                  valueFormatter={(value) => value.toFixed(1)}
                />
                <TrendChart
                  title="Best Sellers Rank"
                  data={historicalData.ranks}
                  valueFormatter={(value) => `#${value.toLocaleString()}`}
                />
                <TrendChart
                  title="Total Reviews"
                  data={historicalData.reviews}
                  valueFormatter={(value) => value.toLocaleString()}
                />
              </div>

              {/* Review Stats and Summary */}
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Review Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                      {/* Overall Rating */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-8 w-8 fill-primary text-primary" />
                          <span className="text-4xl font-bold">
                            {(product.review_summary?.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            out of 5
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Based on {(product.review_summary?.reviewCount || 0).toLocaleString()} reviews
                        </p>
                      </div>

                      {/* Rating Distribution */}
                      <div className="space-y-3">
                        {Object.entries(product.review_summary?.starsBreakdown || {})
                          .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                          .map(([stars, percentage]) => {
                            const percent = percentage * 100;
                            return (
                              <div key={stars} className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
                                <div className="flex items-center gap-1 w-12">
                                  <span>{stars.replace('star', '')}</span>
                                  <Star className={`h-4 w-4 ${percent > 0 ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} />
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                  {percent.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Reviews</span>
                        <span>{(product.review_summary?.reviewCount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Verified Purchases</span>
                        <span>{(product.review_summary?.verifiedPurchases || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{formatDate(product.updated_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Questions */}
              {product.customer_questions && product.customer_questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customer Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {product.customer_questions.map((qa, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-1">Q</Badge>
                            <div>
                              <p className="font-medium">{qa.question}</p>
                              <p className="text-sm text-muted-foreground">
                                {qa.votes} people found this helpful
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 ml-8">
                            <Badge variant="outline" className="mt-1">A</Badge>
                            <div>
                              <p>{qa.answer}</p>
                              <p className="text-sm text-muted-foreground">
                                Answered on {formatDate(qa.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle>Customer Reviews</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show:</span>
                        <select
                          className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none bg-no-repeat bg-[length:16px] bg-[center_right_8px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCA2TDggMTBMMTIgNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')]"
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1); // Reset to first page when changing page size
                          }}
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={250}>250</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Sort by:</span>
                      <Tabs defaultValue="recent" className="space-y-4">
                        <TabsList>
                          <TabsTrigger value="recent">Most Recent</TabsTrigger>
                          <TabsTrigger value="helpful">Most Helpful</TabsTrigger>
                          <TabsTrigger value="critical">Critical Reviews</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {product.reviews?.length > 0 ? (
                      <>
                      {product.reviews
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((review, index) => (
                        <div
                          key={review.id || index}
                          className="border-b last:border-0 pb-6 last:pb-0 pt-6 first:pt-0"
                        >
                          <div className="flex items-start gap-4">
                            {/* Review Header */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.ratingScore
                                              ? 'fill-primary text-primary'
                                              : 'fill-muted text-muted'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <h4 className="font-medium">
                                      {review.title || 'Review'}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>By {review.author || 'Anonymous'}</span>
                                    <span>•</span>
                                    {review.userId && (
                                      <>
                                        <a
                                          href={review.userProfileLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          Profile
                                        </a>
                                        <span>•</span>
                                      </>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {formatDate(review.reviewedIn)}
                                    </div>
                                    {review.isVerified && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="success" className="text-xs">
                                          Verified Purchase
                                        </Badge>
                                      </>
                                    )}
                                    {review.isAmazonVine && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="secondary" className="text-xs">
                                          Vine Voice
                                        </Badge>
                                      </>
                                    )}
                                    {review.variant && (
                                      <>
                                        <span>•</span>
                                        <span className="text-xs">
                                          {review.variant}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Review Content */}
                              <div className="space-y-4">
                                <p className="text-sm leading-relaxed">
                                  {review.reviewDescription}
                                </p>

                                {/* Review Actions */}
                                <div className="flex items-center gap-4 pt-2">
                                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    {review.reviewReaction || 'Helpful'}
                                  </Button>
                                  {review.reviewUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-muted-foreground"
                                      asChild
                                    >
                                      <a
                                        href={review.reviewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        View on Amazon
                                      </a>
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    Report
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {Math.min((currentPage - 1) * pageSize + 1, product.reviews.length)} to{' '}
                          {Math.min(currentPage * pageSize, product.reviews.length)} of{' '}
                          {product.reviews.length} reviews
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {Math.ceil(product.reviews.length / pageSize)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(product.reviews.length / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(product.reviews.length / pageSize)}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.ceil(product.reviews.length / pageSize))}
                            disabled={currentPage >= Math.ceil(product.reviews.length / pageSize)}
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No reviews available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>
      </Container>
    </div>
  );
}