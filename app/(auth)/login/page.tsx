'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Lock, Mail, User } from 'lucide-react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  if (session) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Primary Login for MAS Staff/VCs */}
        <div className="px-4 sm:px-16">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 mb-2 font-medium">
              MAS Staff & Volunteer Consultants
            </p>
            <p className="text-xs text-blue-600 mb-3">
              Sign in with your Microsoft account for enhanced access to VC Templates and Project History
            </p>
            <Button
              onClick={() => signIn('azure-ad')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
            >
              <Lock className="w-5 h-5 mr-2" />
              Continue with Microsoft
            </Button>
          </div>
        </div>

        {/* Guest Access */}
        <div className="px-4 sm:px-16">
          <Button
            onClick={() => signIn('guest')}
            variant="outline"
            className="w-full flex items-center gap-3 py-6"
          >
            <User className="w-5 h-5" />
            Continue as Guest
          </Button>
        </div>

        <div className="px-4 sm:px-16">
          <Separator className="relative">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              or
            </span>
          </Separator>
        </div>

        {/* Email/Password Form */}
        <div className="px-4 sm:px-16">
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Email
            </SubmitButton>
          </AuthForm>
        </div>

        <div className="px-4 sm:px-16">
          <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </div>
      </div>
    </div>
  );
}
