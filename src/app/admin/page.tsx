"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  ChefHat,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AdminStats {
  totalSales: number
  totalOrders: number
  activeStaff: number
  pendingOrders: number
  completedOrders: number
  totalCustomers: number
  averageOrderValue: number
  dailyRevenue: number[]
}

interface StaffOverview {
  id: number
  name: string
  role: string
  status: "active" | "inactive" | "break"
  checkInTime?: string
  avatar?: string
}

interface RecentOrder {
  id: number
  orderId: string
  tableNumber: number
  items: string[]
  total: number
  status: "pending" | "preparing" | "ready" | "completed"
  timestamp: string
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalOrders: 0,
    activeStaff: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    dailyRevenue: [],
  })
  const [staffOverview, setStaffOverview] = useState<StaffOverview[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API calls
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          totalSales: 45280.5,
          totalOrders: 342,
          activeStaff: 12,
          pendingOrders: 8,
          completedOrders: 334,
          totalCustomers: 1250,
          averageOrderValue: 132.4,
          dailyRevenue: [1200, 1800, 2100, 1900, 2400, 2800, 3200],
        })

        setStaffOverview([
          { id: 1, name: "John Doe", role: "Chef", status: "active", checkInTime: "09:00 AM" },
          { id: 2, name: "Jane Smith", role: "Waiter", status: "active", checkInTime: "08:30 AM" },
          { id: 3, name: "Mike Johnson", role: "Manager", status: "break", checkInTime: "08:00 AM" },
          { id: 4, name: "Sarah Wilson", role: "Waiter", status: "active", checkInTime: "09:15 AM" },
        ])

        setRecentOrders([
          {
            id: 1,
            orderId: "ORD-001",
            tableNumber: 5,
            items: ["Pasta", "Salad"],
            total: 280,
            status: "preparing",
            timestamp: "2 min ago",
          },
          {
            id: 2,
            orderId: "ORD-002",
            tableNumber: 3,
            items: ["Pizza", "Coke"],
            total: 450,
            status: "ready",
            timestamp: "5 min ago",
          },
          {
            id: 3,
            orderId: "ORD-003",
            tableNumber: 8,
            items: ["Burger", "Fries"],
            total: 320,
            status: "pending",
            timestamp: "8 min ago",
          },
        ])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "break":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const chartData = [
    { name: "Mon", revenue: 1200 },
    { name: "Tue", revenue: 1800 },
    { name: "Wed", revenue: 2100 },
    { name: "Thu", revenue: 1900 },
    { name: "Fri", revenue: 2400 },
    { name: "Sat", revenue: 2800 },
    { name: "Sun", revenue: 3200 },
  ]

  const pieData = [
    { name: "Completed", value: stats.completedOrders, color: "#10b981" },
    { name: "Pending", value: stats.pendingOrders, color: "#f59e0b" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <Badge variant="secondary" className="text-xs">
              Restaurant Management System
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search..." className="pl-10 w-64" />
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Options
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{stats.totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Coffee className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
              <Users className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeStaff}</div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Currently on duty
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                <XCircle className="inline h-3 w-3 mr-1" />
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Revenue Trend
              </CardTitle>
              <CardDescription>Revenue performance over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Order Status Distribution
              </CardTitle>
              <CardDescription>Current order completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Overview
                </span>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffOverview.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(staff.status)}>{staff.status}</Badge>
                      {staff.checkInTime && <p className="text-xs text-muted-foreground mt-1">{staff.checkInTime}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Orders
                </span>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.orderId}</p>
                        <Badge variant="outline" className="text-xs">
                          Table {order.tableNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.items.join(", ")}</p>
                      <p className="text-xs text-muted-foreground">{order.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.total}</p>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
