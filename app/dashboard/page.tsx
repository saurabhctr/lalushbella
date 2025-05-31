"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Package,
  Settings,
  Star,
  Truck,
  CreditCard,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserListings, getUserOrders, type Listing, type Order } from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
// Add the import for LenderNotifications
import LenderNotifications from "@/components/lender-notifications"

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [borrowedItems, setBorrowedItems] = useState<Order[]>([])
  const [lentItems, setLentItems] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !token) return

      setIsLoading(true)
      try {
        // Fetch user's orders (both borrowed and lent)
        const ordersData = await getUserOrders(user.customer_id, token)
        setBorrowedItems(ordersData.borrowed_orders || [])

        // Fetch user's listings
        const listingsData = await getUserListings(user.customer_id, token)
        setLentItems(listingsData.listings || [])
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src="/placeholder.svg?height=80&width=80" alt="User" />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
              <div className="flex items-center justify-center mt-1 mb-4">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="font-medium">4.8</span>
                <span className="text-gray-500 text-sm ml-1">(16 reviews)</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/profile">Edit Profile</Link>
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button
                    variant={activeTab === "overview" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("overview")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={activeTab === "borrowed" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("borrowed")}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Borrowed Items
                  </Button>
                  <Button
                    variant={activeTab === "lent" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("lent")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Lent Items
                  </Button>
                  <Button
                    variant={activeTab === "payments" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("payments")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payments
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <h3 className="font-medium">Quick Actions</h3>
                  <Button asChild className="w-full">
                    <Link href="/lend">List New Item</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/browse">Find Items</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <div className="bg-purple-100 p-3 rounded-full mb-2">
                          <Package className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold">{lentItems.length + borrowedItems.length}</h3>
                        <p className="text-gray-500">Total Rentals</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-2">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold">
                          {
                            borrowedItems.filter(
                              (item) =>
                                item.status === "Confirmed" ||
                                item.status === "Payment Made" ||
                                item.status === "KYC Done" ||
                                item.status === "Awaiting Logistics",
                            ).length
                          }
                        </h3>
                        <p className="text-gray-500">Active Rentals</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <div className="bg-green-100 p-3 rounded-full mb-2">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold">
                          ₹{lentItems.reduce((sum, item) => sum + (item.daily_price || 0), 0) * 30}
                        </h3>
                        <p className="text-gray-500">Potential Monthly Earnings</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="borrowed">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="borrowed">Borrowed Items</TabsTrigger>
                    <TabsTrigger value="lent">Lent Items</TabsTrigger>
                  </TabsList>
                  <TabsContent value="borrowed" className="space-y-4 pt-4">
                    {borrowedItems.length > 0 ? (
                      borrowedItems.map((item) => (
                        <Card key={item.order_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={item.listing?.images?.front || "/placeholder.svg?height=100&width=150"}
                                alt={`${item.listing?.brand || ""} ${item.listing?.model_name || ""}`}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">
                                      {item.listing?.brand || ""} {item.listing?.model_name || ""}
                                    </h3>
                                    <p className="text-sm text-gray-500">Order #{item.order_id}</p>
                                  </div>
                                  <Badge
                                    className={
                                      item.status === "Delivered"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-blue-100 text-blue-800 border-blue-200"
                                    }
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center mt-2 text-sm">
                                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">₹{item.listing?.daily_price || 0}/day</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't borrowed any items yet</p>
                        <Button asChild className="mt-4">
                          <Link href="/browse">Browse Items</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="lent" className="space-y-4 pt-4">
                    {lentItems.length > 0 ? (
                      lentItems.map((item) => (
                        <Card key={item.listing_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={item.images?.front || "/placeholder.svg?height=100&width=150"}
                                alt={`${item.brand} ${item.model_name || ""}`}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">
                                      {item.brand} {item.model_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">Listing #{item.listing_id}</p>
                                  </div>
                                  <Badge
                                    className={
                                      item.status === "Active"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    }
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center mt-2 text-sm">
                                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">₹{item.daily_price}/day</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't listed any items yet</p>
                        <Button asChild className="mt-4">
                          <Link href="/lend">List an Item</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest rental activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {borrowedItems.length > 0 || lentItems.length > 0 ? (
                        <>
                          {borrowedItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Truck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  Your order for {item.listing?.brand} {item.listing?.model_name} is {item.status}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {lentItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div className="bg-purple-100 p-2 rounded-full">
                                <Package className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  Your listing for {item.brand} {item.model_name} is {item.status}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-center text-gray-500">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <LenderNotifications />
              </div>
            )}

            {activeTab === "borrowed" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Borrowed Items</h1>
                <Tabs defaultValue="active">
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="past">Past Rentals</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="space-y-4 pt-4">
                    {borrowedItems.filter(
                      (item) =>
                        item.status === "Confirmed" ||
                        item.status === "Payment Made" ||
                        item.status === "KYC Done" ||
                        item.status === "Awaiting Logistics" ||
                        item.status === "Delivered",
                    ).length > 0 ? (
                      borrowedItems
                        .filter(
                          (item) =>
                            item.status === "Confirmed" ||
                            item.status === "Payment Made" ||
                            item.status === "KYC Done" ||
                            item.status === "Awaiting Logistics" ||
                            item.status === "Delivered",
                        )
                        .map((item) => (
                          <Card key={item.order_id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.listing?.images?.front || "/placeholder.svg?height=100&width=150"}
                                  alt={`${item.listing?.brand || ""} ${item.listing?.model_name || ""}`}
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">
                                        {item.listing?.brand || ""} {item.listing?.model_name || ""}
                                      </h3>
                                      <p className="text-sm text-gray-500">Order #{item.order_id}</p>
                                    </div>
                                    <Badge
                                      className={
                                        item.status === "Delivered"
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : "bg-blue-100 text-blue-800 border-blue-200"
                                      }
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center mt-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium">₹{item.listing?.daily_price || 0}/day</span>
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline">
                                      Contact Owner
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No active rentals</p>
                        <Button asChild className="mt-4">
                          <Link href="/browse">Browse Items</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="past" className="pt-4">
                    <div className="text-center py-8">
                      <p className="text-gray-500">No past rentals found</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "lent" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Lent Items</h1>
                  <Button asChild>
                    <Link href="/lend">List New Item</Link>
                  </Button>
                </div>
                <Tabs defaultValue="active">
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="past">Past Rentals</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="space-y-4 pt-4">
                    {lentItems.filter((item) => item.status === "Active").length > 0 ? (
                      lentItems
                        .filter((item) => item.status === "Active")
                        .map((item) => (
                          <Card key={item.listing_id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.images?.front || "/placeholder.svg?height=100&width=150"}
                                  alt={`${item.brand} ${item.model_name || ""}`}
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">
                                        {item.brand} {item.model_name}
                                      </h3>
                                      <p className="text-sm text-gray-500">Listing #{item.listing_id}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                                  </div>
                                  <div className="flex items-center mt-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium">₹{item.daily_price}/day</span>
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline">
                                      Edit Listing
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No active listings</p>
                        <Button asChild className="mt-4">
                          <Link href="/lend">List an Item</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pending" className="space-y-4 pt-4">
                    {lentItems.filter((item) => item.status === "Draft").length > 0 ? (
                      lentItems
                        .filter((item) => item.status === "Draft")
                        .map((item) => (
                          <Card key={item.listing_id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={item.images?.front || "/placeholder.svg?height=100&width=150"}
                                  alt={`${item.brand} ${item.model_name || ""}`}
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">
                                        {item.brand} {item.model_name}
                                      </h3>
                                      <p className="text-sm text-gray-500">Listing #{item.listing_id}</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>
                                  </div>
                                  <div className="flex items-center mt-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium">₹{item.daily_price}/day</span>
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button size="sm">Complete Listing</Button>
                                    <Button size="sm" variant="outline">
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No draft listings</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="past" className="pt-4">
                    <div className="text-center py-8">
                      <p className="text-gray-500">No past rentals found</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Payments</h1>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                    <CardDescription>Overview of your earnings and expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-800 mb-1">Total Earnings</h3>
                        <p className="text-2xl font-bold text-green-700">
                          ₹{lentItems.reduce((sum, item) => sum + (item.daily_price || 0) * 30 * 0.9, 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800 mb-1">Total Spent</h3>
                        <p className="text-2xl font-bold text-blue-700">
                          ₹
                          {borrowedItems
                            .reduce((sum, item) => sum + (item.listing?.daily_price || 0) * 3, 0)
                            .toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <h3 className="font-medium mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                      {borrowedItems.length > 0 || lentItems.length > 0 ? (
                        <>
                          {borrowedItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-full">
                                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    Payment for {item.listing?.brand} {item.listing?.model_name}
                                  </p>
                                  <p className="text-sm text-gray-500">Order #{item.order_id}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-red-600">-₹{(item.listing?.daily_price || 0) * 3}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {lentItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full">
                                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    Earnings from {item.brand} {item.model_name}
                                  </p>
                                  <p className="text-sm text-gray-500">Listing #{item.listing_id}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-green-600">+₹{(item.daily_price || 0) * 30 * 0.9}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-center text-gray-500">No transactions yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Visa ending in 3456</p>
                            <p className="text-sm text-gray-500">Expires 05/25</p>
                          </div>
                        </div>
                        <Badge>Default</Badge>
                      </div>

                      <Button variant="outline" className="w-full">
                        Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={user?.name || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={user?.email || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input id="phone" defaultValue={user?.mobile_number || ""} disabled />
                    </div>
                    <Button>Save Changes</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive text messages for important updates</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-gray-500">Receive offers and promotions</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full">
                      Enable Two-Factor Authentication
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={logout}>
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

