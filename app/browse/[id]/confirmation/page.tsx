"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Truck, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getListingById, getOrderById, getDeliverySlot } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [listing, setListing] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [deliverySlot, setDeliverySlot] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [confirmationId, setConfirmationId] = useState("RNT-" + Math.floor(100000 + Math.random() * 900000))

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      setIsLoading(true)
      try {
        // Get order ID from URL params
        const searchParams = new URLSearchParams(window.location.search)
        const orderIdParam = searchParams.get("orderId")
        const currentOrderId = orderIdParam ? Number.parseInt(orderIdParam) : Number.parseInt(params.id)

        // Fetch order details
        const orderData = await getOrderById(currentOrderId, token)
        setOrder(orderData)

        // Fetch listing details
        const listingData = await getListingById(orderData.listing_id)
        setListing(listingData)

        // Get delivery slot
        try {
          const deliverySlotData = await getDeliverySlot(orderData.order_id, token)
          setDeliverySlot(deliverySlotData)
        } catch (error) {
          console.error("Error fetching delivery slot:", error)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, token])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Rental Confirmed!</h1>

          <p className="text-gray-600 mb-8">
            Your rental request has been confirmed. The owner has been notified and our logistics team will contact you
            shortly for delivery.
          </p>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-left">Rental Details</h2>
              <div className="space-y-4 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item</span>
                  <span className="font-medium">
                    {listing ? `${listing.brand} ${listing.model_name || ""}` : "Product"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Period</span>
                  <span className="font-medium">{order?.rental_months || 3} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold">₹{order?.total_rental_price?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">
                    ₹
                    {order?.security_deposit?.toFixed(2) ||
                      (order?.rental_price_per_month ? (order.rental_price_per_month * 1.2).toFixed(2) : "0.00")}{" "}
                    (refundable)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">Credit Card (•••• 3456)</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmation ID</span>
                  <span className="font-medium">{confirmationId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
              <Calendar className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium">Schedule</h3>
              <p className="text-sm text-gray-600">
                {deliverySlot
                  ? `Delivery on ${new Date(deliverySlot.slot_datetime).toLocaleDateString()}`
                  : "Delivery scheduled"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
              <Truck className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium">Logistics</h3>
              <p className="text-sm text-gray-600">Delivery included</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
              <MessageCircle className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium">Support</h3>
              <p className="text-sm text-gray-600">24/7 customer service</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/browse">Browse More Items</Link>
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

