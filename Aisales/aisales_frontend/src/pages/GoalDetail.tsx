import React, { useEffect, useMemo, useState } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Target, DollarSign, Building, Flag, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import GoalAchievementChart from '@/components/GoalAchievementChart';
import GoalStatisticsTable from '@/components/GoalStatisticsTable';
import GoalPredictionsTable from '@/components/GoalPredictionsTable';

type Goal = {
    id: number;
    name: string;
    description: string;
    targetRevenue: number;
    currentProgress: number;
    startDate: string;
    endDate: string;
    status?: string;
    progressPercentage?: number;
    company?: string;
    priority?: string;
};

const GoalDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const api: AxiosInstance = useMemo(() => {
        const instance = axios.create({ baseURL: 'http://localhost:8080' });
        instance.interceptors.request.use((config) => {
            if (token) {
                if (!config.headers) config.headers = {} as any;
                (config.headers as any)["Authorization"] = `Bearer ${token}`;
            }
            return config;
        });
        return instance;
    }, [token]);

    const [goal, setGoal] = useState<Goal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadGoal = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Goal>(`/api/goals/${id}`);
            setGoal(response.data);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load goal');
            toast.error('Failed to load goal details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && id) {
            loadGoal();
        }
    }, [token, id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusInfo = (goal: Goal) => {
        const today = new Date();
        const startDate = new Date(goal.startDate);
        const endDate = new Date(goal.endDate);

        if (today < startDate) {
            return {
                status: 'Not Started',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Clock,
                description: 'Goal has not started yet'
            };
        } else if (today > endDate) {
            return {
                status: 'Date Over',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle,
                description: 'Goal period has ended'
            };
        } else {
            return {
                status: 'In Progress',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: AlertCircle,
                description: 'Goal is currently active'
            };
        }
    };

    const priorityClass = (priority?: string) => {
        switch ((priority || '').toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'low':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-muted text-foreground border-border';
        }
    };

    const currencyUSD = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading goal details...</div>
                </div>
            </div>
        );
    }

    if (error || !goal) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-lg text-red-600 mb-4">{error || 'Goal not found'}</div>
                        <Button onClick={() => navigate('/analytics')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Analytics
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(goal);
    const StatusIcon = statusInfo.icon;
    const progressPercentage = goal.progressPercentage || 0;

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/analytics')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Analytics
                    </Button>
                    <h1 className="text-3xl font-bold">{goal.name}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <StatusIcon className="w-5 h-5" />
                    <span className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.status}
          </span>
                </div>
            </div>

            {/* Status Description */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusInfo.description}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Goal Achievement Visualization */}
            <div className="space-y-6">
                {/* Achievement Chart */}
                <GoalAchievementChart
                    goalId={goal?.id || 0}
                    targetRevenue={goal?.targetRevenue || 0}
                    startDate={goal?.startDate || ''}
                    endDate={goal?.endDate || ''}
                />

                {/* Statistics and Predictions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GoalStatisticsTable
                        goalId={goal?.id || 0}
                        targetRevenue={goal?.targetRevenue || 0}
                        startDate={goal?.startDate || ''}
                        endDate={goal?.endDate || ''}
                    />
                    <GoalPredictionsTable
                        goalId={goal?.id || 0}
                        targetRevenue={goal?.targetRevenue || 0}
                        startDate={goal?.startDate || ''}
                        endDate={goal?.endDate || ''}
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goal Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Target className="w-5 h-5 mr-2" />
                            Goal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <p className="mt-1">{goal.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Company</label>
                                <div className="mt-1">
                                    {goal.company ? (
                                        <Badge variant="secondary" className="flex items-center w-fit">
                                            <Building className="w-3 h-3 mr-1" />
                                            {goal.company}
                                        </Badge>
                                    ) : '-'}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                <div className="mt-1">
                                    {goal.priority ? (
                                        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${priorityClass(goal.priority)}`}>
                      <Flag className="w-3 h-3 mr-1" />
                                            {goal.priority}
                    </span>
                                    ) : '-'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Financial Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Current Progress</span>
                                <span className="font-medium">{currencyUSD.format(goal.currentProgress || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Target Revenue</span>
                                <span className="font-medium">{currencyUSD.format(goal.targetRevenue || 0)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>

                        <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Remaining</span>
                                <span className={goal.currentProgress >= goal.targetRevenue ? 'text-green-600' : ''}>
                  {currencyUSD.format(Math.max(0, (goal.targetRevenue || 0) - (goal.currentProgress || 0)))}
                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium">Start Date</span>
                                </div>
                                <span className="text-sm font-medium">{formatDate(goal.startDate)}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium">End Date</span>
                                </div>
                                <span className="text-sm font-medium">{formatDate(goal.endDate)}</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Duration</span>
                                    <span>
                    {Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Status Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Goal Status</span>
                                <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.status}
                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Completion</span>
                                <span className="text-sm font-medium">
                  {goal.currentProgress >= goal.targetRevenue ? 'Completed' : 'In Progress'}
                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm">Time Status</span>
                                <span className="text-sm font-medium">
                  {new Date() < new Date(goal.startDate) ? 'Not Started' :
                      new Date() > new Date(goal.endDate) ? 'Date Over' : 'Active'}
                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default GoalDetail;

