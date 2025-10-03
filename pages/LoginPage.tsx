import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01v.01M12 18v-1m0-1v-1m0-1V4m0 14v-1m0-1v-1m0-1v-1m0 1v.01M12 18v1m0-1v-1m0 1v-1m0-1v-1m0-1V4m0 14v1m0-1v-1m0 1v-1m0-1v-1m0-1V4"></path></svg>
        <h1 className="text-4xl font-bold text-primary-light">{APP_NAME}</h1>
      </div>
      <Card className="w-full max-w-md">
        <div className="flex border-b border-slate-700">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 font-semibold text-center transition-colors duration-300 ${isLogin ? 'text-primary-light border-b-2 border-primary-light' : 'text-slate-400 hover:text-slate-200'}`}>Login</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 font-semibold text-center transition-colors duration-300 ${!isLogin ? 'text-primary-light border-b-2 border-primary-light' : 'text-slate-400 hover:text-slate-200'}`}>Register</button>
        </div>
        <div className="p-0">
          {isLogin ? <LoginForm /> : <RegisterForm toggleForm={toggleForm} />}
        </div>
      </Card>
    </div>
  );
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <Input id="login-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input id="login-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Button type="submit" className="w-full" isLoading={isLoading}>Login</Button>
    </form>
  );
};

const RegisterForm = ({ toggleForm }: { toggleForm: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setError("PIN must be exactly 4 digits.");
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register(name, email, password, pin);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-6">
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <Input id="reg-name" label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input id="reg-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input id="reg-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Input id="reg-pin" label="4-Digit Transaction PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={4} pattern="\d{4}" />
      <Button type="submit" className="w-full" isLoading={isLoading}>Register</Button>
    </form>
  );
};

export default LoginPage;