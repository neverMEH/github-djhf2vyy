import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string; bio?: string; location?: string }) => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  const clearAuthState = async () => {
    // Clear Supabase session storage
    localStorage.removeItem('sb-' + new URL(supabase.supabaseUrl).hostname + '-auth-token');
    
    // Clear state
    setSession(null);
    setUser(null);
    setIsLoading(false);
    setError(null);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          await clearAuthState();
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Get the session after successful sign in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;

      return { error: null, data };
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err as AuthError);
      return { error: err, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // First clear local state and storage
      await clearAuthState();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
      
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err as AuthError);
      throw err;
    }
  };

  const updateProfile = async (data: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
  }) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      const userData = {
        id: user.id,
        email: user.email,
        full_name: data.full_name,
        bio: data.bio,
        location: data.location
      };

      const { data: updatedProfile, error: profileError } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'id',
          returning: 'representation'
        });

      if (profileError) {
        throw profileError;
      }

      // Update the user metadata in auth
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          bio: data.bio,
          location: data.location
        }
      });

      if (updateError) {
        throw updateError;
      }

      // Update local user state
      if (updatedUser) {
        setUser(updatedUser);
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      return;
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const resetPasswordRequest = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated: !!session,
        error,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPasswordRequest,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}