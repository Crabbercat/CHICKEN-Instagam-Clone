import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

// Redirect to the login page. Kept as a small redirect so the auth index
// route no longer serves a landing page.
export default function AuthIndex(): React.ReactElement | null {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/onboarding');
  }, [router]);
  return null;
}
