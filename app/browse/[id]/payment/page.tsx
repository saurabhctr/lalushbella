"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getListingById } from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"
import PaymentProcessor from "@/components/payment-processor"

export default function PaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [listing, setListing] = useState<any>(null)
  const [paymentType, setPaymentType] = useState<"monthly" | "upfront">("monthly")
  const [rentalMonths, setRentalMonths] = useState(3)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get listing details
        const listingData = await getListingById(Number.parseInt(params.id))
        setListing(listingData)

        // Get payment type and rental months from URL params
        const searchParams = new URLSearchParams(window.location.search)
        setPaymentType((searchParams.get("paymentType") as "monthly" | "upfront") || "monthly")
        setRentalMonths(Number.parseInt(searchParams.get("months") || "3"))

        // Get order ID from URL params or localStorage
        const orderIdParam = searchParams.get("orderId")
        if (orderIdParam) {
          setOrderId(Number.parseInt(orderIdParam))
        }

        // Calculate total amount
        const monthlyRent = listingData.daily_price || 0
        const subtotal = monthlyRent * rentalMonths
        const serviceFee = subtotal * 0.1
        const deliveryFee = 500 // Default logistics cost
        const total = subtotal + serviceFee + deliveryFee

        // Apply upfront discount if applicable
        if (paymentType === "upfront") {
          const upfrontDiscount = subtotal * 0.1
          setTotalAmount(total - upfrontDiscount)
        } else {
          setTotalAmount(monthlyRent) // For monthly, just show the first month's payment
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, paymentType, rentalMonths])

  const handlePaymentComplete = () => {
    // Redirect to KYC page
    if (orderId) {
      router.push(`/browse/${params.id}/kyc?orderId=${orderId}`)
    } else {
      router.push(`/browse/${params.id}/kyc`)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push(`/browse/${params.id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Item
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Secure payment for your rental</p>
        </div>

        <PaymentProcessor
          orderId={orderId || 0}
          amount={totalAmount}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => router.push(`/browse/${params.id}`)}
        />
      </div>
    </ProtectedRoute>
  )
}

