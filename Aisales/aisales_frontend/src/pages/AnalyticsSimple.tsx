import React, { useState } from 'react';
import AnalyticsGoals from '@/components/AnalyticsGoals';
import SalesAnalyticsSimple from '@/components/SalesAnalyticsSimple';
import NavigationBar from '@/components/NavigationBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, BarChart3 } from 'lucide-react';

const AnalyticsSimple: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('goals');

    return (
        <div className="min-h-screen bg-background">
            <NavigationBar />
            <main className="px-6 py-8 max-w-7xl mx-auto">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                            <p className="text-muted-foreground">
                                Track your sales performance and goal progress
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Active sales goals
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    From all sales
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sales Count</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Total sales closed
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg Sale</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Average sale amount
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Analytics Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="goals" className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Goals & Targets
                            </TabsTrigger>
                            <TabsTrigger value="sales" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Sales Analytics
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="goals" className="space-y-4">
                            <AnalyticsGoals />
                        </TabsContent>
                        
                        <TabsContent value="sales" className="space-y-4">
                            <SalesAnalyticsSimple />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
};

export default AnalyticsSimple;
