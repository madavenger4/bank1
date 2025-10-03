import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import { APP_NAME } from '../constants';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-slate-700 p-4 animate-fade-in">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01v.01M12 18v-1m0-1v-1m0-1V4m0 14v-1m0-1v-1m0-1v-1m0 1v.01M12 18v1m0-1v-1m0 1v-1m0-1v-1m0-1V4m0 14v1m0-1v-1m0 1v-1m0-1v-1m0-1V4"></path></svg>
          <h1 className="text-2xl font-bold text-primary-light">{APP_NAME}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-medium hidden sm:block">Welcome, {user?.name}</span>
          <Button onClick={logout} size="sm" variant="secondary">Logout</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;