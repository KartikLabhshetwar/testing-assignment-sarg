import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

interface ReportData {
  salesSummary: {
    totalSales: number;
    totalRevenue: number;
    avgOrderValue: number;
    topRegions: Array<{ region: string; count: number; revenue: number }>;
  };
  inventorySummary: {
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
    topCategories: Array<{ category: string; count: number; value: number }>;
  };
  generatedAt: string;
}

async function getReportData(): Promise<ReportData> {
  const [salesData, inventoryData] = await Promise.all([
    prisma.sales.findMany({
      select: {
        total_amount: true,
        region: true,
        order_date: true,
      },
    }),
    prisma.inventory.findMany({
      select: {
        category: true,
        stock_quantity: true,
        reorder_level: true,
        unit_cost: true,
      },
    }),
  ]);

  // Calculate sales summary
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Top regions by revenue
  const regionMap = new Map<string, { count: number; revenue: number }>();
  salesData.forEach(sale => {
    const existing = regionMap.get(sale.region) || { count: 0, revenue: 0 };
    regionMap.set(sale.region, {
      count: existing.count + 1,
      revenue: existing.revenue + Number(sale.total_amount),
    });
  });
  const topRegions = Array.from(regionMap.entries())
    .map(([region, data]) => ({ region, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate inventory summary
  const totalItems = inventoryData.length;
  const lowStockCount = inventoryData.filter(item => item.stock_quantity <= item.reorder_level).length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.stock_quantity * Number(item.unit_cost)), 0);

  // Top categories by count
  const categoryMap = new Map<string, { count: number; value: number }>();
  inventoryData.forEach(item => {
    const existing = categoryMap.get(item.category) || { count: 0, value: 0 };
    categoryMap.set(item.category, {
      count: existing.count + 1,
      value: existing.value + (item.stock_quantity * Number(item.unit_cost)),
    });
  });
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    salesSummary: {
      totalSales,
      totalRevenue,
      avgOrderValue,
      topRegions,
    },
    inventorySummary: {
      totalItems,
      lowStockCount,
      totalValue,
      topCategories,
    },
    generatedAt: new Date().toISOString(),
  };
}

export default async function ReportRenderPage({
  searchParams,
}: {
  searchParams: { id?: string; config?: string };
}) {
  const data = await getReportData();

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-center">Business Intelligence Report</h1>
        <div className="text-center mt-2 text-gray-600">
          <p>Report ID: {searchParams.id || 'N/A'}</p>
          <p>Generated: {format(new Date(data.generatedAt), 'PPpp')}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Executive Summary</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Sales Performance</h3>
            <ul className="space-y-1 text-sm">
              <li>Total Orders: <strong>{data.salesSummary.totalSales.toLocaleString()}</strong></li>
              <li>Total Revenue: <strong>${data.salesSummary.totalRevenue.toFixed(2)}</strong></li>
              <li>Avg Order Value: <strong>${data.salesSummary.avgOrderValue.toFixed(2)}</strong></li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Inventory Status</h3>
            <ul className="space-y-1 text-sm">
              <li>Total Items: <strong>{data.inventorySummary.totalItems.toLocaleString()}</strong></li>
              <li>Low Stock Items: <strong className="text-red-600">{data.inventorySummary.lowStockCount}</strong></li>
              <li>Total Value: <strong>${data.inventorySummary.totalValue.toFixed(2)}</strong></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sales Analysis */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Sales Analysis</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Top Performing Regions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Region</th>
                  <th className="text-right py-2">Orders</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {data.salesSummary.topRegions.map((region, index) => (
                  <tr key={region.region} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 font-medium">{region.region}</td>
                    <td className="text-right py-2">{region.count.toLocaleString()}</td>
                    <td className="text-right py-2">${region.revenue.toFixed(2)}</td>
                    <td className="text-right py-2">${(region.revenue / region.count).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Inventory Analysis */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Inventory Analysis</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Top Categories by Value</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Total Value</th>
                  <th className="text-right py-2">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {data.inventorySummary.topCategories.map((category, index) => (
                  <tr key={category.category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 font-medium">{category.category}</td>
                    <td className="text-right py-2">{category.count.toLocaleString()}</td>
                    <td className="text-right py-2">${category.value.toFixed(2)}</td>
                    <td className="text-right py-2">${(category.value / category.count).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-gray-300 pt-4 mt-8 text-center text-sm text-gray-600">
        <p>This report was automatically generated by the Business Intelligence Dashboard</p>
        <p>For questions or support, contact your system administrator</p>
      </footer>
    </div>
  );
}
