'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { updateUserOnboarding } from '@/lib/db/queries';

export async function saveOnboardingData({
  role,
  customRole,
  topic,
  customTopic,
  identification,
  email,
  dataAccess,
  microsoftSession,
}: {
  role: string;
  customRole?: string;
  topic: string;
  customTopic?: string;
  identification: string;
  email?: string;
  dataAccess: string[];
  microsoftSession?: {
    name?: string;
    email?: string;
    accessToken?: string;
  };
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  try {
    await updateUserOnboarding({
      userId: session.user.id,
      role,
      customRole,
      topic,
      customTopic,
      identification,
      dataAccess,
      microsoftSession,
    });
  } catch (error) {
    console.error('Failed to save onboarding data:', error);
    throw new Error('Failed to save onboarding data');
  }

  // Redirect to chat after successful save
  redirect('/');
}