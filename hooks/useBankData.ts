import { useState, useEffect, useCallback } from 'react';
import { User, Account, Transaction, TransactionType } from '../types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../constants';

// Simple hashing function for demonstration (in a real app, use a proper library like bcrypt)
const simpleHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateAccountNumber = () => Math.random().toString().slice(2, 12);

const useBankData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('zenith-users') || '[]');
    const storedAccounts = JSON.parse(localStorage.getItem('zenith-accounts') || '[]');
    const storedTransactions = JSON.parse(localStorage.getItem('zenith-transactions') || '[]');

    const initializeAdmin = async () => {
      if (storedUsers.length === 0) {
        const passwordHash = await simpleHash(ADMIN_PASSWORD);
        const adminUser: User = {
          id: 'admin-user',
          name: 'Admin',
          email: ADMIN_EMAIL,
          passwordHash,
          pinHash: '', 
          role: 'admin',
        };
        setUsers([adminUser]);
      } else {
        setUsers(storedUsers);
      }
    };
    
    initializeAdmin();
    setAccounts(storedAccounts);
    setTransactions(storedTransactions);
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('zenith-users', JSON.stringify(users));
    }
  }, [users]);
  
  useEffect(() => {
    localStorage.setItem('zenith-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('zenith-transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  const registerUser = async (name: string, email: string, password: string, pin: string): Promise<{ newUser: User, newAccount: Account }> => {
    if (users.some(u => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    const passwordHash = await simpleHash(password);
    const pinHash = await simpleHash(pin);
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      pinHash,
      role: 'user',
    };

    const newAccount: Account = {
      accountNumber: generateAccountNumber(),
      userId: newUser.id,
      balance: 0,
    };

    setUsers(prev => [...prev, newUser]);
    setAccounts(prev => [...prev, newAccount]);
    return { newUser, newAccount };
  };

  const loginUser = async (email: string, password: string): Promise<User> => {
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Invalid email or password.');
    
    const passwordHash = await simpleHash(password);
    if (user.passwordHash !== passwordHash) throw new Error('Invalid email or password.');
    
    return user;
  };
  
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  
  const getAccountByUserId = useCallback((userId: string) => accounts.find(a => a.userId === userId), [accounts]);
  
  const getAccountByNumber = useCallback((accountNumber: string) => accounts.find(a => a.accountNumber === accountNumber), [accounts]);

  const addTransaction = (accountId: string, type: TransactionType, amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      accountId,
      type,
      amount,
      timestamp: new Date().toISOString(),
      description,
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    const pinHash = await simpleHash(pin);
    return user.pinHash === pinHash;
  };
  
  const changePin = async (userId: string, oldPin: string, newPin: string): Promise<void> => {
     const isOldPinValid = await verifyPin(userId, oldPin);
     if (!isOldPinValid) throw new Error("Incorrect old PIN.");
     
     const newPinHash = await simpleHash(newPin);
     setUsers(prevUsers => prevUsers.map(user => 
       user.id === userId ? { ...user, pinHash: newPinHash } : user
     ));
  };
  
  const deposit = (accountNumber: string, amount: number) => {
    let targetAccount: Account | undefined;
    setAccounts(prev => prev.map(acc => {
      if (acc.accountNumber === accountNumber) {
        targetAccount = { ...acc, balance: acc.balance + amount };
        return targetAccount;
      }
      return acc;
    }));
    if (targetAccount) {
      addTransaction(targetAccount.accountNumber, TransactionType.DEPOSIT, amount, `Deposit of $${amount.toFixed(2)}`);
    } else {
      throw new Error("Account not found");
    }
  };

  const withdraw = (accountNumber: string, amount: number) => {
    let targetAccount: Account | undefined;
    setAccounts(prev => prev.map(acc => {
      if (acc.accountNumber === accountNumber) {
        if (acc.balance < amount) throw new Error("Insufficient funds.");
        targetAccount = { ...acc, balance: acc.balance - amount };
        return targetAccount;
      }
      return acc;
    }));
    if (targetAccount) {
      addTransaction(targetAccount.accountNumber, TransactionType.WITHDRAWAL, amount, `Withdrawal of $${amount.toFixed(2)}`);
    } else {
      throw new Error("Account not found");
    }
  };

  const transfer = (fromAccountNumber: string, toAccountNumber: string, amount: number) => {
    const fromAccount = getAccountByNumber(fromAccountNumber);
    const toAccount = getAccountByNumber(toAccountNumber);

    if (!fromAccount || !toAccount) throw new Error("Invalid account number.");
    if (fromAccount.balance < amount) throw new Error("Insufficient funds.");
    if (fromAccountNumber === toAccountNumber) throw new Error("Cannot transfer to the same account.");

    setAccounts(prev => prev.map(acc => {
      if (acc.accountNumber === fromAccountNumber) return { ...acc, balance: acc.balance - amount };
      if (acc.accountNumber === toAccountNumber) return { ...acc, balance: acc.balance + amount };
      return acc;
    }));

    addTransaction(fromAccountNumber, TransactionType.TRANSFER_DEBIT, amount, `Transfer to ${toAccountNumber}`);
    addTransaction(toAccountNumber, TransactionType.TRANSFER_CREDIT, amount, `Transfer from ${fromAccountNumber}`);
  };

  const getTransactionsByAccountId = useCallback((accountId: string) => {
    return transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions]);
  
  const getAllUsersWithAccounts = useCallback(() => {
    return users
      .filter(u => u.role === 'user')
      .map(user => ({
        ...user,
        account: accounts.find(acc => acc.userId === user.id)
      }));
  }, [users, accounts]);

  const importData = (data: { users: User[], accounts: Account[], transactions: Transaction[] }) => {
    if (!data.users || !data.accounts || !data.transactions) {
      throw new Error("Invalid data file. Missing required fields.");
    }
    setUsers(data.users);
    setAccounts(data.accounts);
    setTransactions(data.transactions);
  };
  
  return { 
    users, 
    accounts, 
    transactions,
    registerUser, 
    loginUser, 
    getUserById,
    getAccountByUserId,
    getAccountByNumber,
    verifyPin,
    changePin,
    deposit,
    withdraw,
    transfer,
    getTransactionsByAccountId,
    getAllUsersWithAccounts,
    importData,
  };
};

export type BankData = ReturnType<typeof useBankData>;
export { useBankData };