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
        fetch('http://localhost:3000/api/sales?pageSize=10'),
        fetch('http://localhost:3000/api/inventory?pageSize=10'),
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
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Business Intelligence Dashboard. Here's an overview of your key metrics.
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sales.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{stats.sales.growth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.sales.revenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inventory.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Total catalog size
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inventory.lowStock}</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
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
            <div className="space-y-4">
              {stats.recent.orders.map((order: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{order.order_id}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${Number(order.total_amount).toFixed(2)}</div>
                    <Badge variant="outline" className="text-xs">
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
            <div className="space-y-4">
              {stats.recent.alerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All inventory levels are healthy!</p>
                </div>
              ) : (
                stats.recent.alerts.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        {item.stock_quantity} left
                      </div>
                      <div className="text-xs text-muted-foreground">
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
            <CardTitle className="text-lg">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Average Order Value</span>
                <span className="font-medium">
                  ${(stats.sales.revenue / stats.sales.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Growth Rate</span>
                <span className="font-medium text-green-600">+{stats.sales.growth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Value</span>
                <span className="font-medium">${stats.inventory.value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Stock Status</span>
                <Badge variant={stats.inventory.lowStock === 0 ? 'default' : 'destructive'}>
                  {stats.inventory.lowStock === 0 ? 'Healthy' : `${stats.inventory.lowStock} Low`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/sales" className="block text-sm text-blue-600 hover:underline">
                → View Sales Data
              </a>
              <a href="/inventory" className="block text-sm text-blue-600 hover:underline">
                → Manage Inventory
              </a>
              <a href="/reports" className="block text-sm text-blue-600 hover:underline">
                → Generate Reports
              </a>
              <a href="/calculator" className="block text-sm text-blue-600 hover:underline">
                → Business Calculator
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
