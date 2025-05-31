"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { getUserOrders } from "@/lib/api"
import Link from "next/link"
// Add this import at the top of the file
import LenderPayoutForm from "./lender-payout-form"

// Helper function to calculate total monthly earnings
function calculateMonthlyEarnings(orders: any[]) {
  // Filter orders that have completed KYC or beyond
  const activeOrders = orders.filter(
    (order) => order.status === "KYC Done" || order.status === "Awaiting Logistics" || order.status === "Delivered",
  )

  // Sum up the total rental price for each item
  return activeOrders.reduce((total, order) => {
    // Use total_rental_price if available, otherwise fall back to monthly calculation
    const rentalAmount = order.total_rental_price || (order.listing?.daily_price || 0) * 30
    return total + rentalAmount
  }, 0)
}

export default function LenderNotifications() {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBankDetailsForm, setShowBankDetailsForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [ordersWithBankDetails, setOrdersWithBankDetails] = useState<number[]>([])

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !token) return

      setLoading(true)
      try {
        // Get user's orders
        const ordersData = await getUserOrders(user.customer_id, token)

        // Filter for lent orders with recent status changes
        const recentOrders = ordersData.lent_orders
          .filter((order) => {
            // Consider orders with status changes in the last 7 days as "recent"
            const orderDate = new Date(order.created_at)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            return orderDate > sevenDaysAgo
          })
          .map((order) => {
            // Create notification object
            return {
              id: order.order_id,
              type: getNotificationType(order.status),
              title: getNotificationTitle(order.status, order.listing?.brand, order.listing?.model_name),
              time: new Date(order.created_at).toLocaleString(),
              status: order.status,
              isRead: false,
              order,
            }
          })

        setNotifications(recentOrders)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user, token])

  const getNotificationType = (status: string) => {
    switch (status) {
      case "Payment Made":
        return "payment"
      case "KYC Done":
        return "kyc"
      case "Awaiting Logistics":
        return "logistics"
      case "Delivered":
        return "delivered"
      default:
        return "general"
    }
  }

  const getNotificationTitle = (status: string, brand?: string, model?: string) => {
    const itemName = brand && model ? `${brand} ${model}` : "Your item"

    switch (status) {
      case "Payment Made":
        return `${itemName} has been rented! Payment received.`
      case "KYC Done":
        return `Borrower completed KYC verification for ${itemName}.`
      case "Awaiting Logistics":
        return `${itemName} is scheduled for pickup.`
      case "Delivered":
        return `${itemName} has been delivered to the borrower.`
      default:
        return `Update on your listing: ${itemName}`
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Payment</Badge>
      case "kyc":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">KYC</Badge>
      case "logistics":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Logistics</Badge>
      case "delivered":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Delivered</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Update</Badge>
    }
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  // Replace the handleAddBankDetails function with this updated version
  const handleAddBankDetails = (order: any) => {
    setSelectedOrder(order)
    setShowBankDetailsForm(true)
  }

  const handleBankDetailsSuccess = () => {
    setShowBankDetailsForm(false)
    // Mark the notification as read
    if (selectedOrder) {
      markAsRead(selectedOrder.id)
      // Add this order to the list of orders with bank details
      setOrdersWithBankDetails((prev) => [...prev, selectedOrder.id])
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Replace the BankDetailsForm rendering section with this updated version
  if (showBankDetailsForm && selectedOrder) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" /> Add Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LenderPayoutForm
            orderId={selectedOrder.order.order_id}
            amount={selectedOrder.order.total_rental_price || 0}
            onSuccess={() => {
              // Mark the notification as read
              if (selectedOrder) {
                markAsRead(selectedOrder.id)
                // Add this order to the list of orders with bank details
                setOrdersWithBankDetails((prev) => [...prev, selectedOrder.id])
              }
              setShowBankDetailsForm(false)
            }}
            onCancel={() => setShowBankDetailsForm(false)}
          />
        </CardContent>
      </Card>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <p>No new notifications</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" /> Notifications
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <Badge className="ml-2 bg-red-500">{notifications.filter((n) => !n.isRead).length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      {notifications.length > 0 && (
        <div className="px-6 py-2 bg-green-50 border-t border-b border-green-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">Estimated Monthly Earnings:</span>
            <span className="text-lg font-bold text-green-700">
              ₹{calculateMonthlyEarnings(notifications.map((n) => n.order)).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">Based on items that have completed verification</p>
        </div>
      )}
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start p-3 rounded-lg ${notification.isRead ? "bg-gray-50" : "bg-blue-50"}`}
            >
              <div className="mr-3 mt-0.5">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1">
                <p className={`${notification.isRead ? "font-normal" : "font-medium"}`}>{notification.title}</p>
                <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                <div className="flex gap-2 mt-2">
                  {notification.status === "Awaiting Logistics" && !ordersWithBankDetails.includes(notification.id) ? (
                    <Button size="sm" onClick={() => handleAddBankDetails(notification)}>
                      <DollarSign className="h-4 w-4 mr-1" /> Add Payment Details
                    </Button>
                  ) : notification.status === "Awaiting Logistics" &&
                    ordersWithBankDetails.includes(notification.id) ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Payment Details Added</Badge>
                  ) : null}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/orders/${notification.id}`}>View Details</Link>
                  </Button>
                  {!notification.isRead && (
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-1" /> Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

