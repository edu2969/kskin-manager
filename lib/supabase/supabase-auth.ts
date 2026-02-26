import { createSupabaseServerClient } from "./server-client";

export async function getAuthenticatedUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting authenticated user:', error);
      return { user: null, error };
    }

    if (!user) {
      return { user: null, error: new Error('No authenticated user') };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return { user: null, error };
  }
}

export async function requireAuth() {
  const { user, error } = await getAuthenticatedUser();
  
  if (!user || error) {
    throw new Error('Authentication required');
  }
  
  return user;
}