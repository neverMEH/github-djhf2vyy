import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Building2,
  Bell,
  Shield,
  Clock,
  Upload,
  Mail,
  Eye,
  Key, 
  ArrowLeft
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(160).optional(),
  location: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    compactView: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || user?.user_metadata?.full_name || '',
      email: user?.email || '',
      bio: '',
      location: '',
    },
  });

  // Fetch profile data from users table when component mounts
  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('bio, location')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        reset({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
          bio: data.bio || '',
          location: data.location || '',
        });
      }
    }

    fetchProfileData();
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!isDirty) {
      toast({
        title: 'No changes',
        description: 'No changes were made to your profile',
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Profile form submission:', JSON.stringify(data, null, 2));

      await updateProfile({
        full_name: data.fullName,
        bio: data.bio,
        location: data.location,
      });

      // Reset form with the same values to clear dirty state
      reset(data, { keepValues: true });
      
    } catch (error) {
      console.error('Profile form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Container>
        <Section>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
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

            <Tabs defaultValue="general" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">
                  <User className="mr-2 h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Bell className="mr-2 h-4 w-4" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Card>
                    <CardHeader>
                      <CardTitle>General Information</CardTitle>
                      <CardDescription>
                        Update your profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                          {error}
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={user?.user_metadata?.avatar_url}
                            alt={user?.user_metadata?.full_name}
                          />
                          <AvatarFallback>
                            {user?.user_metadata?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Change Avatar
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          {...register('fullName')}
                        />
                        {errors.fullName && (
                          <p className="text-sm text-red-500">
                            {errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          disabled
                          {...register('email')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          {...register('bio')}
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...register('location')}
                          placeholder="City, Country"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading || !isDirty}
                      >
                        {isLoading ? (
                          <LoadingSpinner className="mr-2" size="sm" />
                        ) : null}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>
                </form>
              </TabsContent>

              <TabsContent value="preferences">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Manage how you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={preferences.emailNotifications}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({
                              ...prev,
                              emailNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications in your browser
                          </p>
                        </div>
                        <Switch
                          checked={preferences.pushNotifications}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({
                              ...prev,
                              pushNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Weekly Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive a weekly summary of activity
                          </p>
                        </div>
                        <Switch
                          checked={preferences.weeklyDigest}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({
                              ...prev,
                              weeklyDigest: checked,
                            }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Display Preferences</CardTitle>
                      <CardDescription>
                        Customize your viewing experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Compact View</Label>
                          <p className="text-sm text-muted-foreground">
                            Show more content in less space
                          </p>
                        </div>
                        <Switch
                          checked={preferences.compactView}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({
                              ...prev,
                              compactView: checked,
                            }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>
                        Change your password
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                          id="current"
                          type="password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                          id="new"
                          type="password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                          id="confirm"
                          type="password"
                        />
                      </div>
                      <Button>
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline">
                        <Shield className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Section>
      </Container>
    </div>
  );
}