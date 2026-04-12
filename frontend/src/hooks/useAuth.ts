import { useState, useEffect, useCallback } from 'react';
import { apiClient, type Credentials } from '../api/client';

export function useAuth() {
  const [credentials, setCredentials] = useState<Credentials | null>(apiClient.getCredentials());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const unsubscribe = apiClient.onAuthChange((newCredentials) => {
      setCredentials(newCredentials);
      if (!newCredentials) {
        setShowPrompt(true);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback((username: string, password: string) => {
    const newCredentials: Credentials = { username, password };
    apiClient.setCredentials(newCredentials);
    setCredentials(newCredentials);
    setShowPrompt(false);
  }, []);

  const logout = useCallback(() => {
    apiClient.setCredentials(null);
    setCredentials(null);
  }, []);

  const promptLogin = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const cancelPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return {
    credentials,
    isAuthenticated: !!credentials,
    showPrompt,
    login,
    logout,
    promptLogin,
    cancelPrompt,
  };
}
