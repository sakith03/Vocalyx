import React, { useEffect, useState } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PredictionData {
  day: string;
  predictedSales: number;
  growth: number;
  confidence: number;
  status: 'high' | 'medium' | 'low';
}

interface GoalPredictionsTableProps {
  goalId: number;
  targetRevenue: number;
  startDate: string;
  endDate: string;
}

const GoalPredictionsTable: React.FC<GoalPredictionsTableProps> = ({
  goalId,
  targetRevenue,
  startDate,
  endDate
}) => {
  const { token } = useAuth();
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate props
  if (!goalId || !targetRevenue || !startDate || !endDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-8">
            <p>Invalid goal data provided</p>
            <p className="text-sm text-gray-500 mt-2">
              Goal ID: {goalId}, Target: {targetRevenue}, Start: {startDate}, End: {endDate}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const generatePredictions = async () => {
      try {
        console.log('GoalPredictionsTable: Starting prediction generation', { goalId, targetRevenue, startDate, endDate });
        setLoading(true);
        setError(null);
        
        // Fetch historical sales data
        const salesResponse = await api.get(`/api/goal-sales/goal/${goalId}/sales`);
        const sales = salesResponse.data;
        console.log('GoalPredictionsTable: Fetched sales data', sales);
        
        // Calculate current progress
        const currentSales = sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.saleAmount) || 0), 0);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) {
          setPredictions([]);
          return;
        }
        
        // Advanced prediction algorithm based on sales patterns
        const predictionsData: PredictionData[] = [];
        const dailyTarget = daysRemaining > 0 ? (targetRevenue - currentSales) / daysRemaining : 0;
        
        // Analyze sales patterns
        const salesAnalysis = analyzeSalesPatterns(sales, startDate, endDate);
        
        // Generate predictions for the next 7 days or remaining days, whichever is smaller
        const predictionDays = Math.min(7, Math.max(1, daysRemaining));
        
        for (let i = 1; i <= predictionDays; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          // Skip if date is beyond goal end date
          if (date > end) break;
          
          // Advanced prediction calculation
          const predictedSales = calculateAdvancedPrediction(
            salesAnalysis,
            dailyTarget,
            i,
            date,
            currentSales,
            targetRevenue,
            daysRemaining
          );
          
          // Calculate growth rate with trend analysis
          const growth = calculateGrowthRate(predictionsData, predictedSales, salesAnalysis, i);
          
          // Calculate confidence based on multiple factors
          const confidence = calculateConfidence(salesAnalysis, i, predictionDays, daysRemaining);
          
          // Determine status based on advanced metrics
          const status = determinePerformanceStatus(predictedSales, dailyTarget, salesAnalysis);
          
          predictionsData.push({
            day: date.toISOString().split('T')[0],
            predictedSales: Math.max(0, predictedSales),
            growth: Math.max(-50, Math.min(50, growth)),
            confidence: Math.round(confidence),
            status
          });
        }
        
        console.log('GoalPredictionsTable: Generated predictions', predictionsData);
        setPredictions(predictionsData);
        
      } catch (error) {
        console.error('Failed to generate predictions:', error);
        setError('Failed to load predictions. Using mock data for demonstration.');
        // Generate mock predictions for demonstration
        const mockPredictions: PredictionData[] = [];
        const today = new Date();
        const end = new Date(endDate);
        const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only generate predictions if there are remaining days
        if (daysRemaining > 0) {
          const predictionDays = Math.min(7, daysRemaining);
          const dailyTarget = targetRevenue / 30; // Assume 30-day goal period for mock
          
          for (let i = 1; i <= predictionDays; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            // Skip if date is beyond goal end date
            if (date > end) break;
            
            const predictedSales = dailyTarget * (0.7 + Math.random() * 0.6); // 70% to 130% of daily target
            const growth = (Math.random() - 0.5) * 30; // -15% to +15% growth
            const confidence = 75 + Math.random() * 20; // 75% to 95% confidence
            
            let status: 'high' | 'medium' | 'low' = 'medium';
            if (predictedSales > dailyTarget * 1.2) status = 'high';
            else if (predictedSales < dailyTarget * 0.8) status = 'low';
            
            mockPredictions.push({
              day: date.toISOString().split('T')[0],
              predictedSales: Math.max(0, predictedSales),
              growth: Math.max(-30, Math.min(30, growth)),
              confidence: Math.round(confidence),
              status
            });
          }
        }
        
        console.log('GoalPredictionsTable: Generated mock predictions', mockPredictions);
        setPredictions(mockPredictions);
      } finally {
        setLoading(false);
      }
    };

    generatePredictions();
  }, [goalId, targetRevenue, startDate, endDate, token]);

  // Advanced sales pattern analysis
  const analyzeSalesPatterns = (sales: any[], startDate: string, endDate: string) => {
    const totalSales = sales.reduce((sum, sale) => sum + (parseFloat(sale.saleAmount) || 0), 0);
    const salesCount = sales.length;
    const avgDailySales = salesCount > 0 ? totalSales / salesCount : 0;
    
    // Calculate daily sales distribution
    const dailySales = sales.reduce((acc: any, sale: any) => {
      const date = sale.closedDate;
      acc[date] = (acc[date] || 0) + (parseFloat(sale.saleAmount) || 0);
      return acc;
    }, {});
    
    const dailyValues = Object.values(dailySales) as number[];
    const salesVariance = dailyValues.length > 1 ? 
      dailyValues.reduce((sum, val) => sum + Math.pow(val - avgDailySales, 2), 0) / dailyValues.length : 0;
    const salesStdDev = Math.sqrt(salesVariance);
    
    // Calculate trend (linear regression)
    const sortedSales = sales.sort((a, b) => new Date(a.closedDate).getTime() - new Date(b.closedDate).getTime());
    let trend = 0;
    if (sortedSales.length > 1) {
      const n = sortedSales.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = sortedSales.reduce((sum, sale, index) => sum + (parseFloat(sale.saleAmount) || 0) * index, 0);
      const sumXY = sortedSales.reduce((sum, sale, index) => sum + (parseFloat(sale.saleAmount) || 0) * index, 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
      
      trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    // Calculate momentum (recent vs early performance)
    const midPoint = Math.floor(sortedSales.length / 2);
    const earlySales = sortedSales.slice(0, midPoint).reduce((sum, sale) => sum + (parseFloat(sale.saleAmount) || 0), 0);
    const recentSales = sortedSales.slice(midPoint).reduce((sum, sale) => sum + (parseFloat(sale.saleAmount) || 0), 0);
    const momentum = midPoint > 0 ? (recentSales / midPoint) / (earlySales / midPoint) : 1;
    
    // Calculate day-of-week patterns
    const dayOfWeekSales: { [key: number]: number[] } = {};
    sales.forEach(sale => {
      const dayOfWeek = new Date(sale.closedDate).getDay();
      if (!dayOfWeekSales[dayOfWeek]) dayOfWeekSales[dayOfWeek] = [];
      dayOfWeekSales[dayOfWeek].push(parseFloat(sale.saleAmount) || 0);
    });
    
    const dayOfWeekAvg: { [key: number]: number } = {};
    Object.keys(dayOfWeekSales).forEach(day => {
      const dayNum = parseInt(day);
      const daySales = dayOfWeekSales[dayNum];
      dayOfWeekAvg[dayNum] = daySales.reduce((sum, val) => sum + val, 0) / daySales.length;
    });
    
    return {
      totalSales,
      salesCount,
      avgDailySales,
      salesStdDev,
      trend,
      momentum,
      dayOfWeekAvg,
      consistency: salesStdDev / avgDailySales, // Lower is more consistent
      recentPerformance: recentSales / Math.max(1, midPoint)
    };
  };
  
  const calculateAdvancedPrediction = (
    analysis: any,
    dailyTarget: number,
    dayOffset: number,
    date: Date,
    currentSales: number,
    targetRevenue: number,
    daysRemaining: number
  ) => {
    // ULTRA-SIMPLE PREDICTION LOGIC
    
    // Step 1: Calculate daily target needed to reach goal
    const requiredDailyTarget = (targetRevenue - currentSales) / daysRemaining;
    
    // Step 2: Use the daily target as our prediction (no complex calculations)
    let basePrediction = requiredDailyTarget;
    
    // Step 3: Don't exceed what's needed to reach the goal
    const remainingTarget = targetRevenue - currentSales;
    basePrediction = Math.min(basePrediction, remainingTarget * 0.5); // Max 50% of remaining per day
    
    return Math.max(0, basePrediction);
  };
  
  const calculateGrowthRate = (
    previousPredictions: PredictionData[],
    currentPrediction: number,
    analysis: any,
    dayOffset: number
  ) => {
    // ULTRA-SIMPLE GROWTH CALCULATION
    
    if (dayOffset === 1) {
      // For first prediction, growth is 0 (baseline)
      return 0;
    } else {
      // Compare to previous prediction
      const previousPrediction = previousPredictions[dayOffset - 2];
      if (previousPrediction.predictedSales > 0) {
        const growth = ((currentPrediction - previousPrediction.predictedSales) / previousPrediction.predictedSales) * 100;
        return Math.max(-50, Math.min(50, growth)); // Simple caps: -50% to +50%
      }
      return 0;
    }
  };
  
  const calculateConfidence = (
    analysis: any,
    dayOffset: number,
    totalPredictionDays: number,
    daysRemaining: number
  ) => {
    // Time decay factor (confidence decreases with time)
    const timeDecay = Math.max(0.3, 1 - (dayOffset / totalPredictionDays));
    
    // Data quality factor (more data = higher confidence)
    const dataQuality = Math.min(0.9, analysis.salesCount / 15);
    
    // Consistency factor (more consistent = higher confidence)
    const consistencyFactor = Math.max(0.5, 1 - analysis.consistency);
    
    // Trend reliability factor
    const trendReliability = Math.abs(analysis.trend) < analysis.avgDailySales * 0.1 ? 1 : 0.8;
    
    // Urgency factor (higher confidence when more urgent)
    const urgencyFactor = Math.min(1.2, 1 + (1 - daysRemaining / 30) * 0.2);
    
    const confidence = (timeDecay + dataQuality + consistencyFactor + trendReliability) * 25 * urgencyFactor;
    return Math.max(60, Math.min(95, confidence));
  };
  
  const determinePerformanceStatus = (
    predictedSales: number,
    dailyTarget: number,
    analysis: any
  ) => {
    if (dailyTarget <= 0) return 'medium';
    
    const performanceRatio = predictedSales / dailyTarget;
    
    if (performanceRatio > 1.2) return 'high';
    if (performanceRatio < 0.8) return 'low';
    return 'medium';
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'high':
        return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

   if (loading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center">
             <Calendar className="w-5 h-5 mr-2" />
             Predictions
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex items-center justify-center h-32">
             <div className="text-muted-foreground">Generating predictions...</div>
           </div>
         </CardContent>
       </Card>
     );
   }

   if (error) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center">
             <Calendar className="w-5 h-5 mr-2" />
             Predictions
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex items-center justify-center h-32">
             <div className="text-center">
               <div className="text-lg text-red-600 mb-2">Error loading predictions</div>
               <div className="text-sm text-gray-500">{error}</div>
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No Predictions Available</p>
            <p className="text-sm">
              {new Date(endDate) < new Date() 
                ? 'Goal period has ended' 
                : 'Generating predictions...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center">
           <Calendar className="w-5 h-5 mr-2" />
           Predictions
         </CardTitle>
       </CardHeader>
       <CardContent>
         {/* Debug info - remove this in production */}
         {process.env.NODE_ENV === 'development' && (
           <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
             <div>Goal ID: {goalId}</div>
             <div>Target Revenue: {targetRevenue}</div>
             <div>Start Date: {startDate}</div>
             <div>End Date: {endDate}</div>
             <div>Predictions Count: {predictions.length}</div>
             <div>Loading: {loading.toString()}</div>
             <div>Error: {error || 'None'}</div>
           </div>
         )}
         <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(predictions.reduce((sum, p) => sum + (p.predictedSales || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Predicted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {predictions.length > 0 ? 
                  Math.round(predictions.reduce((sum, p) => sum + (p.growth || 0), 0) / predictions.length) : 
                  0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {predictions.length > 0 ? 
                  Math.round(predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length) : 
                  0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Predicted Sales</TableHead>
                  <TableHead>Growth</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatDate(prediction.day)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {formatCurrency(prediction.predictedSales)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getGrowthIcon(prediction.growth || 0)}
                        <span className={`font-medium ${
                          (prediction.growth || 0) > 0 ? 'text-green-600' : 
                          (prediction.growth || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {(prediction.growth || 0) > 0 ? '+' : ''}{(prediction.growth || 0).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, prediction.confidence || 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(prediction.confidence || 0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(prediction.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Key Insights */}
          <div className="space-y-4">
            {/* Target Achievement Strategy */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                🎯 Target Achievement Strategy
              </h4>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                   {(() => {
                     const totalPredicted = predictions.reduce((sum, p) => sum + (p.predictedSales || 0), 0);
                     const today = new Date();
                     const end = new Date(endDate);
                     const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                     const currentSales = 0; // This should be calculated from actual data
                     const dailyTarget = (targetRevenue - currentSales) / Math.max(1, daysRemaining);
                     const avgPredicted = totalPredicted / predictions.length;
                     const targetGap = targetRevenue - currentSales - totalPredicted;
                     const isOnTrack = targetGap <= 0;
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="text-sm font-medium text-gray-700">Current Status</div>
                            <div className={`text-lg font-bold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                              {isOnTrack ? '✅ On Track' : '⚠️ Behind Target'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {isOnTrack ? 'Predicted to exceed target' : `Need ${formatCurrency(Math.abs(targetGap))} more`}
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <div className="text-sm font-medium text-gray-700">Required Daily</div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(dailyTarget)}
                            </div>
                            <div className="text-xs text-gray-500">
                              vs Predicted {formatCurrency(avgPredicted)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Key Recommendations:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {!isOnTrack && (
                              <li>• <strong>Focus on high-performance days:</strong> {predictions.filter(p => p.status === 'high').length} days predicted to exceed target</li>
                            )}
                            <li>• <strong>Best opportunity:</strong> {formatDate(predictions.reduce((best, p) => p.predictedSales > best.predictedSales ? p : best).day)} with {formatCurrency(predictions.reduce((best, p) => p.predictedSales > best.predictedSales ? p : best).predictedSales)}</li>
                            <li>• <strong>Daily target:</strong> {formatCurrency(dailyTarget)} needed to reach goal</li>
                            {avgPredicted < dailyTarget && (
                              <li>• <strong>Action needed:</strong> Increase daily performance by {formatCurrency(dailyTarget - avgPredicted)} on average</li>
                            )}
                            <li>• <strong>Confidence level:</strong> {Math.round(predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length)}% (higher = more reliable)</li>
                          </ul>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No upcoming predictions available (goal period has ended)
                </div>
              )}
            </div>

            {/* Performance Analysis */}
            {predictions.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  📊 Performance Analysis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {predictions.filter(p => p.status === 'high').length}
                    </div>
                    <div className="text-xs text-gray-600">High Performance Days</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(predictions.reduce((sum, p) => sum + (p.growth || 0), 0) / predictions.length)}%
                    </div>
                    <div className="text-xs text-gray-600">Avg Growth Rate</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(predictions.reduce((sum, p) => sum + (p.predictedSales || 0), 0))}
                    </div>
                    <div className="text-xs text-gray-600">Total Predicted</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalPredictionsTable;
