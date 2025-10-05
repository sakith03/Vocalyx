import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';

interface WorkspaceUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  customRoleId?: number | null;
  customRoleName?: string | null;
}

interface CustomRole {
  id: number;
  roleName: string;
  description: string;
  companyId: number;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  permissionName: string;
  hasAccess: boolean;
}

const Settings = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  // Role management state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Analytics': false,
    'Sentiment': false,
    'Contacts': false,
    'Settings': false
  });

  const isAdmin = user?.role === 'ADMIN';

  const fetchWorkspaceUsers = async () => {
    if (!isAdmin || !token) return;
    
    setIsLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/workspace-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const users = await res.json();
      setWorkspaceUsers(users);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load workspace users' });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceUsers();
    fetchCustomRoles();
  }, [isAdmin, token]);

  const fetchCustomRoles = async () => {
    if (!isAdmin || !token) return;
    
    setIsLoadingRoles(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const roles = await res.json();
      setCustomRoles(roles);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load custom roles' });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleInvite = async () => {
    if (!email || !tempPassword) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, temporaryPassword: tempPassword }),
      });
      if (!res.ok) throw new Error('Invite failed');
      toast({ title: 'Invitation sent', description: `Invitation email sent to ${email}` });
      setEmail('');
      setTempPassword('');
      // Refresh the user list
      fetchWorkspaceUsers();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not send invitation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Role name is required' });
      return;
    }

    try {
      const permissions = Object.entries(selectedPermissions).map(([name, hasAccess]) => ({
        permissionName: name,
        hasAccess
      }));

      const res = await fetch('http://localhost:8080/api/users/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleName,
          description: roleDescription,
          permissions
        }),
      });

      if (!res.ok) throw new Error('Failed to create role');
      
      toast({ title: 'Success', description: 'Custom role created successfully' });
      setIsCreateRoleDialogOpen(false);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions({
        'Dashboard': true,
        'Analytics': false,
        'Sentiment': false,
        'Contacts': false,
        'Settings': false
      });
      fetchCustomRoles(); // Refresh the roles list
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create role' });
    }
  };

  const handleEditUser = (currentUser: WorkspaceUser) => {
    setEditingUser(currentUser);
    setEditFirstName(currentUser.firstName);
    setEditLastName(currentUser.lastName);
    setEditEmail(currentUser.email);
    setSelectedRoleId(currentUser.customRoleId || null);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editFirstName || !editLastName || !editEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required' });
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
          customRoleId: selectedRoleId
        }),
      });

      if (!res.ok) throw new Error('Failed to update user');
      
      toast({ title: 'Success', description: 'User updated successfully' });
      setIsEditDialogOpen(false);
      fetchWorkspaceUsers(); // Refresh the list
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user' });
    }
  };

  const handleRemoveUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the workspace?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to remove user');
      
      toast({ title: 'Success', description: `${userName} has been removed from the workspace` });
      fetchWorkspaceUsers(); // Refresh the list
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove user' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your workspace and users</CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email</Label>
                          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-temp">Temporary Password</Label>
                          <Input id="invite-temp" type="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
                        </div>
                        <Button onClick={handleInvite} disabled={isSubmitting || !email || !tempPassword} className="w-full">
                          {isSubmitting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Users Table */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-foreground">Workspace Users</h4>
                  
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading users...</div>
                    </div>
                  ) : workspaceUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No users have been added to this workspace yet.</p>
                      <p className="text-sm">Click "Add User" above to invite team members.</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Role</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workspaceUsers.map((workspaceUser) => (
                            <TableRow key={workspaceUser.id} className="hover:bg-muted/30">
                              <TableCell className="font-medium">
                                {workspaceUser.firstName} {workspaceUser.lastName}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {workspaceUser.email}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {workspaceUser.customRoleName ? (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {workspaceUser.customRoleName}
                                    </Badge>
                                  ) : (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-gray-50 text-gray-500 border-gray-200"
                                    >
                                      No custom role
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="text-green-600 border-green-600 bg-green-50"
                                >
                                  {workspaceUser.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(workspaceUser)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                    title="Edit User"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveUser(workspaceUser.id, workspaceUser.firstName)}
                                    className="h-8 w-8 p-0 hover:bg-red-100"
                                    title="Remove User"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Only admins can manage users.</p>
            )}
          </CardContent>
        </Card>

        {/* Create User Roles Section */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Create User Roles</CardTitle>
              <CardDescription>Create custom roles with specific permissions for your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Custom Roles</h3>
                  <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Custom Role</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="role-name">Role Name</Label>
                          <Input 
                            id="role-name" 
                            value={roleName} 
                            onChange={(e) => setRoleName(e.target.value)} 
                            placeholder="e.g., Sales Executive, Analyst, Manager"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role-description">Description</Label>
                          <Input 
                            id="role-description" 
                            value={roleDescription} 
                            onChange={(e) => setRoleDescription(e.target.value)} 
                            placeholder="Brief description of this role"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedPermissions).map(([permission, hasAccess]) => (
                              <div key={permission} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`permission-${permission}`}
                                  checked={hasAccess}
                                  onChange={(e) => setSelectedPermissions(prev => ({
                                    ...prev,
                                    [permission]: e.target.checked
                                  }))}
                                  className="rounded"
                                />
                                <Label htmlFor={`permission-${permission}`} className="text-sm">
                                  {permission}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleCreateRole} className="flex-1">
                            Create Role
                          </Button>
                          <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Roles List */}
                <div className="space-y-4">
                  {isLoadingRoles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading roles...</div>
                    </div>
                  ) : customRoles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No custom roles have been created yet.</p>
                      <p className="text-sm">Click "Create Role" above to create your first custom role.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {customRoles.map((role) => (
                        <div key={role.id} className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{role.roleName}</h4>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {role.permissions
                                  .filter(p => p.hasAccess)
                                  .map((permission) => (
                                    <Badge key={permission.id} variant="secondary" className="text-xs">
                                      {permission.permissionName}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement delete role
                                toast({ title: 'Delete Role', description: 'Delete functionality coming soon' });
                              }}
                              className="text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input 
                  id="edit-first-name" 
                  value={editFirstName} 
                  onChange={(e) => setEditFirstName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input 
                  id="edit-last-name" 
                  value={editLastName} 
                  onChange={(e) => setEditLastName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Custom Role</Label>
                <select
                  id="edit-role"
                  value={selectedRoleId || ''}
                  onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">No custom role</option>
                  {customRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;


