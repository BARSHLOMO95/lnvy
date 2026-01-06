import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import { Receipt, TrendingUp, Calculator } from 'lucide-react';

interface SupplierCardModalProps {
  supplierName: string | null;
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const SupplierCardModal = ({ supplierName, invoices, isOpen, onClose }: SupplierCardModalProps) => {
  if (!supplierName) return null;

  const supplierInvoices = invoices.filter(i => i.supplier_name === supplierName);
  const totalExpenses = supplierInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
  const averageExpense = supplierInvoices.length > 0 ? totalExpenses / supplierInvoices.length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">👤 כרטיס ספק - {supplierName}</DialogTitle>
        </DialogHeader>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Receipt className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{supplierInvoices.length}</p>
              <p className="text-sm text-muted-foreground">סה"כ חשבוניות</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-muted-foreground">סה"כ הוצאות</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 mx-auto text-pink-500 mb-2" />
              <p className="text-2xl font-bold text-pink-600">{formatCurrency(averageExpense)}</p>
              <p className="text-sm text-muted-foreground">ממוצע</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice list */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">רשימת חשבוניות</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {supplierInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{invoice.document_number}</span>
                  <span className="text-muted-foreground text-sm">
                    {format(new Date(invoice.document_date), 'dd/MM/yyyy')}
                  </span>
                  <span className="text-sm bg-background px-2 py-0.5 rounded">
                    {invoice.category}
                  </span>
                </div>
                <span className="font-bold">{formatCurrency(Number(invoice.total_amount))}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierCardModal;
