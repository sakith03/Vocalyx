import React, { useEffect, useState } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface SalesData {
  date: string;
  amount: number;
  cumulative: number;
}

interface GoalAchievementChartProps {
  goalId: number;
  targetRevenue: number;
  startDate: string;
  endDate: string;
}

const GoalAchievementChart: React.FC<GoalAchievementChartProps> = ({
  goalId,
  targetRevenue,
  startDate,
  endDate
}) => {
  const { token } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/goal-sales/goal/${goalId}/sales`);
        const sales = response.data;
        
        // Process sales data to create cumulative progress
        const processedData = sales.map((sale: any, index: number) => ({
          date: sale.closedDate,
          amount: parseFloat(sale.saleAmount) || 0,
          cumulative: sales.slice(0, index + 1).reduce((sum: number, s: any) => sum + (parseFloat(s.saleAmount) || 0), 0)
        }));
        
        setSalesData(processedData);
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        // Generate mock data for demonstration
        setSalesData(generateMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [goalId, token]);

  const generateMockData = (): SalesData[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const data: SalesData[] = [];
    
    let cumulative = 0;
    for (let i = 0; i <= Math.min(daysDiff, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      // Generate random sales amount (mock data)
      const amount = Math.random() * (targetRevenue / daysDiff) * 0.1;
      cumulative += amount;
      
      data.push({
        date: date.toISOString().split('T')[0],
        amount,
        cumulative: Math.min(cumulative, targetRevenue)
      });
    }
    
    return data;
  };

  const generatePredictedData = (): SalesData[] => {
    if (salesData.length === 0) return [];
    
    const lastData = salesData[salesData.length - 1];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (remainingDays <= 0) return [];
    
    // Advanced prediction analysis
    const analysis = analyzeSalesPatterns(salesData);
    const predictedData: SalesData[] = [];
    const dailyTarget = (targetRevenue - lastData.cumulative) / remainingDays;
    
    for (let i = 1; i <= Math.min(remainingDays, 14); i++) { // Show up to 14 days of predictions
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Advanced prediction calculation
      const dayOfWeek = date.getDay();
      const dayOfWeekMultiplier = analysis.dayOfWeekAvg[dayOfWeek] ? 
        analysis.dayOfWeekAvg[dayOfWeek] / analysis.avgDailySales : 1;
      
      let predictedAmount = analysis.avgDailySales * dayOfWeekMultiplier;
      
      // Apply trend (but limit its impact to prevent extreme values)
      const trendImpact = Math.max(-0.5, Math.min(0.5, analysis.trend * 0.1));
      predictedAmount += trendImpact * predictedAmount;
      
      // Apply momentum (but prevent it from going below 0.5 or above 2.0)
      const momentumFactor = Math.max(0.5, Math.min(2.0, analysis.momentum));
      predictedAmount *= momentumFactor;
      
      // Apply urgency factor (gradual increase as deadline approaches)
      const urgencyFactor = 1 + (1 - (remainingDays - i) / remainingDays) * 0.2;
      predictedAmount *= urgencyFactor;
      
      // Add controlled variance (reduce randomness for more stable predictions)
      const variance = 0.9 + Math.random() * 0.2; // 90% to 110% instead of 70% to 130%
      predictedAmount *= variance;
      
      // Ensure we don't exceed remaining target
      const remainingTarget = targetRevenue - lastData.cumulative;
      predictedAmount = Math.min(predictedAmount, remainingTarget * 0.3);
      
      const predictedCumulative = lastData.cumulative + predictedAmount;
      
      predictedData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.max(0, predictedAmount),
        cumulative: Math.min(predictedCumulative, targetRevenue)
      });
    }
    
    return predictedData;
  };

  // Advanced sales pattern analysis for chart
  const analyzeSalesPatterns = (data: SalesData[]) => {
    if (data.length === 0) return { avgDailySales: 0, trend: 0, momentum: 1, dayOfWeekAvg: {}, consistency: 0 };
    
    const totalSales = data.reduce((sum, d) => sum + d.amount, 0);
    const avgDailySales = totalSales / data.length;
    
    // Calculate trend
    let trend = 0;
    if (data.length > 1) {
      const n = data.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = data.reduce((sum, d, index) => sum + d.amount * index, 0);
      const sumXY = data.reduce((sum, d, index) => sum + d.amount * index, 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
      
      trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    // Calculate momentum
    const midPoint = Math.floor(data.length / 2);
    const earlySales = data.slice(0, midPoint).reduce((sum, d) => sum + d.amount, 0);
    const recentSales = data.slice(midPoint).reduce((sum, d) => sum + d.amount, 0);
    const momentum = midPoint > 0 ? (recentSales / midPoint) / (earlySales / midPoint) : 1;
    
    // Calculate consistency (coefficient of variation)
    const variance = data.reduce((sum, d) => sum + Math.pow(d.amount - avgDailySales, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const consistency = avgDailySales > 0 ? stdDev / avgDailySales : 0;
    
    // Calculate day-of-week patterns
    const dayOfWeekSales: { [key: number]: number[] } = {};
    data.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay();
      if (!dayOfWeekSales[dayOfWeek]) dayOfWeekSales[dayOfWeek] = [];
      dayOfWeekSales[dayOfWeek].push(d.amount);
    });
    
    const dayOfWeekAvg: { [key: number]: number } = {};
    Object.keys(dayOfWeekSales).forEach(day => {
      const dayNum = parseInt(day);
      const daySales = dayOfWeekSales[dayNum];
      dayOfWeekAvg[dayNum] = daySales.reduce((sum, val) => sum + val, 0) / daySales.length;
    });
    
    return {
      avgDailySales,
      trend,
      momentum,
      dayOfWeekAvg,
      consistency
    };
  };

  const predictedData = generatePredictedData();
  const allData = [...salesData, ...predictedData];
  
  const maxValue = Math.max(targetRevenue || 0, ...allData.map(d => d.cumulative || 0));
  const chartHeight = 200;
  const chartWidth = 400;

  const getPointPosition = (data: SalesData, index: number) => {
    const x = allData.length > 1 ? (index / (allData.length - 1)) * chartWidth : chartWidth / 2;
    const y = maxValue > 0 ? chartHeight - ((data.cumulative || 0) / maxValue) * chartHeight : chartHeight;
    return { x, y };
  };

  const createPath = (data: SalesData[]) => {
    if (data.length === 0) return '';
    
    const points = data.map((d, index) => {
      const pos = getPointPosition(d, index);
      return `${pos.x},${pos.y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const createAreaPath = (data: SalesData[], maxValue: number) => {
    if (data.length === 0) return '';
    
    const points = data.map((d, index) => {
      const pos = getPointPosition(d, index);
      return `${pos.x},${pos.y}`;
    });
    
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const bottomY = chartHeight;
    
    return `M ${firstPoint} L ${points.join(' L ')} L ${lastPoint.split(',')[0]},${bottomY} L ${firstPoint.split(',')[0]},${bottomY} Z`;
  };

  const createConfidenceIntervalPath = (data: SalesData[], maxValue: number) => {
    if (data.length === 0) return '';
    
    const upperPoints = data.map((d, index) => {
      const pos = getPointPosition(d, index);
      const confidenceMargin = d.cumulative * 0.1; // 10% confidence margin
      const upperY = pos.y - (confidenceMargin / maxValue) * chartHeight;
      return `${pos.x},${Math.max(0, upperY)}`;
    });
    
    const lowerPoints = data.map((d, index) => {
      const pos = getPointPosition(d, index);
      const confidenceMargin = d.cumulative * 0.1; // 10% confidence margin
      const lowerY = pos.y + (confidenceMargin / maxValue) * chartHeight;
      return `${pos.x},${Math.min(chartHeight, lowerY)}`;
    }).reverse();
    
    const firstUpper = upperPoints[0];
    const lastUpper = upperPoints[upperPoints.length - 1];
    const firstLower = lowerPoints[0];
    
    return `M ${firstUpper} L ${upperPoints.join(' L ')} L ${lastUpper} L ${lowerPoints.join(' L ')} L ${firstLower} Z`;
  };

  const createTrendLine = (data: SalesData[], maxValue: number) => {
    if (data.length < 2) return '';
    
    // Simple linear regression
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, d) => sum + d.cumulative, 0);
    const sumXY = data.reduce((sum, d, index) => sum + d.cumulative * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const startX = 0;
    const endX = chartWidth;
    const startY = chartHeight - ((slope * 0 + intercept) / maxValue) * chartHeight;
    const endY = chartHeight - ((slope * (n - 1) + intercept) / maxValue) * chartHeight;
    
    return `M ${startX},${Math.max(0, Math.min(chartHeight, startY))} L ${endX},${Math.max(0, Math.min(chartHeight, endY))}`;
  };

  const historicalPath = createPath(salesData);
  const predictedPath = predictedData.length > 0 ? createPath([salesData[salesData.length - 1], ...predictedData]) : '';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Goal Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Goal Achievement Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative">
            <svg width="100%" height={chartHeight + 60} viewBox={`0 0 ${chartWidth + 60} ${chartHeight + 60}`}>
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
                {/* Gradient for confidence interval */}
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                </linearGradient>
                {/* Gradient for historical data */}
                <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Y-axis labels with more precision */}
              <text x="5" y="15" fontSize="11" fill="#6b7280" fontWeight="500">
                ${!isNaN(maxValue) && maxValue > 0 ? (maxValue / 1000).toFixed(0) + 'k' : '0k'}
              </text>
              <text x="5" y={chartHeight / 2 + 15} fontSize="11" fill="#6b7280" fontWeight="500">
                ${!isNaN(maxValue) && maxValue > 0 ? (maxValue / 2000).toFixed(0) + 'k' : '0k'}
              </text>
              <text x="5" y={chartHeight + 15} fontSize="11" fill="#6b7280" fontWeight="500">$0</text>
              
              {/* X-axis labels (dates) */}
              {allData.length > 0 && (
                <>
                  <text x="20" y={chartHeight + 35} fontSize="10" fill="#6b7280" textAnchor="start">
                    {new Date(salesData[0]?.date || startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                  <text x={chartWidth + 20} y={chartHeight + 35} fontSize="10" fill="#6b7280" textAnchor="end">
                    {new Date(allData[allData.length - 1]?.date || endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </>
              )}
              
              {/* Target line with enhanced styling */}
              {maxValue > 0 && (
                <>
                  <line
                    x1="20"
                    y1={chartHeight - ((targetRevenue || 0) / maxValue) * chartHeight + 20}
                    x2={chartWidth + 20}
                    y2={chartHeight - ((targetRevenue || 0) / maxValue) * chartHeight + 20}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                  <text
                    x={chartWidth + 25}
                    y={chartHeight - ((targetRevenue || 0) / maxValue) * chartHeight + 12}
                    fontSize="11"
                    fill="#ef4444"
                    fontWeight="600"
                  >
                    Target: ${(targetRevenue || 0).toLocaleString()}
                  </text>
                </>
              )}
              
              {/* Confidence interval for predictions */}
              {predictedData.length > 0 && maxValue > 0 && (
                <path
                  d={createConfidenceIntervalPath(predictedData, maxValue)}
                  fill="url(#confidenceGradient)"
                  transform="translate(20, 20)"
                />
              )}
              
              {/* Historical data area */}
              {historicalPath && (
                <path
                  d={createAreaPath(salesData, maxValue)}
                  fill="url(#historicalGradient)"
                  transform="translate(20, 20)"
                />
              )}
              
              {/* Historical data line */}
              {historicalPath && (
                <path
                  d={historicalPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(20, 20)"
                />
              )}
              
              {/* Predicted data line */}
              {predictedPath && (
                <path
                  d={predictedPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="8,4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(20, 20)"
                />
              )}
              
              {/* Data points with enhanced styling */}
              {allData.map((data, index) => {
                const pos = getPointPosition(data, index);
                const isHistorical = index < salesData.length;
                const isToday = index === salesData.length - 1;
                
                return (
                  <g key={index}>
                    {/* Glow effect for today's point */}
                    {isToday && (
                      <circle
                        cx={pos.x + 20}
                        cy={pos.y + 20}
                        r="8"
                        fill={isHistorical ? "#3b82f6" : "#10b981"}
                        opacity="0.3"
                      />
                    )}
                    {/* Main data point */}
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y + 20}
                      r={isToday ? "6" : "4"}
                      fill={isHistorical ? "#3b82f6" : "#10b981"}
                      stroke="white"
                      strokeWidth={isToday ? "3" : "2"}
                    />
                    {/* Inner dot for today */}
                    {isToday && (
                      <circle
                        cx={pos.x + 20}
                        cy={pos.y + 20}
                        r="2"
                        fill="white"
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Trend line for historical data */}
              {salesData.length > 2 && (
                <path
                  d={createTrendLine(salesData, maxValue)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="2,4"
                  opacity="0.6"
                  transform="translate(20, 20)"
                />
              )}
            </svg>
            
            {/* Enhanced Legend */}
            <div className="flex items-center justify-center space-x-8 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-muted-foreground">Historical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-green-500 border-dashed border-t-2 rounded"></div>
                <span className="text-sm font-medium text-muted-foreground">Predicted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-red-500 border-dashed border-t-2 rounded"></div>
                <span className="text-sm font-medium text-muted-foreground">Target</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-blue-400 border-dashed border-t-2 rounded"></div>
                <span className="text-sm font-medium text-muted-foreground">Trend</span>
              </div>
            </div>
          </div>
          
          {/* Advanced Progress Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${salesData.length > 0 && !isNaN(salesData[salesData.length - 1].cumulative) ? 
                  salesData[salesData.length - 1].cumulative.toLocaleString() : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Current Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {salesData.length > 0 && !isNaN(salesData[salesData.length - 1].cumulative) && targetRevenue > 0 ? 
                  `${Math.round((salesData[salesData.length - 1].cumulative / targetRevenue) * 100)}%` : 
                  '0%'
                }
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {predictedData.length > 0 ? 
                  `${Math.round(predictedData.reduce((sum, p) => sum + (p.amount || 0), 0) / predictedData.length).toLocaleString()}` : 
                  '0'
                }
              </div>
              <div className="text-sm text-muted-foreground">Avg Daily Predicted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {salesData.length > 0 ? 
                  `${Math.round(salesData.reduce((sum, d) => sum + (d.amount || 0), 0) / salesData.length).toLocaleString()}` : 
                  '0'
                }
              </div>
              <div className="text-sm text-muted-foreground">Avg Daily Historical</div>
            </div>
          </div>
          
          {/* Trend Analysis */}
          {salesData.length > 1 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Momentum: </span>
                  <span className={`font-medium ${
                    analyzeSalesPatterns(salesData).momentum > 1 ? 'text-green-600' : 
                    analyzeSalesPatterns(salesData).momentum < 1 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {analyzeSalesPatterns(salesData).momentum > 1 ? '↗️ Improving' : 
                     analyzeSalesPatterns(salesData).momentum < 1 ? '↘️ Declining' : '→ Stable'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trend: </span>
                  <span className={`font-medium ${
                    analyzeSalesPatterns(salesData).trend > 0 ? 'text-green-600' : 
                    analyzeSalesPatterns(salesData).trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {analyzeSalesPatterns(salesData).trend > 0 ? '📈 Positive' : 
                     analyzeSalesPatterns(salesData).trend < 0 ? '📉 Negative' : '➡️ Flat'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Consistency: </span>
                  <span className={`font-medium ${
                    analyzeSalesPatterns(salesData).consistency < 0.3 ? 'text-green-600' : 
                    analyzeSalesPatterns(salesData).consistency < 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {analyzeSalesPatterns(salesData).consistency < 0.3 ? '🎯 Very Consistent' : 
                     analyzeSalesPatterns(salesData).consistency < 0.6 ? '⚠️ Moderate' : '📊 Variable'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalAchievementChart;
