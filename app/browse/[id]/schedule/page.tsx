"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Truck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { updateOrderStatus, scheduleDeliverySlot } from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"

export default function SchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("10-12")
  const [deliveryNotes, setDeliveryNotes] = useState("")

  useEffect(() => {
    // Set default delivery date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDeliveryDate(tomorrow.toISOString().split("T")[0])

    // Get order ID from URL params
    const searchParams = new URLSearchParams(window.location.search)
    const orderIdParam = searchParams.get("orderId")
    if (orderIdParam) {
      setOrderId(Number.parseInt(orderIdParam))
    }
  }, [])

  const handleSchedule = async () => {
    if (!user || !token) {
      router.push("/auth/login")
      return
    }

    if (!deliveryDate) {
      alert("Please select a delivery date")
      return
    }

    setIsSubmitting(true)
    try {
      // Get the order ID either from state or params
      const currentOrderId = orderId || Number.parseInt(params.id)

      // Parse the selected date and time
      const scheduledDate = new Date(deliveryDate)
      const timeSlot = deliveryTime.split("-")
      const startHour = Number.parseInt(timeSlot[0])
      scheduledDate.setHours(startHour, 0, 0, 0)

      // Schedule the delivery slot
      await scheduleDeliverySlot(
        {
          order_id: currentOrderId,
          slot_datetime: scheduledDate.toISOString(),
          notes: deliveryNotes || undefined,
        },
        token,
      )

      // Update order status to Awaiting Logistics
      await updateOrderStatus(currentOrderId, "Awaiting Logistics", token)

      // Redirect to confirmation page
      router.push(`/browse/${params.id}/confirmation?orderId=${currentOrderId}`)
    } catch (error) {
      console.error("Error scheduling delivery:", error)
      alert("Failed to schedule delivery. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6 pl-0"
          onClick={() => router.push(`/browse/${params.id}/kyc?orderId=${orderId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Verification
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Schedule Delivery</h1>
          <p className="text-gray-600 mt-2">Choose when you'd like your item to be delivered</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Schedule</CardTitle>
            <CardDescription>Select a preferred delivery date and time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Delivery Information</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Our logistics partner will deliver your item during the selected time slot. Please ensure someone is
                  available to receive the item.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Delivery Date</Label>
                <Input
                  type="date"
                  id="delivery-date"
                  min={new Date().toISOString().split("T")[0]}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-time">Time Slot</Label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                  <SelectTrigger id="delivery-time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-12">10:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="12-14">12:00 PM - 2:00 PM</SelectItem>
                    <SelectItem value="14-16">2:00 PM - 4:00 PM</SelectItem>
                    <SelectItem value="16-18">4:00 PM - 6:00 PM</SelectItem>
                    <SelectItem value="18-20">6:00 PM - 8:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
                <Input
                  id="delivery-notes"
                  placeholder="E.g., Apartment number, gate code, etc."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <h3 className="font-medium">Delivery Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your item will be delivered on{" "}
                    {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : "the selected date"} between{" "}
                    {deliveryTime === "10-12"
                      ? "10:00 AM - 12:00 PM"
                      : deliveryTime === "12-14"
                        ? "12:00 PM - 2:00 PM"
                        : deliveryTime === "14-16"
                          ? "2:00 PM - 4:00 PM"
                          : deliveryTime === "16-18"
                            ? "4:00 PM - 6:00 PM"
                            : "6:00 PM - 8:00 PM"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSchedule} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Schedule Delivery"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

