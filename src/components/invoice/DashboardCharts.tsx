import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Invoice } from '@/types/invoice';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { LayoutGrid, TrendingUp, PieChart as PieChartIcon, BarChart3, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardChartsProps {
  invoices: Invoice[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `₪${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₪${(amount / 1000).toFixed(0)}K`;
  }
  return `₪${amount.toFixed(0)}`;
};

const DashboardCharts = ({ invoices }: DashboardChartsProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // הוצאות לפי קטגוריה - גרף עמודות
  const categoryData = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.total_amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [invoices]);

  // מגמת הוצאות - גרף קווי
  const trendData = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      const month = new Date(inv.document_date).toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
      acc[month] = (acc[month] || 0) + inv.total_amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6);
  }, [invoices]);

  // מע"מ חודשי
  const vatData = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      const month = new Date(inv.document_date).toLocaleDateString('he-IL', { month: 'short' });
      acc[month] = (acc[month] || 0) + (inv.vat_amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    return Object.entries(grouped)
      .map(([month, amount]) => ({ 
        month, 
        amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
      }))
      .slice(-6);
  }, [invoices]);

  // הוצאות לפי קטגוריה - עוגה
  const pieData = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.total_amount;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    return Object.entries(grouped)
      .map(([name, value]) => ({ 
        name, 
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(0) : '0'
      }))
      .sort((a, b) => b.value - a.value);
  }, [invoices]);

  // ממוצע לחשבונית לפי קטגוריה
  const avgByCategory = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      if (!acc[inv.category]) acc[inv.category] = { total: 0, count: 0 };
      acc[inv.category].total += inv.total_amount;
      acc[inv.category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    return Object.entries(grouped)
      .map(([name, data]) => ({ 
        name, 
        average: data.total / data.count,
        total: data.total
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
  }, [invoices]);

  // ספקים מובילים
  const topSuppliers = useMemo(() => {
    const grouped = invoices.reduce((acc, inv) => {
      if (!acc[inv.supplier_name]) acc[inv.supplier_name] = { total: 0, status: inv.status };
      acc[inv.supplier_name].total += inv.total_amount;
      return acc;
    }, {} as Record<string, { total: number; status: string }>);
    
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices]);

  const maxSupplier = topSuppliers[0]?.total || 1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-lg border shadow-sm" dir="rtl">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors flex-row-reverse">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="font-medium">📊 גרפים וניתוחים</span>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {invoices.length === 0 ? (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-muted/30">
                    <CardContent className="p-6 flex items-center justify-center h-[200px]">
                      <p className="text-muted-foreground">אין נתונים להצגה</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* הוצאות לפי קטגוריה - עמודות */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            הוצאות לפי קטגוריה
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="horizontal">
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickFormatter={formatCurrency}
                width={50}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{payload[0].payload.name}</p>
                        <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* מגמת הוצאות */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            מגמת הוצאות (כולל מע"מ)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrency} width={50} />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{payload[0].payload.month}</p>
                          <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              אין נתונים להצגה
            </div>
          )}
        </CardContent>
      </Card>

      {/* מע"מ חודשי */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            מע"מ חודשי %
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          {vatData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vatData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrency} width={50} />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{payload[0].payload.month}</p>
                          <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
                          <p className="text-muted-foreground text-sm">{payload[0].payload.percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" fill="hsl(330, 80%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              אין נתונים להצגה
            </div>
          )}
        </CardContent>
      </Card>

      {/* הוצאות לפי קטגוריה - עוגה */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            הוצאות לפי קטגוריה (אחוזים)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <div className="flex h-full flex-row-reverse">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-primary">{formatCurrency(payload[0].value as number)}</p>
                            <p className="text-muted-foreground text-sm">{payload[0].payload.percentage}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-36 text-xs space-y-1 overflow-y-auto">
              {pieData.slice(0, 8).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-right flex-row-reverse">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate flex-1 text-right">{formatCurrency(item.value)}</span>
                  <span className="text-muted-foreground shrink-0">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ממוצע לחשבונית לפי קטגוריה */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            ממוצע לחשבונית לפי קטגוריה
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] space-y-3 overflow-y-auto">
          {avgByCategory.map((item, index) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm flex-row-reverse">
                <span className="font-medium text-right">{formatCurrency(item.average)} ₪</span>
                <span className="text-primary font-medium">{formatCurrency(item.total)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(item.average / (avgByCategory[0]?.average || 1)) * 100}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">{item.name}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ספקים מובילים */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 justify-end flex-row-reverse">
            <Users className="h-4 w-4 text-muted-foreground" />
            ספקים מובילים (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] space-y-3 overflow-y-auto">
          {topSuppliers.map((supplier, index) => (
            <div key={supplier.name} className="space-y-1">
              <div className="flex justify-between text-sm flex-row-reverse">
                <span className="font-medium text-right truncate max-w-[150px]">{supplier.name}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  supplier.status === 'בתהליך' && "bg-blue-100 text-blue-700",
                  supplier.status === 'ממתין' && "bg-yellow-100 text-yellow-700",
                  supplier.status === 'טופל' && "bg-green-100 text-green-700",
                  supplier.status === 'חדש' && "bg-orange-100 text-orange-700"
                )}>
                  {supplier.status}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full float-right"
                    style={{ 
                      width: `${(supplier.total / maxSupplier) * 100}%`,
                      backgroundColor: index === 0 ? '#22c55e' : index === 1 ? '#ec4899' : '#f59e0b'
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{formatCurrency(supplier.total)} ₪</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default DashboardCharts;
