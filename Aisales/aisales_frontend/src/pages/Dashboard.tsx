import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Target,
  LogOut,
  User,
  Settings,
  Bell,
  Menu,
  X,
  Home,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary-glow shadow-elegant border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Vocalyx</h1>
                  <p className="text-white/80 text-sm">AI Sales Executive</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/20 hover:text-white" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={() => navigate('/sentiment-analysis')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Sentiment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={() => navigate('/call-history')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:bg-white/20 hover:text-white"
                  onClick={() => navigate('/chat')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  ChatBot
                </Button>
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="h-5 w-5" />
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-white/70">{user?.email}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-5 w-5 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-white/80 hover:bg-white/20 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-white/20">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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