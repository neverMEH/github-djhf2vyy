import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { Wine } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Progress } from '@/components/ui/progress';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  return strength;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch('password', '');

  const onSubmit = async (data: SignupForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const { error: signUpError, data: signUpData } = await signUp(data.email, data.password);
      
      if (signUpError) {
        throw signUpError;
      }

      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        setError('This email is already registered. Please try logging in instead.');
        return;
      }

      navigate('/verify-email', { state: { email: data.email } });
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center py-8">
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
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Join our community of wine enthusiasts
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      autoComplete="given-name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      autoComplete="family-name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', {
                      onChange: (e) =>
                        setPasswordStrength(
                          calculatePasswordStrength(e.target.value)
                        ),
                    })}
                  />
                  <Progress value={passwordStrength} className="h-1" />
                  <div className="text-sm text-muted-foreground">
                    Password strength:{' '}
                    {passwordStrength < 40
                      ? 'Weak'
                      : passwordStrength < 80
                      ? 'Medium'
                      : 'Strong'}
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={watch('acceptTerms')}
                    onCheckedChange={(checked) => {
                      setValue('acceptTerms', checked === true);
                    }}
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    I agree to the{' '}
                    <Button
                      variant="link"
                      type="button"
                      className="p-0 h-auto font-normal"
                      onClick={() => setShowTerms(true)}
                    >
                      terms and conditions
                    </Button>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-500">
                    {errors.acceptTerms.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <LoadingSpinner className="mr-2" size="sm" />
                  ) : null}
                  Create Account
                </Button>
              </CardContent>
            </form>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="px-0"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </Container>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please read our terms and conditions carefully.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <div className="space-y-4 text-sm">
              <p>
                Welcome to Spoiled Vine. By creating an account, you agree to the
                following terms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  You must be at least 21 years old to use our services.
                </li>
                <li>
                  You agree to provide accurate and complete information when
                  creating your account.
                </li>
                <li>
                  You are responsible for maintaining the security of your account
                  credentials.
                </li>
                <li>
                  You agree to use the service in compliance with all applicable
                  laws and regulations.
                </li>
                <li>
                  We reserve the right to suspend or terminate accounts that
                  violate our terms.
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}