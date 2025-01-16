import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { AsinInput } from '@/components/forms/asin-input';
import { ArrowLeft } from 'lucide-react';
import { productScraperService } from '@/services/product-scraper';
import { useToast } from '@/hooks/use-toast';

export function GatherPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAsinSubmit = async (asins: string[]) => {
    try {
      setIsProcessing(true);
      const taskId = await productScraperService.startScraping(asins);
      
      toast({
        title: 'Processing Started',
        description: `Started processing ${asins.length} products. You can view the progress in the Products list.`,
      });
      
      navigate('/reviews');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process ASINs',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Container>
        <Section>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gather Reviews</h1>
                <p className="text-muted-foreground">
                  Add Amazon products to analyze their reviews
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            <AsinInput onSubmit={handleAsinSubmit} />
          </div>
        </Section>
      </Container>
    </div>
  );
}