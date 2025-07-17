import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db/queries';

export default async function Page() {
  const session = await auth();
  
  // DEBUG: Log session info
  console.log('🔍 Chat page session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userType: session?.user?.type,
    userEmail: session?.user?.email
  });

  if (!session) {
    console.log('❌ No session found, redirecting to onboarding');
    redirect('/onboarding');
  }

  // Check if user has completed onboarding
  const user = await getUserById(session.user.id);
  console.log('🔍 User onboarding check:', {
    userId: user?.id,
    hasRole: !!user?.role,
    role: user?.role,
    userType: session.user.type
  });
  
  if (user && !user.role) {
    console.log('❌ User has no role, redirecting to onboarding');
    redirect('/onboarding');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
