import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle } from 'lucide-react';

// ASIN validation regex
const ASIN_REGEX = /^[A-Z0-9]{10}$/;

// Validation schemas
const singleAsinSchema = z.object({
  asin: z.string()
    .length(10, 'ASIN must be exactly 10 characters')
    .regex(ASIN_REGEX, 'Invalid ASIN format'),
});

const bulkAsinSchema = z.object({
  asins: z.string()
    .transform(str => str.split(/[\s,]+/).filter(Boolean))
    .pipe(
      z.array(z.string().regex(ASIN_REGEX, 'Invalid ASIN format'))
      .max(100, 'Maximum of 100 ASINs allowed')
      .refine(
        asins => new Set(asins).size === asins.length,
        'Duplicate ASINs found'
      )
    ),
});

type SingleAsinForm = z.infer<typeof singleAsinSchema>;
type BulkAsinForm = z.infer<typeof bulkAsinSchema>;

interface AsinInputProps {
  onSubmit: (asins: string[]) => Promise<void>;
}

export function AsinInput({ onSubmit }: AsinInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Single ASIN form
  const singleForm = useForm<SingleAsinForm>({
    resolver: zodResolver(singleAsinSchema),
  });

  // Bulk ASIN form
  const bulkForm = useForm<BulkAsinForm>({
    resolver: zodResolver(bulkAsinSchema),
  });

  const handleSingleSubmit = async (data: SingleAsinForm) => {
    try {
      setIsLoading(true);
      await onSubmit([data.asin]);
      singleForm.reset();
      toast({
        title: 'Success',
        description: 'ASIN submitted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit ASIN',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (data: BulkAsinForm) => {
    try {
      setIsLoading(true);
      const asins = data.asins;
      await onSubmit(asins);
      bulkForm.reset();
      toast({
        title: 'Success',
        description: `${asins.length} ASINs submitted successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit ASINs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file');
      return;
    }

    try {
      setIsLoading(true);
      setFileError(null);

      const text = await file.text();
      const asins = text
        .split(/[\r\n,]+/)
        .map(asin => asin.trim())
        .filter(asin => ASIN_REGEX.test(asin));

      // Validate ASIN count
      if (asins.length === 0) {
        throw new Error('No valid ASINs found in file');
      }
      if (asins.length > 100) {
        throw new Error('Maximum of 100 ASINs allowed');
      }

      // Check for duplicates
      const uniqueAsins = [...new Set(asins)];
      if (uniqueAsins.length !== asins.length) {
        throw new Error('Duplicate ASINs found in file');
      }

      await onSubmit(asins);
      toast({
        title: 'Success',
        description: `${asins.length} ASINs uploaded successfully`,
      });
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to process file');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Products</CardTitle>
        <CardDescription>
          Enter Amazon product ASINs to analyze their reviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single ASIN</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={singleForm.handleSubmit(handleSingleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="single-asin">ASIN</Label>
                <Input
                  id="single-asin"
                  placeholder="Enter Amazon ASIN (e.g., B000000000)"
                  {...singleForm.register('asin')}
                  className="font-mono"
                />
                {singleForm.formState.errors.asin && (
                  <p className="text-sm text-red-500">
                    {singleForm.formState.errors.asin.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2" size="sm" /> : null}
                Submit
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="bulk">
            <form onSubmit={bulkForm.handleSubmit(handleBulkSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-asins">ASINs (one per line or comma-separated)</Label>
                <Textarea
                  id="bulk-asins"
                  placeholder="B000000000&#13;&#10;B000000001&#13;&#10;B000000002"
                  className="font-mono min-h-[200px]"
                  {...bulkForm.register('asins')}
                />
                {bulkForm.formState.errors.asins && (
                  <p className="text-sm text-red-500">
                    {bulkForm.formState.errors.asins.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2" size="sm" /> : null}
                Submit Batch
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload CSV File</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Browse
                  </Button>
                </div>
                {fileError && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {fileError}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Requirements:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>CSV file format</li>
                  <li>One ASIN per row or comma-separated</li>
                  <li>Maximum 100 ASINs</li>
                  <li>Valid ASIN format (10 characters)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}