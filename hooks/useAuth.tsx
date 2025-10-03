import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Account } from '../types';
import { useBankData, BankData } from './useBankData';

interface AuthContextType extends BankData {
  user: (User & { account: Account }) | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, pin: string) => Promise<void>;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bankData = useBankData();
  const [user, setUser] = useState<(User & { account: Account }) | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const storedUserId = localStorage.getItem('zenith-user-id');
    if (storedUserId) {
      const userData = bankData.getUserById(storedUserId);
      const accountData = bankData.getAccountByUserId(storedUserId);
      if (userData && accountData) {
        setUser({ ...userData, account: accountData });
      } else {
        localStorage.removeItem('zenith-user-id');
        setUser(null);
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankData.getUserById, bankData.getAccountByUserId]);
  

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<void> => {
    const loggedInUser = await bankData.loginUser(email, password);
    const account = bankData.getAccountByUserId(loggedInUser.id);
    if (account) {
      localStorage.setItem('zenith-user-id', loggedInUser.id);
      setUser({ ...loggedInUser, account });
    } else {
      throw new Error('Account not found for this user.');
    }
  };

  const logout = () => {
    localStorage.removeItem('zenith-user-id');
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, pin: string): Promise<void> => {
    const { newUser, newAccount: account } = await bankData.registerUser(name, email, password, pin);
    if(account) {
        localStorage.setItem('zenith-user-id', newUser.id);
        setUser({ ...newUser, account });
    } else {
        throw new Error('Failed to create an account during registration.');
    }
  };

  const value = {
    ...bankData,
    user,
    login,
    logout,
    register,
    loading,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};