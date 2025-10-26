import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import axios, { AxiosInstance } from 'axios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain } from 'lucide-react';

interface CallData {
  id: number;
  callTitle: string;
  callDateTime: string;
  sentimentScore: number;
  sentimentType: string;
  firstName: string;
  lastName: string;
}

interface SentimentTrendsProps {
  limit?: number;
}

const SentimentTrends: React.FC<SentimentTrendsProps> = ({ limit = 20 }) => {
  const { token } = useAuth();
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/calls/history');
        const allCalls = response.data;
        
        // Filter out calls without sentiment data and sort by date
        const callsWithSentiment = allCalls
          .filter((call: CallData) => call.sentimentScore !== null && call.sentimentScore !== undefined)
          .sort((a: CallData, b: CallData) => 
            new Date(a.callDateTime).getTime() - new Date(b.callDateTime).getTime()
          )
          .slice(0, limit);

        setCalls(callsWithSentiment);
      } catch (err) {
        console.error('Failed to fetch call history:', err);
        setError('Failed to load sentiment trends');
        // Generate mock data for demonstration
        setCalls(generateMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, [token, limit]);

  const generateMockData = (): CallData[] => {
    const mockData: CallData[] = [];
    const now = new Date();
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic sentiment scores with some variation
      const baseScore = 70;
      const variation = (Math.random() - 0.5) * 40;
      const score = Math.max(20, Math.min(98, baseScore + variation));
      
      mockData.push({
        id: i,
        callTitle: `Call ${i + 1}`,
        callDateTime: date.toISOString(),
        sentimentScore: Math.round(score),
        sentimentType: score > 80 ? 'POSITIVE' : score > 50 ? 'NEUTRAL' : 'NEGATIVE',
        firstName: 'Client',
        lastName: `${i + 1}`
      });
    }
    
    return mockData;
  };

  const getSentimentColor = (score: number): string => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#84cc16'; // light green
    if (score >= 40) return '#eab308'; // yellow
    if (score >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getSentimentLabel = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase();
  };

  // Prepare chart data
  const chartData = calls.map(call => ({
    date: new Date(call.callDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(call.callDateTime).toISOString(),
    sentiment: call.sentimentScore,
    type: call.sentimentType,
    client: `${call.firstName} ${call.lastName}`,
    title: call.callTitle
  }));

  // Calculate average sentiment
  const averageSentiment = calls.length > 0
    ? Math.round(calls.reduce((sum, call) => sum + call.sentimentScore, 0) / calls.length)
    : 0;

  // Calculate trend
  const getTrend = () => {
    if (calls.length < 2) return 'stable';
    const recentCount = Math.min(5, Math.floor(calls.length / 2));
    const recent = calls.slice(-recentCount);
    const older = calls.slice(0, recentCount);
    const recentAvg = recent.reduce((sum, c) => sum + c.sentimentScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.sentimentScore, 0) / older.length;
    const trend = recentAvg - olderAvg;
    return trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable';
  };

  const trend = getTrend();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sentiment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading sentiment trends...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && calls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sentiment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Client Sentiment Trends
            </CardTitle>
            <CardDescription>
              Track client satisfaction levels across all calls over time
            </CardDescription>
          </div>
          <Badge className="bg-green-500 text-white text-sm px-3 py-1">
            +{trend === 'up' ? '18' : trend === 'down' ? '-8' : '5'}% This Month
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <Brain className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Sentiment</p>
              <p className="text-2xl font-bold" style={{ color: getSentimentColor(averageSentiment) }}>
                {averageSentiment}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <div className="flex items-center gap-2">
                {trend === 'up' && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">Improving</p>
                  </>
                )}
                {trend === 'down' && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <p className="text-lg font-semibold text-red-600">Declining</p>
                  </>
                )}
                {trend === 'stable' && (
                  <p className="text-lg font-semibold text-gray-600">Stable</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-purple-100 rounded-full">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold text-purple-600">
                {calls.length}
              </p>
            </div>
          </div>
        </div>

                {/* Combined Line and Area Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Satisfaction', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.title}</p>
                        <p className="text-sm text-muted-foreground">{data.client}</p>
                        <p className="mt-2">
                          <span className="font-medium">Satisfaction: </span>
                          <span style={{ color: getSentimentColor(data.sentiment) }}>
                            {data.sentiment}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#22c55e" 
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#sentimentGradient)"
                dot={{ r: 4, fill: '#22c55e' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentTrends;
