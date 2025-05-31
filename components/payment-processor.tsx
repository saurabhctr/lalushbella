"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, Smartphone, Loader2, CheckCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface PaymentProcessorProps {
  orderId: number
  amount: number
  onPaymentComplete?: () => void
  onCancel?: () => void
}

export default function PaymentProcessor({ orderId, amount, onPaymentComplete, onCancel }: PaymentProcessorProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    upiId: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.customer_id || !token) return

    // Validate form data
    if (paymentMethod === "card") {
      if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    } else if (paymentMethod === "upi") {
      if (!formData.upiId) {
        toast({
          title: "Missing Information",
          description: "Please enter your UPI ID",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)
    try {
      // In a real implementation, you would integrate with a payment gateway
      // For this demo, we'll simulate a payment process

      // Simulate API call to process payment
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update order status to "Payment Made"
      const response = await fetch(`${API_BASE_URL}/update_order_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          status: "Payment Made",
        }),
      })

      if (!response.ok) throw new Error("Failed to update order status")

      setIsComplete(true)
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully",
      })

      // Wait a moment before calling the completion callback
      setTimeout(() => {
        if (onPaymentComplete) {
          onPaymentComplete()
        }
      }, 1500)
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
          <p className="text-gray-600 mb-4">Your payment of ₹{amount.toFixed(2)} has been processed successfully.</p>
          <p className="text-gray-600">You will be redirected to the next step shortly...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>Choose your payment method to complete the rental</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">Payment Amount: ₹{amount.toFixed(2)}</p>
            <p className="text-sm text-blue-700 mt-1">Order ID: {orderId}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "card" | "upi")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" /> Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center cursor-pointer">
                  <Smartphone className="h-4 w-4 mr-2" /> UPI
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "card" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    type="password"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                placeholder="yourname@upi"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                You will receive a payment request on your UPI app. Please complete the payment within 5 minutes.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${amount.toFixed(2)}`
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

