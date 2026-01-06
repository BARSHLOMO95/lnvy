import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { KPIData } from '@/types/invoice';
import { FileText, Receipt, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  data: KPIData;
  documentCount: number;
  filteredCount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const KPICards = ({ data, documentCount, filteredCount }: KPICardsProps) => {
  const [animating, setAnimating] = useState<string | null>(null);
  const [prevData, setPrevData] = useState(data);

  useEffect(() => {
    const changedKeys: string[] = [];
    if (data.totalWithVat !== prevData.totalWithVat) changedKeys.push('totalWithVat');
    if (data.totalBeforeVat !== prevData.totalBeforeVat) changedKeys.push('totalBeforeVat');
    if (data.totalVat !== prevData.totalVat) changedKeys.push('totalVat');
    if (data.uniqueSuppliers !== prevData.uniqueSuppliers) changedKeys.push('uniqueSuppliers');

    if (changedKeys.length > 0) {
      changedKeys.forEach((key, index) => {
        setTimeout(() => {
          setAnimating(key);
          setTimeout(() => setAnimating(null), 300);
        }, index * 100);
      });
    }
    setPrevData(data);
  }, [data, prevData]);

  const cards = [
    {
      key: 'totalWithVat',
      label: 'סה"כ לתשלום',
      subtitle: 'כולל מע"מ',
      value: formatCurrency(data.totalWithVat),
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      key: 'totalBeforeVat',
      label: 'לפני מע"מ',
      subtitle: 'בסיס להוצאה',
      value: formatCurrency(data.totalBeforeVat),
      icon: Receipt,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
    {
      key: 'totalVat',
      label: 'סה"כ מע"מ',
      subtitle: 'זיכוי משוער',
      value: formatCurrency(data.totalVat),
      icon: ArrowUpDown,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      key: 'documents',
      label: 'מסמכים',
      subtitle: `מתוך ${documentCount}`,
      value: filteredCount.toString(),
      icon: Filter,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className={cn(
            'overflow-hidden transition-all duration-300 hover:shadow-lg bg-card border',
            animating === card.key && 'animate-kpi-pulse ring-2 ring-primary'
          )}
        >
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-start justify-between flex-row-reverse">
              <div className={cn('p-2 sm:p-3 rounded-xl', card.iconBg)}>
                <card.icon className={cn('w-4 h-4 sm:w-6 sm:h-6', card.iconColor)} />
              </div>
              <div className="text-right flex-1 mr-2 sm:mr-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{card.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;
