import React, { useEffect, useMemo, useState } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target as TargetIcon, Hourglass, Percent, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Goal = {
  id: number;
  name: string;
  description: string;
  targetRevenue: number;
  currentProgress: number;
  startDate: string; // yyyy-MM-dd from backend LocalDate
  endDate: string; // yyyy-MM-dd from backend LocalDate
  status?: string;
  progressPercentage?: number;
  company?: string;
  priority?: string;
};

type DashboardSummary = {
  totalGoals: number;
  achievedGoals: number;
  pendingGoals: number;
  averageProgress: number;
};

type GoalFormState = {
  name: string;
  description: string;
  targetRevenue: string; // keep as string for input control, cast on submit
  currentProgress: string; // string for control; default 0 on create
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  company: string;
  priority: string;
};

const initialFormState: GoalFormState = {
  name: '',
  description: '',
  targetRevenue: '',
  currentProgress: '0',
  startDate: '',
  endDate: '',
  company: '',
  priority: 'Medium',
};

const formatDateInputValue = (isoOrDate: string | Date | null | undefined) => {
  if (!isoOrDate) return '';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Backend expects LocalDate (yyyy-MM-dd), so just pass through
const toLocalDateString = (yyyyMmDd: string) => yyyyMmDd;

const currencyUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const priorityClass = (p?: string) => {
  switch ((p || '').toLowerCase()) {
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

const getStatusInfo = (goal: Goal) => {
  const today = new Date();
  
  // Handle null/undefined dates
  if (!goal.startDate || !goal.endDate) {
    return {
      status: 'Invalid Date',
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    };
  }
  
  const startDate = new Date(goal.startDate);
  const endDate = new Date(goal.endDate);
  
  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      status: 'Invalid Date',
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    };
  }
  
  if (today < startDate) {
    return {
      status: 'Not Started',
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    };
  } else if (today > endDate) {
    return {
      status: 'Date Over',
      color: 'bg-red-100 text-red-700 border-red-200'
    };
  } else if (goal.currentProgress >= goal.targetRevenue) {
    return {
      status: 'Completed',
      color: 'bg-green-100 text-green-700 border-green-200'
    };
  } else {
    return {
      status: 'In Progress',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    };
  }
};

const AnalyticsGoals: React.FC = () => {
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

  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formState, setFormState] = useState<GoalFormState>(initialFormState);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Advanced table UI state
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Compute disabled date ranges from existing goals (exclude currently edited goal)
  const disabledRanges = useMemo(() => {
    return goals
      .filter((g) => (editingGoalId == null ? true : g.id !== editingGoalId))
      .map((g) => ({ from: new Date(g.startDate), to: new Date(g.endDate) }));
  }, [goals, editingGoalId]);

  // Keep form state in sync when user picks a date range from the calendar
  useEffect(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return;
    }
    const start = formatDateInputValue(dateRange.from);
    const end = formatDateInputValue(dateRange.to);
    setFormState((s) => ({ ...s, startDate: start, endDate: end }));
    // Clear error when valid selection is made
    setError(null);
  }, [dateRange]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingGoalId(null);
    setDateRange(undefined);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First update goal progress from sales data
      await api.post('/api/goal-sales/update-progress');
      
      const [goalsRes, summaryRes] = await Promise.all([
        api.get<Goal[]>('/api/goals'),
        api.get<DashboardSummary>('/api/goals/dashboard/summary'),
      ]);
      
      // Ensure data is properly formatted
      const goalsData = goalsRes.data || [];
      const summaryData = summaryRes.data || null;
      
      // Debug: Log goals data to see what we're getting
      console.log('Goals data from backend:', goalsData);
      console.log('Summary data from backend:', summaryData);
      
      setGoals(goalsData);
      setSummary(summaryData);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading goals data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Reset to first page on filter/search/sort change
  useEffect(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter, companyFilter, sortBy, sortDir, pageSize]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Frontend validation for date conflicts
    if (checkDateConflict(formState.startDate, formState.endDate, editingGoalId || undefined)) {
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        targetRevenue: Number(formState.targetRevenue),
        currentProgress: Number(formState.currentProgress || '0'),
        startDate: toLocalDateString(formState.startDate),
        endDate: toLocalDateString(formState.endDate),
        company: formState.company.trim(),
        priority: formState.priority,
      };

      if (editingGoalId != null) {
        await api.put(`/api/goals/${editingGoalId}`, payload);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/api/goals', payload);
        toast.success('Goal created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to save goal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setFormState({
      name: goal.name || '',
      description: goal.description || '',
      targetRevenue: String(goal.targetRevenue ?? ''),
      currentProgress: String(goal.currentProgress ?? '0'),
      startDate: goal.startDate ? formatDateInputValue(goal.startDate) : '',
      endDate: goal.endDate ? formatDateInputValue(goal.endDate) : '',
      company: goal.company || '',
      priority: goal.priority || 'Medium',
    });
    if (goal.startDate && goal.endDate) {
      setDateRange({ from: new Date(goal.startDate), to: new Date(goal.endDate) });
    } else {
      setDateRange(undefined);
    }
    setIsDialogOpen(true);
  };

  const onView = (goal: Goal) => {
    navigate(`/goals/${goal.id}`);
  };

  const checkDateConflict = (startDate: string, endDate: string, excludeId?: number) => {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if start date is before end date
    if (start >= end) {
      setError('Start date must be before end date');
      return true;
    }
    
    // Check for overlapping goals
    const conflictingGoal = goals.find(goal => {
      if (excludeId && goal.id === excludeId) return false;
      
      const goalStart = new Date(goal.startDate);
      const goalEnd = new Date(goal.endDate);
      
      // Check if dates overlap
      return (start <= goalEnd && end >= goalStart);
    });
    
    if (conflictingGoal) {
      setError(`Date conflict: Another goal '${conflictingGoal.name}' already exists during this time period (${formatDateInputValue(conflictingGoal.startDate || '')} to ${formatDateInputValue(conflictingGoal.endDate || '')}). Please choose different dates.`);
      return true;
    }
    
    return false;
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/goals/${id}`);
      toast.success('Goal deleted successfully');
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete goal');
    } finally {
      setLoading(false);
    }
  };

  // Unique companies for filter (from loaded goals)
  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    goals.forEach((g) => { if (g.company) set.add(g.company); });
    return Array.from(set).sort();
  }, [goals]);

  // Compute filters + sorting + pagination
  const computed = useMemo(() => {
    const enriched = goals.map((g) => {
      const currentProgress = g.currentProgress || 0;
      const targetRevenue = g.targetRevenue || 0;
      const progressPct = targetRevenue > 0 ? Math.min(100, Math.round((currentProgress / targetRevenue) * 100)) : 0;
      
      // Debug: Log progress calculation
      console.log(`Goal ${g.name}: currentProgress=${currentProgress}, targetRevenue=${targetRevenue}, progressPct=${progressPct}`);
      
      return {
        ...g,
        _status: getStatusInfo(g).status,
        _progressPct: progressPct,
      };
    });

    const filtered = enriched.filter((g) => {
      const matchesSearch = search.trim().length === 0
        || (g.name?.toLowerCase().includes(search.toLowerCase()))
        || (g.description?.toLowerCase().includes(search.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || (g.priority || '').toLowerCase() === priorityFilter;
      const matchesStatus = statusFilter === 'all' || (g._status || '').toLowerCase().replace(' ', '-') === statusFilter;
      const matchesCompany = companyFilter === 'all' || (g.company || '') === companyFilter;
      return matchesSearch && matchesPriority && matchesStatus && matchesCompany;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'startDate':
          return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
        case 'endDate':
          return (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * dir;
        case 'progress':
          return (a._progressPct - b._progressPct) * dir;
        case 'priority':
          return (a.priority || '').localeCompare(b.priority || '') * dir;
        default:
          return 0;
      }
    });

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = sorted.slice(start, end);

    return { items: pageItems, total, totalPages, currentPage };
  }, [goals, search, priorityFilter, statusFilter, companyFilter, sortBy, sortDir, page, pageSize]);

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Dashboard Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><TargetIcon className="h-4 w-4" /> Total Goals</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalGoals}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Trophy className="h-4 w-4" /> Achieved Goals</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.achievedGoals}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Hourglass className="h-4 w-4" /> Pending Goals</div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.pendingGoals}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Percent className="h-4 w-4" /> Average Progress</div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${summary.averageProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-muted-foreground">{summary.averageProgress}%</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No summary available.</div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Goals</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>New Goal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingGoalId != null ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Enter goal name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formState.description}
                    onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Enter goal description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRevenue">Target Revenue ($)</Label>
                  <Input
                    id="targetRevenue"
                    type="number"
                    value={formState.targetRevenue}
                    onChange={(e) => setFormState((s) => ({ ...s, targetRevenue: e.target.value }))}
                    placeholder="e.g., 10000"
                    required
                    min={0}
                    step={1}
                  />
                </div>
                {editingGoalId != null && (
                  <div className="space-y-2">
                    <Label htmlFor="currentProgress">Current Progress</Label>
                    <Input
                      id="currentProgress"
                      type="number"
                      value={formState.currentProgress}
                      onChange={(e) => setFormState((s) => ({ ...s, currentProgress: e.target.value }))}
                      placeholder="e.g., 250"
                      min={0}
                      step={1}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <select
                    id="company"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.company}
                    onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select a company</option>
                    <option value="Acme Corp">Acme Corp</option>
                    <option value="Globex Inc">Globex Inc</option>
                    <option value="Initech">Initech</option>
                    <option value="Hooli">Hooli</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.priority}
                    onChange={(e) => setFormState((s) => ({ ...s, priority: e.target.value }))}
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateRange?.from && 'text-muted-foreground'
                        )}
                      >
                        {dateRange?.from && dateRange?.to
                          ? `${formatDateInputValue(dateRange.from)} → ${formatDateInputValue(dateRange.to)}`
                          : 'Pick a date range'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={disabledRanges}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {/* Hidden inputs to keep browser validation if needed */}
                  <input type="hidden" id="startDate" value={formState.startDate} required readOnly />
                  <input type="hidden" id="endDate" value={formState.endDate} required readOnly />
                </div>
                {formState.startDate && formState.endDate && (
                  <div className="text-xs text-muted-foreground">
                    Duration: {Math.ceil((new Date(formState.endDate).getTime() - new Date(formState.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                )}
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingGoalId != null ? 'Save Changes' : 'Create Goal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <Input
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button variant="ghost" size="icon" onClick={() => setSearch('')} aria-label="Clear search">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="date-over">Date Over</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companyOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setPriorityFilter('all'); setStatusFilter('all'); setCompanyFilter('all'); }}>Reset</Button>
        </div>
      </div>

      {/* Goals Table - advanced UI */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <div className="inline-flex items-center gap-1">Goal <ArrowUpDown className="h-3.5 w-3.5 opacity-60" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('startDate')}>
                <div className="inline-flex items-center gap-1">Date Range <ArrowUpDown className="h-3.5 w-3.5 opacity-60" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('progress')}>
                <div className="inline-flex items-center gap-1">Progress <ArrowUpDown className="h-3.5 w-3.5 opacity-60" /></div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('priority')}>
                <div className="inline-flex items-center gap-1">Priority <ArrowUpDown className="h-3.5 w-3.5 opacity-60" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computed.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {loading ? 'Loading goals...' : 'No matching goals found.'}
                </TableCell>
              </TableRow>
            ) : (
                computed.items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium" title={g.description || ''}>{g.name}</TableCell>
                  <TableCell>
                    {formatDateInputValue(g.startDate || '')} → {formatDateInputValue(g.endDate || '')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${g._progressPct}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {g._progressPct}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ${currencyUSD.format(g.currentProgress || 0)} / ${currencyUSD.format(g.targetRevenue || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const statusInfo = getStatusInfo(g);
                      return (
                        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {g.priority ? (
                      <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${priorityClass(g.priority)}`}>
                        {g.priority}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onView(g)}>View</Button>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(g)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(g.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Showing {(computed.total === 0 ? 0 : (computed.currentPage - 1) * pageSize + 1)}–{Math.min(computed.currentPage * pageSize, computed.total)} of {computed.total}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Rows" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="8">8 / page</SelectItem>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={computed.currentPage <= 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[70px] text-center text-sm">{computed.currentPage} / {computed.totalPages}</div>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(computed.totalPages, p + 1))} disabled={computed.currentPage >= computed.totalPages} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsGoals;


