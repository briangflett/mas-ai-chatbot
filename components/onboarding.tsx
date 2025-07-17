'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  Users, 
  Heart, 
  Building, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Lock, 
  Globe 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { saveOnboardingData } from '@/app/(auth)/onboarding/actions';

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [identificationMethod, setIdentificationMethod] = useState('');
  const [email, setEmail] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { data: session, status } = useSession();

  // Save onboarding state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('onboardingState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setCurrentStep(state.currentStep || 1);
      setSelectedRole(state.selectedRole || '');
      setSelectedTopic(state.selectedTopic || '');
      setCustomRole(state.customRole || '');
      setCustomTopic(state.customTopic || '');
      setIdentificationMethod(state.identificationMethod || '');
      setEmail(state.email || '');
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    const state = {
      currentStep,
      selectedRole,
      selectedTopic,
      customRole,
      customTopic,
      identificationMethod,
      email
    };
    localStorage.setItem('onboardingState', JSON.stringify(state));
  }, [currentStep, selectedRole, selectedTopic, customRole, customTopic, identificationMethod, email]);

  const roles = [
    {
      id: 'mas-client',
      title: 'MAS Client',
      description: 'I work for a nonprofit that has received or is seeking consulting services from MAS',
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      id: 'mas-staff-vc',
      title: 'MAS Staff / Volunteer Consultant', 
      description: 'I work for MAS or provide pro bono consulting services through MAS',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      id: 'canadian-charity',
      title: 'Canadian Charity Staff / Volunteer / Board Member',
      description: 'I work for, volunteer with, or serve on the board of a Canadian nonprofit',
      icon: Heart,
      color: 'bg-purple-500'
    },
    {
      id: 'other',
      title: 'Other (please specify)',
      description: 'I have a different role or background',
      icon: HelpCircle,
      color: 'bg-gray-500'
    }
  ];

  const getTopicsForRole = (roleId: string) => {
    const baseTopics = [
      'AI',
      'Planning', 
      'Governance',
      'HR',
      'Fundraising',
      'Finance & IT',
      'Marketing & Communications'
    ];

    if (roleId === 'mas-staff-vc') {
      return [...baseTopics, 'Using CiviCRM', 'Implementing CiviCRM', 'Other'];
    }
    return [...baseTopics, 'Other'];
  };

  const getIdentificationOptions = (roleId: string) => {
    const baseOptions = [
      { id: 'login', label: 'Log in (Microsoft/Google/Email)', icon: Lock },
      { id: 'email-guest', label: 'Provide email and continue as guest', icon: Mail },
      { id: 'anonymous', label: 'Continue anonymously', icon: Globe }
    ];

    if (roleId === 'mas-staff-vc') {
      return [
        { 
          id: 'login', 
          label: 'Log in (Microsoft/Google/Email)', 
          icon: Lock, 
          primary: true, 
          note: 'Strongly recommended for VC Templates & project history access' 
        },
        { id: 'email-guest', label: 'Provide email and continue as guest', icon: Mail },
        { id: 'anonymous', label: 'Continue anonymously', icon: Globe }
      ];
    }

    return baseOptions;
  };

  const getDataAccess = useCallback(() => {
    if (selectedRole === 'mas-staff-vc' && identificationMethod === 'login' && session?.user?.type === 'regular') {
      return ['Publicly Available', 'VC Templates', 'Project History'];
    }
    return ['Publicly Available'];
  }, [selectedRole, identificationMethod, session]);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedTopic('');
    setIdentificationMethod('');
    setEmail('');
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      handleContinue();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = useCallback(async () => {
    setIsTransitioning(true);
    
    try {
      if (identificationMethod === 'login' && !session) {
        // User selected login but not authenticated yet - redirect to login
        window.location.href = '/login';
        return;
      }

      if (!session && (identificationMethod === 'email-guest' || identificationMethod === 'anonymous')) {
        // Create guest session first, then save onboarding data
        const { signIn } = await import('next-auth/react');
        await signIn('guest', { 
          redirect: false 
        });
        
        // Note: After guest sign-in, we need to save the onboarding data
        // This will be handled by the server action
      }

      await saveOnboardingData({
        role: selectedRole,
        customRole,
        topic: selectedTopic,
        customTopic,
        identification: identificationMethod,
        email: identificationMethod === 'email-guest' ? email : (session?.user?.email || undefined),
        dataAccess: getDataAccess(),
        microsoftSession: session && identificationMethod === 'login' ? {
          name: session?.user?.name || undefined,
          email: session?.user?.email || undefined,
          // @ts-expect-error - accessToken is not in the NextAuth session type but exists in Azure AD sessions
          accessToken: session?.accessToken as string
        } : undefined
      });

      // Clear localStorage onboarding state
      localStorage.removeItem('onboardingState');
      
      // Server action will handle redirect to chat
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      setIsTransitioning(false);
      // TODO: Show error message to user
    }
  }, [selectedRole, customRole, selectedTopic, customTopic, identificationMethod, email, session, getDataAccess]);

  // Auto-proceed after authentication
  useEffect(() => {
    if (identificationMethod === 'login' && session && status === 'authenticated' && currentStep === 3) {
      setTimeout(() => {
        handleContinue();
      }, 1500);
    }
  }, [session, status, identificationMethod, currentStep, handleContinue]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedRole && (!selectedRole.includes('other') || customRole.trim());
      case 2:
        return selectedTopic && (!selectedTopic.includes('Other') || customTopic.trim());
      case 3:
        return identificationMethod && (
          identificationMethod === 'anonymous' || 
          (identificationMethod === 'email-guest' && email.trim()) ||
          (identificationMethod === 'login')
        );
      default:
        return false;
    }
  };

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Sparkles className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MAS AI Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome! I&apos;m here to help with nonprofit consulting, CiviCRM guidance, and organizational strategy.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                )}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "w-12 h-1 mx-2",
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-sm text-gray-600">
            {currentStep === 1 && "Your Role"}
            {currentStep === 2 && "Topic of Interest"}
            {currentStep === 3 && "Identification"}
          </div>
        </div>

        {!isTransitioning ? (
          <>
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  What best describes your role?
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={cn(
                          "cursor-pointer p-6 rounded-xl border-2 transition-all duration-200",
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 transform scale-[1.02]' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        )}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={cn(role.color, "p-3 rounded-lg")}>
                            <Icon className="size-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {role.title}
                            </h3>
                            <p className="text-gray-600">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedRole === 'other' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="customRole" className="block text-sm font-medium text-gray-700 mb-3">
                      Please describe your role or background:
                    </label>
                    <Textarea
                      id="customRole"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g., Board member at a health charity, Fundraising consultant, Government employee working with nonprofits..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Topic Selection */}
            {currentStep === 2 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  What topic are you interested in?
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {getTopicsForRole(selectedRole).map((topic) => (
                    <Button
                      key={topic}
                      variant={selectedTopic === topic ? "default" : "outline"}
                      onClick={() => setSelectedTopic(topic)}
                      className={cn(
                        "p-4 h-auto text-left justify-start",
                        selectedTopic === topic && "bg-blue-50 border-blue-500 text-blue-700"
                      )}
                    >
                      <span className="font-medium">{topic}</span>
                    </Button>
                  ))}
                </div>

                {selectedTopic === 'Other' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="customTopic" className="block text-sm font-medium text-gray-700 mb-3">
                      Please specify your topic of interest:
                    </label>
                    <Input
                      id="customTopic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., Board development, Volunteer management, Strategic partnerships..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Identification */}
            {currentStep === 3 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  Please identify yourself
                </h2>
                
                <div className="space-y-4">
                  {getIdentificationOptions(selectedRole).map((option) => {
                    const Icon = option.icon;
                    const isSelected = identificationMethod === option.id;
                    
                    return (
                      <div key={option.id}>
                        <Button
                          variant="outline"
                          onClick={() => setIdentificationMethod(option.id)}
                          className={cn(
                            "w-full p-4 h-auto justify-start",
                            isSelected && "border-blue-500 bg-blue-50",
                            option.primary && "ring-2 ring-blue-200"
                          )}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <Icon className={cn(
                              "h-5 w-5",
                              isSelected ? 'text-blue-600' : 'text-gray-400'
                            )} />
                            <span className={cn(
                              "font-medium",
                              isSelected ? 'text-blue-700' : 'text-gray-700'
                            )}>
                              {option.label}
                            </span>
                            {option.primary && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-auto">
                                Recommended
                              </span>
                            )}
                          </div>
                        </Button>
                        {option.note && (
                          <p className="text-sm text-gray-500 mt-2 ml-8">{option.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {identificationMethod === 'email-guest' && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                      Email address (optional for guest access):
                    </label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your email will be associated with your guest session for future reference.
                    </p>
                  </div>
                )}

                {identificationMethod === 'login' && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    {!session ? (
                      <div className="text-center">
                        <p className="text-sm text-blue-700 mb-4">
                          Sign in to access enhanced features and save your preferences
                        </p>
                        <Button
                          onClick={() => window.location.href = '/login'}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Go to Login Page
                        </Button>
                        <p className="text-xs text-gray-600 mt-2">
                          {selectedRole === 'mas-staff-vc' && 'Microsoft login recommended for VC access'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-green-700 mb-2">
                          ✓ Signed in as {session.user?.email}
                        </p>
                        <p className="text-xs text-gray-600">
                          {selectedRole === 'mas-staff-vc' && session.user.type === 'regular' && 'You have access to VC Templates and Project History'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={cn(
                  currentStep === 1 && "text-gray-400 cursor-not-allowed"
                )}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  canProceed() && currentStep === 3 && "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                )}
                size="lg"
              >
                {currentStep === 3 ? (
                  <>
                    <MessageCircle className="mr-3 h-5 w-5" />
                    Start Conversation
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Transition State */
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Initializing your AI assistant...
            </h3>
            <p className="text-gray-600 mb-4">
              Configuring data access and preparing your personalized experience
            </p>
            <div className="max-w-md mx-auto bg-gray-100 rounded-lg p-4">
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-medium">{selectedRoleData?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Topic:</span>
                  <span className="font-medium">{selectedTopic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Access:</span>
                  <span className="font-medium">
                    {getDataAccess().length > 1 ? 'Enhanced' : 'Public'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            Powered by MAS AI Framework • 
            <a href="https://masadvise.org" className="text-blue-600 hover:text-blue-700 ml-1">
              Learn more about MAS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}