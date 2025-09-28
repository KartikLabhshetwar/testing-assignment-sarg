'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  sales: {
    total: number;
    revenue: number;
    growth: number;
  };
  inventory: {
    total: number;
    lowStock: number;
    value: number;
  };
  recent: {
    orders: any[];
    alerts: any[];
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [salesResponse, inventoryResponse] = await Promise.all([
        fetch('/api/sales?pageSize=10'),
        fetch('/api/inventory?pageSize=10'),
      ]);

      const salesData = await salesResponse.json();
      const inventoryData = await inventoryResponse.json();

      // Calculate stats
      const totalRevenue = salesData.data.reduce((sum: number, sale: any) => 
        sum + Number(sale.total_amount), 0
      );

      const lowStockItems = inventoryData.data.filter((item: any) => 
        item.stock_quantity <= item.reorder_level
      );

      const inventoryValue = inventoryData.data.reduce((sum: number, item: any) => 
        sum + (item.stock_quantity * Number(item.unit_cost)), 0
      );

      setStats({
        sales: {
          total: salesData.pagination.total,
          revenue: totalRevenue,
          growth: 12.5, // Mock growth rate
        },
        inventory: {
          total: inventoryData.pagination.total,
          lowStock: lowStockItems.length,
          value: inventoryValue,
        },
        recent: {
          orders: salesData.data.slice(0, 5),
          alerts: lowStockItems.slice(0, 5),
        },
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground">Unable to fetch dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide">Dashboard</h1>
        <p className="text-lg font-medium text-gray-600 mt-2">
          Welcome to your Business Intelligence Dashboard. Here's an overview of your key metrics.
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Total Sales</CardTitle>
            <ShoppingCart className="h-6 w-6 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sales.total.toLocaleString()}</div>
            <div className="flex items-center text-base text-green-600 font-medium">
              <TrendingUp className="h-4 w-4 mr-2" />
              +{stats.sales.growth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Total Revenue</CardTitle>
            <DollarSign className="h-6 w-6 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.sales.revenue.toFixed(2)}</div>
            <div className="flex items-center text-base text-green-600 font-medium">
              <TrendingUp className="h-4 w-4 mr-2" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Inventory Items</CardTitle>
            <Package className="h-6 w-6 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inventory.total.toLocaleString()}</div>
            <div className="flex items-center text-base text-gray-600 font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              Total catalog size
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-6 w-6 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.inventory.lowStock}</div>
            <div className="flex items-center text-base text-red-600 font-medium">
              <TrendingDown className="h-4 w-4 mr-2" />
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recent.orders.map((order: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border-2 border-gray-200 bg-white">
                  <div>
                    <div className="font-bold text-base">{order.order_id}</div>
                    <div className="text-base text-gray-600 font-medium">
                      {order.customer_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${Number(order.total_amount).toFixed(2)}</div>
                    <Badge variant="outline" className="text-sm font-bold">
                      {order.region}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items requiring restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recent.alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-bold">All inventory levels are healthy!</p>
                </div>
              ) : (
                stats.recent.alerts.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border-2 border-gray-200 bg-white">
                    <div>
                      <div className="font-bold text-base">{item.product_name}</div>
                      <div className="text-base text-gray-600 font-medium">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-600">
                        {item.stock_quantity} left
                      </div>
                      <div className="text-base text-gray-600 font-medium">
                        Reorder at {item.reorder_level}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-wide">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-base font-bold">Average Order Value</span>
                <span className="font-bold text-lg">
                  ${(stats.sales.revenue / stats.sales.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base font-bold">Growth Rate</span>
                <span className="font-bold text-lg text-green-600">+{stats.sales.growth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-wide">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-base font-bold">Total Value</span>
                <span className="font-bold text-lg">${stats.inventory.value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base font-bold">Stock Status</span>
                <Badge variant={stats.inventory.lowStock === 0 ? 'default' : 'destructive'} className="text-sm font-bold">
                  {stats.inventory.lowStock === 0 ? 'Healthy' : `${stats.inventory.lowStock} Low`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <a href="/sales" className="block text-base font-bold text-black hover:text-gray-600 border-b-2 border-transparent hover:border-black transition-colors">
                → View Sales Data
              </a>
              <a href="/inventory" className="block text-base font-bold text-black hover:text-gray-600 border-b-2 border-transparent hover:border-black transition-colors">
                → Manage Inventory
              </a>
              <a href="/reports" className="block text-base font-bold text-black hover:text-gray-600 border-b-2 border-transparent hover:border-black transition-colors">
                → Generate Reports
              </a>
              <a href="/calculator" className="block text-base font-bold text-black hover:text-gray-600 border-b-2 border-transparent hover:border-black transition-colors">
                → Business Calculator
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
