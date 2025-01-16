import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { Wine, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout/container';

const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type RequestResetForm = z.infer<typeof requestResetSchema>;

export function RequestResetPage() {
  const navigate = useNavigate();
  const { resetPasswordRequest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
  });

  const onSubmit = async (data: RequestResetForm) => {
    // Rate limiting check (1 request per minute)
    if (lastRequestTime && Date.now() - lastRequestTime < 60000) {
      setError('Please wait a minute before requesting another reset.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await resetPasswordRequest(data.email);
      setIsSuccess(true);
      setLastRequestTime(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center">
      <Container size="sm">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Wine className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Spoiled Vine</h1>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>

            {isSuccess ? (
              <CardContent className="space-y-4">
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400 rounded-md">
                  If an account exists for that email, you will receive password reset instructions.
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to login
                </Button>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <LoadingSpinner className="mr-2" size="sm" />
                    ) : null}
                    Send reset instructions
                  </Button>
                </CardContent>
              </form>
            )}

            <CardFooter className="flex justify-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => navigate('/login')}
              >
                Back to login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Container>
    </div>
  );
}