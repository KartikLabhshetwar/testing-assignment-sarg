import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CalculatorInputSchema = z.object({
  revenue: z.number().min(0),
  costs: z.number().min(0),
  units: z.number().min(0),
  price: z.number().min(0),
  inventory: z.number().min(0),
  employees: z.number().min(0),
  workingDays: z.number().min(0).max(365),
  assets: z.number().min(0),
  liabilities: z.number().min(0),
  currentAssets: z.number().min(0),
  currentLiabilities: z.number().min(0),
  salesGrowth: z.number().min(0),
  marketShare: z.number().min(0).max(100),
  conversionRate: z.number().min(0),
  customerAcquisitionCost: z.number().min(0),
  customerLifetimeValue: z.number().min(0),
  churnRate: z.number().min(0).max(100),
  averageOrderValue: z.number().min(0),
  inventoryTurnover: z.number().min(0),
  daysInPeriod: z.number().min(0),
  grossMargin: z.number().min(0).max(100),
});

interface CalculationResult {
  name: string;
  value: number | string;
  description: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputs = CalculatorInputSchema.parse(body);

    // Business calculations - all done on the backend
    const calculations: CalculationResult[] = [
      // Profitability
      {
        name: 'Gross Profit',
        value: inputs.revenue - inputs.costs,
        description: 'Revenue minus direct costs',
        category: 'Profitability'
      },
      {
        name: 'Gross Profit Margin (%)',
        value: inputs.revenue > 0 ? ((inputs.revenue - inputs.costs) / inputs.revenue * 100).toFixed(2) + '%' : '0.00%',
        description: 'Gross profit as percentage of revenue',
        category: 'Profitability'
      },
      {
        name: 'Contribution Margin (%)',
        value: inputs.grossMargin + '%',
        description: 'Percentage of revenue available to cover fixed costs',
        category: 'Profitability'
      },

      // Unit Economics
      {
        name: 'Revenue per Unit',
        value: inputs.units > 0 ? (inputs.revenue / inputs.units).toFixed(2) : '0.00',
        description: 'Average revenue generated per unit sold',
        category: 'Unit Economics'
      },
      {
        name: 'Cost per Unit',
        value: inputs.units > 0 ? (inputs.costs / inputs.units).toFixed(2) : '0.00',
        description: 'Average cost per unit produced/sold',
        category: 'Unit Economics'
      },
      {
        name: 'Break-even Units',
        value: inputs.units > 0 && inputs.price > (inputs.costs / inputs.units) 
          ? Math.ceil(inputs.costs / (inputs.price - (inputs.costs / inputs.units)))
          : 0,
        description: 'Units needed to break even',
        category: 'Unit Economics'
      },

      // Productivity
      {
        name: 'Revenue per Employee',
        value: inputs.employees > 0 ? (inputs.revenue / inputs.employees).toFixed(0) : '0',
        description: 'Revenue generated per employee',
        category: 'Productivity'
      },
      {
        name: 'Daily Revenue Target',
        value: inputs.workingDays > 0 ? (inputs.revenue / inputs.workingDays).toFixed(2) : '0.00',
        description: 'Daily revenue needed to meet annual target',
        category: 'Productivity'
      },

      // Financial Ratios
      {
        name: 'Return on Assets (%)',
        value: inputs.assets > 0 ? ((inputs.revenue - inputs.costs) / inputs.assets * 100).toFixed(2) + '%' : '0.00%',
        description: 'Profitability relative to total assets',
        category: 'Financial Ratios'
      },
      {
        name: 'Debt-to-Equity Ratio',
        value: (inputs.assets - inputs.liabilities) > 0 ? (inputs.liabilities / (inputs.assets - inputs.liabilities)).toFixed(2) : '0.00',
        description: 'Debt relative to equity',
        category: 'Financial Ratios'
      },

      // Liquidity
      {
        name: 'Current Ratio',
        value: inputs.currentLiabilities > 0 ? (inputs.currentAssets / inputs.currentLiabilities).toFixed(2) : '0.00',
        description: 'Ability to pay short-term obligations',
        category: 'Liquidity'
      },
      {
        name: 'Working Capital',
        value: inputs.currentAssets - inputs.currentLiabilities,
        description: 'Short-term financial health',
        category: 'Liquidity'
      },

      // Growth
      {
        name: 'Sales Growth Rate (%)',
        value: inputs.salesGrowth + '%',
        description: 'Year-over-year sales growth',
        category: 'Growth'
      },
      {
        name: 'Market Penetration (%)',
        value: inputs.marketShare + '%',
        description: 'Share of total addressable market',
        category: 'Growth'
      },

      // Customer Metrics
      {
        name: 'Customer Acquisition ROI (%)',
        value: inputs.customerAcquisitionCost > 0 
          ? (((inputs.customerLifetimeValue - inputs.customerAcquisitionCost) / inputs.customerAcquisitionCost) * 100).toFixed(1) + '%'
          : '0.0%',
        description: 'Return on customer acquisition investment',
        category: 'Customer Metrics'
      },
      {
        name: 'LTV/CAC Ratio',
        value: inputs.customerAcquisitionCost > 0 ? (inputs.customerLifetimeValue / inputs.customerAcquisitionCost).toFixed(1) : '0.0',
        description: 'Customer lifetime value to acquisition cost ratio',
        category: 'Customer Metrics'
      },
      {
        name: 'Monthly Churn Rate (%)',
        value: (inputs.churnRate / 12).toFixed(2) + '%',
        description: 'Monthly customer churn rate',
        category: 'Customer Metrics'
      },
      {
        name: 'Customer Retention Rate (%)',
        value: (100 - inputs.churnRate).toFixed(1) + '%',
        description: 'Percentage of customers retained annually',
        category: 'Customer Metrics'
      },

      // Sales Metrics
      {
        name: 'Average Order Value',
        value: '$' + inputs.averageOrderValue.toFixed(2),
        description: 'Average value per order',
        category: 'Sales Metrics'
      },
      {
        name: 'Conversion Rate (%)',
        value: inputs.conversionRate + '%',
        description: 'Percentage of visitors who convert to customers',
        category: 'Sales Metrics'
      },

      // Inventory
      {
        name: 'Inventory Turnover Ratio',
        value: inputs.inventoryTurnover.toFixed(1),
        description: 'How many times inventory is sold per period',
        category: 'Inventory'
      },
      {
        name: 'Days Sales Outstanding',
        value: inputs.inventoryTurnover > 0 ? Math.round(inputs.daysInPeriod / inputs.inventoryTurnover) : 0,
        description: 'Average days to sell inventory',
        category: 'Inventory'
      },
      {
        name: 'Inventory Value per Unit',
        value: inputs.units > 0 ? (inputs.inventory / inputs.units).toFixed(2) : '0.00',
        description: 'Average inventory value per unit',
        category: 'Inventory'
      },

      // Pricing Strategy
      {
        name: 'Price Elasticity Impact',
        value: (() => {
          const priceIncrease = 0.1; // 10% increase
          const demandDecrease = 0.05; // 5% decrease (assumed)
          return ((priceIncrease - demandDecrease) * inputs.revenue).toFixed(0);
        })(),
        description: 'Revenue impact of 10% price increase (assuming 5% demand drop)',
        category: 'Pricing Strategy'
      },
      {
        name: 'Optimal Price Point',
        value: inputs.units > 0 ? (inputs.costs / inputs.units * 1.5).toFixed(2) : '0.00',
        description: 'Suggested price based on 50% markup',
        category: 'Pricing Strategy'
      },

      // Efficiency Metrics
      {
        name: 'Asset Turnover',
        value: inputs.assets > 0 ? (inputs.revenue / inputs.assets).toFixed(2) : '0.00',
        description: 'Revenue generated per dollar of assets',
        category: 'Efficiency'
      },
      {
        name: 'Inventory Days',
        value: inputs.inventoryTurnover > 0 ? (inputs.daysInPeriod / inputs.inventoryTurnover).toFixed(0) : '0',
        description: 'Days of inventory on hand',
        category: 'Efficiency'
      },
    ];

