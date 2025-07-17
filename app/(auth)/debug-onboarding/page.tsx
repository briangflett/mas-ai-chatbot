import { Onboarding } from '@/components/onboarding';

export default function DebugOnboardingPage() {
  console.log('🔍 Debug onboarding page - forcing fresh onboarding flow');
  
  return <Onboarding />;
}