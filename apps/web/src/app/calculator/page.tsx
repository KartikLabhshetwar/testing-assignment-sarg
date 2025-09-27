'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, DollarSign, Percent, BarChart3 } from 'lucide-react';

interface CalculationResult {
  name: string;
  value: number | string;
  description: string;
  category: string;
}

export default function CalculatorPage() {
  const [results, setResults] = useState<CalculationResult[]>([]);
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

  const businessCalculations = [
    {
      name: 'Gross Profit',
      calculate: () => inputs.revenue - inputs.costs,
      description: 'Revenue minus direct costs',
      category: 'Profitability'
    },
    {
      name: 'Gross Profit Margin (%)',
      calculate: () => ((inputs.revenue - inputs.costs) / inputs.revenue * 100).toFixed(2) + '%',
      description: 'Gross profit as percentage of revenue',
      category: 'Profitability'
    },
    {
      name: 'Revenue per Unit',
      calculate: () => (inputs.revenue / inputs.units).toFixed(2),
      description: 'Average revenue generated per unit sold',
      category: 'Unit Economics'
    },
    {
      name: 'Cost per Unit',
      calculate: () => (inputs.costs / inputs.units).toFixed(2),
      description: 'Average cost per unit produced/sold',
      category: 'Unit Economics'
    },
    {
      name: 'Break-even Units',
      calculate: () => Math.ceil(inputs.costs / (inputs.price - (inputs.costs / inputs.units))),
      description: 'Units needed to break even',
      category: 'Break-even Analysis'
    },
    {
      name: 'Revenue per Employee',
      calculate: () => (inputs.revenue / inputs.employees).toFixed(0),
      description: 'Revenue generated per employee',
      category: 'Productivity'
    },
    {
      name: 'Daily Revenue Target',
      calculate: () => (inputs.revenue / inputs.workingDays).toFixed(2),
      description: 'Daily revenue needed to meet annual target',
      category: 'Targets'
    },
    {
      name: 'Return on Assets (%)',
      calculate: () => ((inputs.revenue - inputs.costs) / inputs.assets * 100).toFixed(2) + '%',
      description: 'Profitability relative to total assets',
      category: 'Financial Ratios'
    },
    {
      name: 'Debt-to-Equity Ratio',
      calculate: () => (inputs.liabilities / (inputs.assets - inputs.liabilities)).toFixed(2),
      description: 'Debt relative to equity',
      category: 'Financial Ratios'
    },
    {
      name: 'Current Ratio',
      calculate: () => (inputs.currentAssets / inputs.currentLiabilities).toFixed(2),
      description: 'Ability to pay short-term obligations',
      category: 'Liquidity'
    },
    {
      name: 'Working Capital',
      calculate: () => inputs.currentAssets - inputs.currentLiabilities,
      description: 'Short-term financial health',
      category: 'Liquidity'
    },
    {
      name: 'Sales Growth Rate (%)',
      calculate: () => inputs.salesGrowth + '%',
      description: 'Year-over-year sales growth',
      category: 'Growth'
    },
    {
      name: 'Market Penetration (%)',
      calculate: () => inputs.marketShare + '%',
      description: 'Share of total addressable market',
      category: 'Market Analysis'
    },
    {
      name: 'Customer Acquisition ROI (%)',
      calculate: () => (((inputs.customerLifetimeValue - inputs.customerAcquisitionCost) / inputs.customerAcquisitionCost) * 100).toFixed(1) + '%',
      description: 'Return on customer acquisition investment',
      category: 'Customer Metrics'
    },
    {
      name: 'LTV/CAC Ratio',
      calculate: () => (inputs.customerLifetimeValue / inputs.customerAcquisitionCost).toFixed(1),
      description: 'Customer lifetime value to acquisition cost ratio',
      category: 'Customer Metrics'
    },
    {
      name: 'Monthly Churn Rate (%)',
      calculate: () => (inputs.churnRate / 12).toFixed(2) + '%',
      description: 'Monthly customer churn rate',
      category: 'Customer Metrics'
    },
    {
      name: 'Customer Retention Rate (%)',
      calculate: () => (100 - inputs.churnRate).toFixed(1) + '%',
      description: 'Percentage of customers retained annually',
      category: 'Customer Metrics'
    },
    {
      name: 'Average Order Value',
      calculate: () => '$' + inputs.averageOrderValue.toFixed(2),
      description: 'Average value per order',
      category: 'Sales Metrics'
    },
    {
      name: 'Inventory Turnover Ratio',
      calculate: () => inputs.inventoryTurnover.toFixed(1),
      description: 'How many times inventory is sold per period',
      category: 'Inventory'
    },
    {
      name: 'Days Sales Outstanding',
      calculate: () => Math.round(inputs.daysInPeriod / inputs.inventoryTurnover),
      description: 'Average days to sell inventory',
      category: 'Inventory'
    },
    {
      name: 'Contribution Margin (%)',
      calculate: () => inputs.grossMargin + '%',
      description: 'Percentage of revenue available to cover fixed costs',
      category: 'Profitability'
    },
    {
      name: 'Price Elasticity Impact',
      calculate: () => {
        const priceIncrease = 0.1; // 10% increase
        const demandDecrease = 0.05; // 5% decrease (assumed)
        return ((priceIncrease - demandDecrease) * inputs.revenue).toFixed(0);
      },
      description: 'Revenue impact of 10% price increase (assuming 5% demand drop)',
      category: 'Pricing Strategy'
    },
  ];

  useEffect(() => {
    const calculatedResults = businessCalculations.map(calc => ({
      name: calc.name,
      value: calc.calculate(),
      description: calc.description,
      category: calc.category,
    }));
    setResults(calculatedResults);
  }, [inputs]);

  const handleInputChange = (key: keyof typeof inputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const categories = Array.from(new Set(results.map(r => r.category)));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Profitability': return <DollarSign className="h-4 w-4" />;
      case 'Growth': return <TrendingUp className="h-4 w-4" />;
      case 'Customer Metrics': return <BarChart3 className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Calculator className="h-8 w-8 mr-3" />
          Business Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate key business metrics and KPIs using your data. Adjust inputs to see real-time calculations.
        </p>
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
      {categories.map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getCategoryIcon(category)}
              <span className="ml-2">{category}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results
                .filter(result => result.category === category)
                .map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card">
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
      ))}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Financial Health</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Gross Profit: ${(inputs.revenue - inputs.costs).toLocaleString()}</li>
                <li>• Current Ratio: {(inputs.currentAssets / inputs.currentLiabilities).toFixed(2)}</li>
                <li>• Working Capital: ${(inputs.currentAssets - inputs.currentLiabilities).toLocaleString()}</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Growth Potential</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Sales Growth: {inputs.salesGrowth}%</li>
                <li>• LTV/CAC Ratio: {(inputs.customerLifetimeValue / inputs.customerAcquisitionCost).toFixed(1)}</li>
                <li>• Customer Retention: {(100 - inputs.churnRate).toFixed(1)}%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
