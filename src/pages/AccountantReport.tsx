import { useEffect, useState } from 'react';
import { Invoice } from '@/types/invoice';

const AccountantReport = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totals, setTotals] = useState({
    beforeVat: 0,
    vat: 0,
    total: 0,
  });

  useEffect(() => {
    // Get invoices from localStorage
    const storedInvoices = localStorage.getItem('printInvoices');
    if (storedInvoices) {
      const parsed = JSON.parse(storedInvoices) as Invoice[];
      setInvoices(parsed);
      
      // Calculate totals
      const beforeVat = parsed.reduce((sum, inv) => sum + inv.amount_before_vat, 0);
      const vat = parsed.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0);
      const total = parsed.reduce((sum, inv) => sum + inv.total_amount, 0);
      setTotals({ beforeVat, vat, total });
      
      // Clear after reading (optional - keeps data fresh)
      // localStorage.removeItem('printInvoices');
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (invoices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-xl">לא נבחרו חשבוניות להדפסה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">דוח רואה חשבון</h1>
        <p className="text-gray-600">תאריך הפקה: {new Date().toLocaleDateString('he-IL')}</p>
        <p className="text-gray-600">סה"כ חשבוניות: {invoices.length}</p>
      </div>

      {/* Summary Table */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 border-r-4 border-blue-600 pr-3">סיכום חשבוניות</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-right">#</th>
              <th className="border border-gray-300 p-2 text-right">תאריך קליטה</th>
              <th className="border border-gray-300 p-2 text-right">תאריך מסמך</th>
              <th className="border border-gray-300 p-2 text-right">שם הספק</th>
              <th className="border border-gray-300 p-2 text-right">סוג עוסק</th>
              <th className="border border-gray-300 p-2 text-right">קטגוריה</th>
              <th className="border border-gray-300 p-2 text-right">סוג מסמך</th>
              <th className="border border-gray-300 p-2 text-right">מספר מסמך</th>
              <th className="border border-gray-300 p-2 text-right">לפני מע"מ</th>
              <th className="border border-gray-300 p-2 text-right">מע"מ</th>
              <th className="border border-gray-300 p-2 text-right">סכום כולל</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={invoice.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 p-2">{index + 1}</td>
                <td className="border border-gray-300 p-2">{formatDate(invoice.intake_date)}</td>
                <td className="border border-gray-300 p-2">{formatDate(invoice.document_date)}</td>
                <td className="border border-gray-300 p-2">{invoice.supplier_name}</td>
                <td className="border border-gray-300 p-2">{invoice.business_type}</td>
                <td className="border border-gray-300 p-2">{invoice.category}</td>
                <td className="border border-gray-300 p-2">{invoice.document_type}</td>
                <td className="border border-gray-300 p-2">{invoice.document_number}</td>
                <td className="border border-gray-300 p-2">{formatCurrency(invoice.amount_before_vat)}</td>
                <td className="border border-gray-300 p-2">{invoice.vat_amount ? formatCurrency(invoice.vat_amount) : '-'}</td>
                <td className="border border-gray-300 p-2">{formatCurrency(invoice.total_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-100 font-bold">
              <td colSpan={8} className="border border-gray-300 p-2 text-left">סה"כ</td>
              <td className="border border-gray-300 p-2">{formatCurrency(totals.beforeVat)}</td>
              <td className="border border-gray-300 p-2">{formatCurrency(totals.vat)}</td>
              <td className="border border-gray-300 p-2">{formatCurrency(totals.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Images Section */}
      {invoices.some(inv => inv.image_url) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 border-r-4 border-blue-600 pr-3">תמונות חשבוניות</h2>
          <div className="space-y-8">
            {invoices.filter(inv => inv.image_url).map((invoice, index) => (
              <div key={invoice.id} className="border border-gray-300 rounded-lg p-4 break-inside-avoid text-center">
                <div className="flex justify-between items-center mb-3 pb-2 border-b text-right">
                  <span className="font-bold">{index + 1}. {invoice.supplier_name}</span>
                  <span className="text-gray-600">מספר מסמך: {invoice.document_number}</span>
                </div>
                <div className="flex justify-center items-center">
                  <img 
                    src={invoice.image_url!} 
                    alt={`חשבונית ${invoice.document_number}`}
                    className="max-w-[80%] max-h-[600px] object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Button - Hidden when printing */}
      <div className="fixed bottom-4 left-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          הדפס דוח
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountantReport;
