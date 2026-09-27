import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PrivateUser, InAppNotification } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: PrivateUser | null;
  isLoading: boolean;
  simulatedDate: string;
  notifications: InAppNotification[];
  unreadNotifsCount: number;
  login: (token: string, user: PrivateUser) => void;
  logout: () => Promise<void>;
  cleanAllUsersAndStartFresh: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (params: {
    email: string;
    password: string;
    displayName: string;
    realName: string;
    birthday: string;
    gender: string;
  }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUser: (user: PrivateUser) => void;
  setSimulatedDate: (date: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'signup' | 'reset') => void;
  authModalState: { isOpen: boolean; mode: 'login' | 'signup' | 'reset' };
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PrivateUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simulatedDate, setSimDate] = useState<string>(api.getSimulatedDate());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'signup' | 'reset' }>({
    isOpen: false,
    mode: 'login',
  });

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch {
      // ignore in background
    }
  }, [user]);

  // Load user session on mount directly from database via JWT token
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      const res = await api.login({ email: email.trim(), password: pass });
      api.setToken(res.token);
      setUser(res.user);
      closeAuthModal();
    } catch (err: any) {
      console.error('Sign-In failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (params: {
    email: string;
    password: string;
    displayName: string;
    realName: string;
    birthday: string;
    gender: string;
  }) => {
    try {
      setIsLoading(true);
      const res = await api.signup({
        email: params.email.trim(),
        password: params.password,
        displayName: params.displayName.trim(),
        realName: params.realName.trim(),
        birthday: params.birthday,
        gender: params.gender,
      });
      api.setToken(res.token);
      setUser(res.user);
      closeAuthModal();
    } catch (err: any) {
      console.error('Signup failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await api.requestPasswordReset(email.trim());
  };

  const login = (token: string, newUser: PrivateUser) => {
    api.setToken(token);
    setUser(newUser);
    closeAuthModal();
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      api.setToken(null);
      setUser(null);
      setNotifications([]);
    }
  };

  const cleanAllUsersAndStartFresh = async () => {
    try {
      await api.cleanAllUsers();
    } finally {
      api.setToken(null);
      setUser(null);
      setNotifications([]);
    }
  };

  const updateUser = (updatedUser: PrivateUser) => {
    setUser(updatedUser);
  };

  const setSimulatedDate = async (newDate: string) => {
    api.setSimulatedDate(newDate);
    setSimDate(newDate);
    await api.setServerSimulatedDate(newDate).catch(() => {});
  };

  const openAuthModal = (mode: 'login' | 'signup' | 'reset' = 'login') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        simulatedDate,
        notifications,
        unreadNotifsCount,
        login,
        logout,
        cleanAllUsersAndStartFresh,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        updateUser,
        setSimulatedDate,
        refreshUser,
        refreshNotifications,
        openAuthModal,
        authModalState,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
