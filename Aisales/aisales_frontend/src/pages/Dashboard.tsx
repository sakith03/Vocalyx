import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import NavigationBar from '@/components/NavigationBar';
import SentimentTrends from '@/components/SentimentTrends';
import axios, { AxiosInstance } from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  AlertCircle,
  UserCheck,
  TrendingUp,
  Clock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Sparkles,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface Call {
  id: number;
  callTitle: string;
  callDateTime: string;
  sentimentScore: number;
  sentimentType: string;
  firstName: string;
  lastName: string;
}

interface Goal {
  id: number;
  name: string;
  targetRevenue: number;
  currentProgress: number;
  endDate: string;
  status: string;
  progressPercentage: number;
}

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const fetchRecentCalls = async () => {
      try {
        const response = await api.get('/api/calls/history');
        const calls = response.data
          .filter((call: Call) => call.sentimentScore !== null && call.sentimentScore !== undefined)
          .sort((a: Call, b: Call) => 
            new Date(b.callDateTime).getTime() - new Date(a.callDateTime).getTime()
          )
          .slice(0, 4);
        setRecentCalls(calls);
      } catch (error) {
        console.error('Failed to fetch recent calls:', error);
      } finally {
        setLoadingCalls(false);
      }
    };

    const fetchActiveGoals = async () => {
      try {
        const response = await api.get('/api/goals');
        const allGoals = response.data;
        const active = allGoals
          .filter((goal: Goal) => {
            const today = new Date();
            const endDate = new Date(goal.endDate);
            return endDate >= today && goal.status !== 'Completed';
          })
          .sort((a: Goal, b: Goal) => a.endDate.localeCompare(b.endDate))
          .slice(0, 2);
        setActiveGoals(active);
      } catch (error) {
        console.error('Failed to fetch active goals:', error);
      } finally {
        setLoadingGoals(false);
      }
    };

    if (token) {
      fetchRecentCalls();
      fetchActiveGoals();
    }
  }, [token]);



  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const getSentimentType = (score: number): 'positive' | 'neutral' | 'negative' => {
    if (score >= 80) return 'positive';
    if (score >= 50) return 'neutral';
    return 'negative';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };



  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Hook Section */}
          <div className="bg-background rounded-2xl p-8 md:p-12 shadow-xl overflow-hidden relative border border-border">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
              }}></div>
            </div>
            
            {/* Content */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Side - Description */}
              <div className="space-y-4 text-foreground">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-1.5 mb-4">
                  <Sparkles className="h-3 w-3 mr-1.5 inline text-blue-600" />
                  AI-Powered Sales Intelligence
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                  Transform Every Call Into
                  <br />
                  <span className="text-blue-600">A Winning Opportunity</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  Harness the power of AI sentiment analysis to understand your clients better. Track goals with precision, analyze call patterns, and let Orbi AI help you create winning follow-up strategies that close more deals.
                </p>
                <div className="flex items-center space-x-4 pt-2">
                  <Badge className="bg-green-500 text-white px-3 py-1 animate-pulse">
                    <div className="h-2 w-2 bg-white rounded-full mr-2 inline-block"></div>
                    Live Analytics
                  </Badge>
                </div>
              </div>
              
              {/* Right Side - Enlarged Logo */}
              <div className="flex items-center justify-center lg:justify-end">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-12 md:p-16 rounded-3xl border-2 border-blue-200 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
                    <Target className="h-32 w-32 md:h-40 md:w-40 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your sales today
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Sentiment Trends */}
              <SentimentTrends limit={20} />

              {/* Recent Call History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Call History</CardTitle>
                    <CardDescription>Latest client interactions with sentiment analysis</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/call-history')}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingCalls ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentCalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent calls found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentCalls.map((call) => {
                        const type = getSentimentType(call.sentimentScore);
                        return (
                          <div key={call.id} className="flex items-center space-x-4 pb-4 border-b last:border-b-0 last:pb-0">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {call.firstName} {call.lastName}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(call.callDateTime)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={type === 'positive' ? 'default' : type === 'neutral' ? 'secondary' : 'destructive'} 
                                className="px-2 py-0.5"
                              >
                                {call.sentimentScore}% Satisfaction
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {call.sentimentType.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* AI Insights Widget */}
              <Card className="bg-white shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Orbi AI Assistant</CardTitle>
                        <CardDescription className="text-sm">
                          Your intelligent sales companion.
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">Online</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  
                  {/* AI Message Bubble */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-sm text-foreground">
                        Hi {user?.firstName}! I've analyzed your recent calls. Would you like me to create follow-up plans for your top 3 clients with the highest satisfaction scores?
                      </p>
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start bg-white" 
                      onClick={() => {}}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analyze today's call patterns
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start bg-white" 
                      onClick={() => {}}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Create follow-up emails
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start bg-white" 
                      onClick={() => {}}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get deal closing insights
                    </Button>
                  </div>

                  {/* Primary CTA */}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={() => navigate('/call-history')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Conversation
                  </Button>
                </CardContent>
              </Card>

              {/* Active Goals */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Goals ({activeGoals.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingGoals ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeGoals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No active goals at the moment
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeGoals.map((goal) => {
                        const progress = goal.progressPercentage || 0;
                        const isOnTrack = goal.status === 'In Progress' || goal.status === 'Completed';
                        const trend = progress > 0 ? '+12%' : '0%';
                        
                        return (
                          <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Target className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{goal.name}</p>
                                  <Badge variant="default" className="mt-1 bg-green-500">
                                    {isOnTrack ? 'On Track' : goal.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">{trend}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Progress value={progress} className="h-2" />
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Current {formatCurrency(goal.currentProgress)}
                                </span>
                                <span className="text-muted-foreground">
                                  Target {formatCurrency(goal.targetRevenue)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Due {format(new Date(goal.endDate), 'MMM dd')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role Assignment Status */}
              {!user?.customRoleId && user?.role !== 'ADMIN' && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-base">Role Pending</CardTitle>
                    <CardDescription className="text-center text-xs">
                      Waiting for administrator to assign your role
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Role Information */}
              {user?.customRoleId && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-green-100 p-3 rounded-full">
                        <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-base">Role Assigned</CardTitle>
                    <CardDescription className="text-center text-xs">
                      Role: <strong>{user?.customRoleName}</strong>
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;