import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import PinInput from '../components/PinInput';
import { Transaction, TransactionType } from '../types';
import { generateStatementPDF } from '../services/pdfService';
import Notification from '../components/Notification';

type ActiveModal = 'deposit' | 'withdraw' | 'transfer' | 'changePin' | null;

const DashboardPage: React.FC = () => {
    const { user, getTransactionsByAccountId, refreshUser } = useAuth();
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const transactions = user ? getTransactionsByAccountId(user.account.accountNumber) : [];

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    const handleSuccess = (message: string) => {
        showNotification(message, 'success');
        setActiveModal(null);
        refreshUser();
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            <Header />
            <main className="container mx-auto p-4 md:p-6 space-y-6">
                <AccountSummaryCard account={user.account} />
                <ActionButtons onButtonClick={setActiveModal} />
                <TransactionHistoryCard transactions={transactions} user={user} account={user.account} />
            </main>

            <DepositModal isOpen={activeModal === 'deposit'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} showNotification={showNotification} />
            <WithdrawModal isOpen={activeModal === 'withdraw'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} showNotification={showNotification} />
            <TransferModal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} showNotification={showNotification} />
            <ChangePinModal isOpen={activeModal === 'changePin'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} showNotification={showNotification} />
        </div>
    );
};

const AccountSummaryCard: React.FC<{ account: { balance: number; accountNumber: string; } }> = ({ account }) => (
    <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-lg text-cyan-200">Current Balance</p>
                <p className="text-4xl font-bold tracking-tight">${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
                <p className="text-sm text-cyan-200 text-right">Account Number</p>
                <p className="text-lg font-semibold text-right">{account.accountNumber}</p>
            </div>
        </div>
    </Card>
);

const ActionButtons: React.FC<{ onButtonClick: (modal: ActiveModal) => void }> = ({ onButtonClick }) => (
    <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton icon={<DepositIcon />} label="Deposit" onClick={() => onButtonClick('deposit')} />
            <ActionButton icon={<WithdrawIcon />} label="Withdraw" onClick={() => onButtonClick('withdraw')} />
            <ActionButton icon={<TransferIcon />} label="Transfer" onClick={() => onButtonClick('transfer')} />
            <ActionButton icon={<PinIcon />} label="Change PIN" onClick={() => onButtonClick('changePin')} />
        </div>
    </Card>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-subtle hover:bg-slate-600 rounded-lg transition-colors duration-300 space-y-2">
        <div className="w-12 h-12 bg-primary-dark text-primary-light rounded-full flex items-center justify-center">{icon}</div>
        <span className="font-semibold text-slate-200">{label}</span>
    </button>
);


const TransactionHistoryCard: React.FC<{ transactions: Transaction[], user: any, account: any }> = ({ transactions, user, account }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const filteredTransactions = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return transactions.filter(tx => {
            const txDate = new Date(tx.timestamp);
            return txDate >= start && txDate <= end;
        });
    }, [transactions, startDate, endDate]);

    const handleDownload = () => {
        generateStatementPDF(user, account, filteredTransactions, startDate, endDate);
    };

    return (
        <Card title="Transaction History">
             <div className="flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-slate-700">
                <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <Input id="end-date" label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                <div className="self-end">
                    <Button onClick={handleDownload} disabled={filteredTransactions.length === 0}>Download PDF</Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                            <th className="p-2 font-semibold">Date</th>
                            <th className="p-2 font-semibold">Description</th>
                            <th className="p-2 font-semibold">Type</th>
                            <th className="p-2 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                            <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                                <td className="p-2 text-sm text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                <td className="p-2 text-slate-200">{tx.description}</td>
                                <td className="p-2"><TransactionTypeBadge type={tx.type} /></td>
                                <td className={`p-2 text-right font-semibold ${tx.type.includes('Credit') || tx.type.includes('Deposit') ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.type.includes('Credit') || tx.type.includes('Deposit') ? '+' : '-'}${tx.amount.toFixed(2)}
                                </td>
                            </tr>
                        )) : <tr><td colSpan={4} className="text-center p-8 text-slate-500">No transactions found for the selected period.</td></tr>}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const TransactionTypeBadge: React.FC<{ type: TransactionType }> = ({ type }) => {
    const colors = {
        [TransactionType.DEPOSIT]: 'bg-green-500/20 text-green-300',
        [TransactionType.WITHDRAWAL]: 'bg-red-500/20 text-red-300',
        [TransactionType.TRANSFER_DEBIT]: 'bg-yellow-500/20 text-yellow-300',
        [TransactionType.TRANSFER_CREDIT]: 'bg-blue-500/20 text-blue-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type]}`}>{type}</span>;
};


// MODAL COMPONENTS
const BaseTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSuccess: (message: string) => void;
    showNotification: (message: string, type: 'error' | 'success') => void;
    children: (isPinStage: boolean, setPinStage: React.Dispatch<React.SetStateAction<boolean>>) => React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    const [isPinStage, setPinStage] = useState(false);

    const handleClose = () => {
        setPinStage(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            {children(isPinStage, setPinStage)}
        </Modal>
    );
};


const DepositModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: (m: string) => void, showNotification: (m: string, t: 'error' | 'success') => void }> = ({ isOpen, onClose, onSuccess, showNotification }) => {
    const { user, deposit } = useAuth();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!user) throw new Error("User not found");
            const depositAmount = parseFloat(amount);
            if (isNaN(depositAmount) || depositAmount <= 0) {
                throw new Error("Invalid amount");
            }
            deposit(user.account.accountNumber, depositAmount);
            setAmount('');
            onSuccess(`$${depositAmount.toFixed(2)} deposited successfully.`);
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Deposit Funds">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="deposit-amount" label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" required />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Deposit</Button>
                </div>
            </form>
        </Modal>
    );
};

const WithdrawModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: (m: string) => void, showNotification: (m: string, t: 'error' | 'success') => void }> = ({ isOpen, onClose, onSuccess, showNotification }) => {
    const { user, withdraw, verifyPin } = useAuth();
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [isPinStage, setPinStage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleProceed = (e: React.FormEvent) => {
        e.preventDefault();
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            showNotification("Invalid amount", 'error');
            return;
        }
        if (user && user.account.balance < withdrawAmount) {
            showNotification("Insufficient funds", 'error');
            return;
        }
        setPinStage(true);
    };

    const handleWithdraw = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const isValidPin = await verifyPin(user.id, pin);
            if (!isValidPin) throw new Error("Incorrect PIN");
            const withdrawAmount = parseFloat(amount);
            withdraw(user.account.accountNumber, withdrawAmount);
            setAmount(''); setPin('');
            onSuccess(`$${withdrawAmount.toFixed(2)} withdrawn successfully.`);
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
            setPinStage(false);
        }
    };
    
    const handleClose = () => {
        setAmount('');
        setPin('');
        setPinStage(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw Funds">
            {!isPinStage ? (
                <form onSubmit={handleProceed} className="space-y-4">
                    <Input id="withdraw-amount" label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" required />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button type="submit">Proceed</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    <p className="text-center">Enter your 4-digit PIN to confirm withdrawal of <span className="font-bold text-primary-light">${parseFloat(amount).toFixed(2)}</span>.</p>
                    <PinInput length={4} onChange={setPin} />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setPinStage(false)}>Back</Button>
                        <Button onClick={handleWithdraw} isLoading={isLoading} disabled={pin.length !== 4}>Confirm</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const TransferModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: (m: string) => void, showNotification: (m: string, t: 'error' | 'success') => void }> = ({ isOpen, onClose, onSuccess, showNotification }) => {
    const { user, transfer, verifyPin, getAccountByNumber } = useAuth();
    const [amount, setAmount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [pin, setPin] = useState('');
    const [isPinStage, setPinStage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleProceed = (e: React.FormEvent) => {
        e.preventDefault();
        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            showNotification("Invalid amount", 'error');
            return;
        }
        if (!getAccountByNumber(toAccount)) {
            showNotification("Recipient account does not exist.", 'error');
            return;
        }
        if (user && user.account.accountNumber === toAccount) {
            showNotification("Cannot transfer to your own account.", 'error');
            return;
        }
        if (user && user.account.balance < transferAmount) {
            showNotification("Insufficient funds", 'error');
            return;
        }
        setPinStage(true);
    };

    const handleTransfer = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const isValidPin = await verifyPin(user.id, pin);
            if (!isValidPin) throw new Error("Incorrect PIN");
            const transferAmount = parseFloat(amount);
            transfer(user.account.accountNumber, toAccount, transferAmount);
            setAmount(''); setToAccount(''); setPin('');
            onSuccess(`$${transferAmount.toFixed(2)} transferred to ${toAccount} successfully.`);
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
            setPinStage(false);
        }
    };
    
    const handleClose = () => {
        setAmount('');
        setToAccount('');
        setPin('');
        setPinStage(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Funds">
            {!isPinStage ? (
                <form onSubmit={handleProceed} className="space-y-4">
                    <Input id="to-account" label="Recipient Account Number" type="text" value={toAccount} onChange={e => setToAccount(e.target.value)} required />
                    <Input id="transfer-amount" label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" required />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                        <Button type="submit">Proceed</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    <p className="text-center">Enter PIN to transfer <span className="font-bold text-primary-light">${parseFloat(amount).toFixed(2)}</span> to account <span className="font-bold text-primary-light">{toAccount}</span>.</p>
                    <PinInput length={4} onChange={setPin} />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setPinStage(false)}>Back</Button>
                        <Button onClick={handleTransfer} isLoading={isLoading} disabled={pin.length !== 4}>Confirm</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const ChangePinModal: React.FC<{ isOpen: boolean, onClose: () => void, onSuccess: (m: string) => void, showNotification: (m: string, t: 'error' | 'success') => void }> = ({ isOpen, onClose, onSuccess, showNotification }) => {
    const { user, changePin } = useAuth();
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            showNotification("New PIN must be 4 digits.", 'error');
            return;
        }
        if (newPin !== confirmNewPin) {
            showNotification("New PINs do not match.", 'error');
            return;
        }
        setIsLoading(true);
        try {
            await changePin(user.id, oldPin, newPin);
            setOldPin(''); setNewPin(''); setConfirmNewPin('');
            onSuccess("PIN changed successfully.");
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Change Transaction PIN">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="old-pin" label="Old PIN" type="password" value={oldPin} onChange={e => setOldPin(e.target.value)} maxLength={4} required />
                <Input id="new-pin" label="New PIN" type="password" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={4} required />
                <Input id="confirm-new-pin" label="Confirm New PIN" type="password" value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} maxLength={4} required />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Change PIN</Button>
                </div>
            </form>
        </Modal>
    );
};


// ICONS
const DepositIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const WithdrawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const TransferIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const PinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;


export default DashboardPage;