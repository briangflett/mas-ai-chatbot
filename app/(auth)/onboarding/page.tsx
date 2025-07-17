import { auth } from '@/app/(auth)/auth';
import { Onboarding } from '@/components/onboarding';

export default async function OnboardingPage() {
  const session = await auth();
  
  console.log('🔍 Onboarding page session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userType: session?.user?.type
  });

  // Allow unauthenticated users to go through onboarding
  // They'll be prompted to authenticate at step 3
  return <Onboarding />;
}