
import { supabase } from '@/integrations/supabase/client';

export const authService = {
  /**
   * Execute a function with valid session, throwing an error if not authenticated
   */
  async withValidSession<T>(fn: () => Promise<T>): Promise<T> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error);
      throw new Error('Erro de autenticação. Faça login novamente.');
    }
    
    if (!session) {
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }
    
    return await fn();
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};
