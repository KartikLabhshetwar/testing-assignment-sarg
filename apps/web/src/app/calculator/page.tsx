'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, DollarSign, Percent, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CalculationResult {
  name: string;
  value: number | string;
  description: string;
  category: string;
}

interface CalculatorResponse {
  calculations: CalculationResult[];
  resultsByCategory: Record<string, CalculationResult[]>;
  insights: {
    financialHealth: {
      grossProfit: number;
      currentRatio: number;
      workingCapital: number;
      roa: number;
    };
    growthPotential: {
      salesGrowth: number;
      ltvCacRatio: number;
      customerRetention: number;
      marketPenetration: number;
    };
    operationalEfficiency: {
      revenuePerEmployee: number;
      inventoryTurnover: number;
      assetTurnover: number;
      dailyRevenueTarget: number;
    };
  };
  summary: {
    totalCalculations: number;
    categories: string[];
    lastCalculated: string;
  };
}

export default function CalculatorPage() {
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [resultsByCategory, setResultsByCategory] = useState<Record<string, CalculationResult[]>>({});
  const [insights, setInsights] = useState<CalculatorResponse['insights'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    revenue: 100000,
    costs: 60000,
    units: 1000,
    price: 100,
    inventory: 50000,
    employees: 10,
    workingDays: 250,
    assets: 500000,
    liabilities: 200000,
    currentAssets: 150000,
    currentLiabilities: 50000,
    salesGrowth: 15,
    marketShare: 5,
    conversionRate: 2.5,
    customerAcquisitionCost: 50,
    customerLifetimeValue: 500,
    churnRate: 5,
    averageOrderValue: 75,
    inventoryTurnover: 6,
    daysInPeriod: 365,
    grossMargin: 40,
  });

  // Backend calculation function
  const calculateMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error('Calculation failed');
      }

      const data: CalculatorResponse = await response.json();
      setResults(data.calculations);
      setResultsByCategory(data.resultsByCategory);
      setInsights(data.insights);
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Failed to calculate metrics');
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  // Calculate metrics when inputs change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateMetrics();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [calculateMetrics]);

  const handleInputChange = (key: keyof typeof inputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const categories = Object.keys(resultsByCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Profitability': return <DollarSign className="h-4 w-4" />;
      case 'Growth': return <TrendingUp className="h-4 w-4" />;
      case 'Customer Metrics': return <BarChart3 className="h-4 w-4" />;
      case 'Unit Economics': return <Calculator className="h-4 w-4" />;
      case 'Financial Ratios': return <Percent className="h-4 w-4" />;
      case 'Liquidity': return <TrendingUp className="h-4 w-4" />;
      case 'Productivity': return <BarChart3 className="h-4 w-4" />;
      case 'Sales Metrics': return <DollarSign className="h-4 w-4" />;
      case 'Inventory': return <BarChart3 className="h-4 w-4" />;
      case 'Pricing Strategy': return <DollarSign className="h-4 w-4" />;
      case 'Efficiency': return <TrendingUp className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Calculator className="h-8 w-8 mr-3" />
              Business Calculator
            </h1>
            <p className="text-muted-foreground">
              Calculate key business metrics and KPIs using your data. Adjust inputs to see real-time calculations.
            </p>
          </div>
          <Button 
            onClick={calculateMetrics} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Input Parameters</CardTitle>
          <CardDescription>
            Modify these values to calculate your business metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(inputs).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key} className="text-xs font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof typeof inputs, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results by Category */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span>Calculating metrics...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        categories.map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getCategoryIcon(category)}
                <span className="ml-2">{category}</span>
                <Badge variant="secondary" className="ml-2">
                  {resultsByCategory[category]?.length || 0} metrics
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultsByCategory[category]?.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{result.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {typeof result.value === 'string' ? result.value : result.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">{result.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Summary */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Financial Health</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Gross Profit: ${insights.financialHealth.grossProfit.toLocaleString()}</li>
                  <li>• Current Ratio: {insights.financialHealth.currentRatio.toFixed(2)}</li>
                  <li>• Working Capital: ${insights.financialHealth.workingCapital.toLocaleString()}</li>
                  <li>• ROA: {insights.financialHealth.roa.toFixed(2)}%</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Growth Potential</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sales Growth: {insights.growthPotential.salesGrowth}%</li>
                  <li>• LTV/CAC Ratio: {insights.growthPotential.ltvCacRatio.toFixed(1)}</li>
                  <li>• Customer Retention: {insights.growthPotential.customerRetention.toFixed(1)}%</li>
                  <li>• Market Penetration: {insights.growthPotential.marketPenetration}%</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">Operational Efficiency</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Revenue/Employee: ${insights.operationalEfficiency.revenuePerEmployee.toLocaleString()}</li>
                  <li>• Inventory Turnover: {insights.operationalEfficiency.inventoryTurnover.toFixed(1)}</li>
                  <li>• Asset Turnover: {insights.operationalEfficiency.assetTurnover.toFixed(2)}</li>
                  <li>• Daily Target: ${insights.operationalEfficiency.dailyRevenueTarget.toLocaleString()}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
