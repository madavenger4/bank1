import jsPDF from 'jspdf';
// FIX: Changed import to use autoTable as a function. This is the recommended way for module-based projects and helps with type inference, avoiding the need for manual module augmentation.
import autoTable from 'jspdf-autotable';
import { User, Account, Transaction } from '../types';
import { APP_NAME } from '../constants';

// FIX: Removed the manual module augmentation for 'jspdf'. It was causing a "module not found" error and is not necessary when using the functional import of `jspdf-autotable`.

export const generateStatementPDF = (
  user: User,
  account: Account,
  transactions: Transaction[],
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(8, 145, 178); // Primary color
  doc.text(APP_NAME, 14, 22);
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Account Statement', 14, 30);
  
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // User and Account Details
  doc.setFontSize(12);
  doc.text('Account Holder:', 14, 45);
  doc.text(user.name, 50, 45);

  doc.text('Account Number:', 14, 52);
  doc.text(account.accountNumber, 50, 52);
  
  doc.text('Statement Period:', 14, 59);
  doc.text(`${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 50, 59);
  
  doc.text('Generated On:', 14, 66);
  doc.text(new Date().toLocaleString(), 50, 66);

  // Transactions Table
  const tableColumn = ["Date", "Description", "Type", "Debit (-)", "Credit (+)"];
  // FIX: Changed the type of `tableRows` to `any[]` to accommodate both arrays of strings (for transaction rows) and arrays of objects (for the styled final balance row), resolving the type error.
  const tableRows: any[] = [];

  transactions.forEach(tx => {
    const isDebit = tx.type === 'Withdrawal' || tx.type === 'Transfer (Debit)';
    const txRow = [
      new Date(tx.timestamp).toLocaleString(),
      tx.description,
      tx.type,
      isDebit ? `-${tx.amount.toFixed(2)}` : '',
      !isDebit ? `+${tx.amount.toFixed(2)}` : '',
    ];
    tableRows.push(txRow);
  });
  
  const finalBalanceRow = [
    { content: 'Final Balance', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: account.balance.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }
  ];
  tableRows.push(finalBalanceRow);


  // FIX: Switched from `doc.autoTable` to calling `autoTable(doc, ...)` to align with the functional import.
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    headStyles: { fillColor: [8, 145, 178] }, // Primary color
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`statement_${account.accountNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
};
