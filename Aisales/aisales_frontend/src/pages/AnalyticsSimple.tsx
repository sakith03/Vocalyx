import React, { useState } from 'react';
import AnalyticsGoals from '@/components/AnalyticsGoals';
import SalesAnalyticsSimple from '@/components/SalesAnalyticsSimple';
import NavigationBar from '@/components/NavigationBar';
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