    // Group results by category
    const resultsByCategory = calculations.reduce((acc, calc) => {
      if (!acc[calc.category]) {
        acc[calc.category] = [];
      }
      acc[calc.category].push(calc);
      return acc;
    }, {} as Record<string, CalculationResult[]>);

    // Calculate summary insights
    const insights = {
      financialHealth: {
        grossProfit: inputs.revenue - inputs.costs,
        currentRatio: inputs.currentLiabilities > 0 ? inputs.currentAssets / inputs.currentLiabilities : 0,
        workingCapital: inputs.currentAssets - inputs.currentLiabilities,
        roa: inputs.assets > 0 ? (inputs.revenue - inputs.costs) / inputs.assets * 100 : 0,
      },
      growthPotential: {
        salesGrowth: inputs.salesGrowth,
        ltvCacRatio: inputs.customerAcquisitionCost > 0 ? inputs.customerLifetimeValue / inputs.customerAcquisitionCost : 0,
        customerRetention: 100 - inputs.churnRate,
        marketPenetration: inputs.marketShare,
      },
      operationalEfficiency: {
        revenuePerEmployee: inputs.employees > 0 ? inputs.revenue / inputs.employees : 0,
        inventoryTurnover: inputs.inventoryTurnover,
        assetTurnover: inputs.assets > 0 ? inputs.revenue / inputs.assets : 0,
        dailyRevenueTarget: inputs.workingDays > 0 ? inputs.revenue / inputs.workingDays : 0,
      }
    };

    return NextResponse.json({
      calculations,
      resultsByCategory,
      insights,
      summary: {
        totalCalculations: calculations.length,
        categories: Object.keys(resultsByCategory),
        lastCalculated: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Calculator API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    );
  }
}
