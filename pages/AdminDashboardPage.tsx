import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Card from '../components/Card';
import Input from '../components/Input';
import { Transaction } from '../types';

type Tab = 'customers' | 'transactions';

const AdminDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('customers');

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto p-4 md:p-6 space-y-6">
                <h1 className="text-3xl font-bold text-slate-100">Admin Dashboard</h1>

                <div className="border-b border-slate-700">
                    <TabButton
                        label="Customer Accounts"
                        isActive={activeTab === 'customers'}
                        onClick={() => setActiveTab('customers')}
                    />
                    <TabButton
                        label="All Transactions"
                        isActive={activeTab === 'transactions'}
                        onClick={() => setActiveTab('transactions')}
                    />
                </div>

                <div>
                    {activeTab === 'customers' && <CustomerAccounts />}
                    {activeTab === 'transactions' && <AllTransactions />}
                </div>
            </main>
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 font-semibold text-center transition-colors duration-300 ${
            isActive ? 'text-primary-light border-b-2 border-primary-light' : 'text-slate-400 hover:text-slate-200'
        }`}
    >
        {label}
    </button>
);


const CustomerAccounts = () => {
    const { getAllUsersWithAccounts } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const allCustomers = getAllUsersWithAccounts();

    const filteredCustomers = useMemo(() => {
        return allCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.account?.accountNumber.includes(searchTerm)
        );
    }, [allCustomers, searchTerm]);

    return (
        <Card title="Customer Accounts">
            <div className="mb-4">
                <Input
                    id="customer-search"
                    label="Search by Name, Email, or Account Number"
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                            <th className="p-2 font-semibold">Name</th>
                            <th className="p-2 font-semibold">Email</th>
                            <th className="p-2 font-semibold">Account Number</th>
                            <th className="p-2 font-semibold text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                            <tr key={customer.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                                <td className="p-2 font-medium text-slate-200">{customer.name}</td>
                                <td className="p-2 text-slate-400">{customer.email}</td>
                                <td className="p-2 text-slate-400 font-mono">{customer.account?.accountNumber}</td>
                                <td className="p-2 text-right font-semibold text-slate-200">${customer.account?.balance.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center p-8 text-slate-500">No customers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const AllTransactions = () => {
    const { transactions, accounts } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            const account = accounts.find(acc => acc.accountNumber === tx.accountId);
            return { ...tx, user: account ? { userId: account.userId } : null };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [transactions, accounts]);

    const filteredTransactions = useMemo(() => {
        return enrichedTransactions.filter(tx =>
            tx.accountId.includes(searchTerm) ||
            tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [enrichedTransactions, searchTerm]);

    const stats = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (tx.type === 'Deposit' || tx.type === 'Transfer (Credit)') {
                acc.totalInflow += tx.amount;
            } else {
                acc.totalOutflow += tx.amount;
            }
            acc.totalTransactions += 1;
            return acc;
        }, { totalInflow: 0, totalOutflow: 0, totalTransactions: 0 });
    }, [transactions]);

    return (
        <Card title="System-wide Transactions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Transactions" value={stats.totalTransactions} />
                <StatCard label="Total Inflow" value={`$${stats.totalInflow.toFixed(2)}`} color="text-green-400" />
                <StatCard label="Total Outflow" value={`$${stats.totalOutflow.toFixed(2)}`} color="text-red-400" />
            </div>
            <div className="mb-4">
                <Input
                    id="transaction-search"
                    label="Search by Account, Type, or Description"
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                            <th className="p-2 font-semibold">Date</th>
                            <th className="p-2 font-semibold">Account Number</th>
                            <th className="p-2 font-semibold">Description</th>
                            <th className="p-2 font-semibold">Type</th>
                            <th className="p-2 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? filteredTransactions.map((tx: Transaction) => (
                            <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                                <td className="p-2 text-sm text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                <td className="p-2 font-mono text-slate-300">{tx.accountId}</td>
                                <td className="p-2 text-slate-300">{tx.description}</td>
                                <td className="p-2 text-slate-300">{tx.type}</td>
                                <td className={`p-2 text-right font-semibold ${tx.type.includes('Credit') || tx.type.includes('Deposit') ? 'text-green-400' : 'text-red-400'}`}>
                                    ${tx.amount.toFixed(2)}
                                </td>
                            </tr>
                        )) : (
                             <tr><td colSpan={5} className="text-center p-8 text-slate-500">No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-primary-light' }) => (
    <div className="bg-subtle p-4 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);


export default AdminDashboardPage;