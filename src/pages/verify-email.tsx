import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { Wine } from 'lucide-react';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  if (!email) {
    navigate('/signup');
    return null;
  }

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
              <CardTitle>Check your email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                We've sent a verification link to{' '}
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Click the link in the email to verify your account. If you don't
                see it, check your spam folder.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                >
                  Return to login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}