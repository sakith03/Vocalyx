import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import NavigationBar from '@/components/NavigationBar';
import {
  Target,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  AlertCircle,
  UserCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-5rem)] p-6">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="gradient-primary p-6 rounded-2xl shadow-elegant inline-block mb-6">
              <Target className="h-16 w-16 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Welcome to Vocalyx - your AI-powered sales executive platform.
              Ready to boost your sales performance with intelligent insights and automation.
            </p>
          </div>

          {/* Role Assignment Status */}
          {!user?.customRoleId && user?.role !== 'ADMIN' && (
            <Card className="max-w-2xl mx-auto mb-8">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Waiting for Role Assignment</CardTitle>
                <CardDescription className="text-center">
                  Your account is currently limited to the dashboard. An administrator needs to assign you a role with specific permissions to access other features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Once your administrator assigns you a custom role, you'll be able to access:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Sentiment Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>History</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Contact your administrator to request access to additional features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Information */}
          {user?.customRoleId && (
            <Card className="max-w-2xl mx-auto mb-8">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Role Assigned</CardTitle>
                <CardDescription className="text-center">
                  You have been assigned the role: <strong>{user?.customRoleName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You now have access to the features based on your assigned permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;