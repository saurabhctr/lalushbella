"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, DollarSign } from "lucide-react"

interface BankDetailsFormProps {
  orderId: number
  rentalAmount: number
  onSuccess?: () => void
}

export default function BankDetailsForm({ orderId, rentalAmount, onSuccess }: BankDetailsFormProps) {
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi">("bank")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, this would call an API to save the bank details
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Payment details submitted",
        description: "Your payment details have been saved successfully.",
        variant: "default",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error submitting payment details:", error)
      toast({
        title: "Error",
        description: "Failed to submit payment details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Add your payment details to receive rental payments for order #{orderId}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">Rental Amount</h3>
                <p className="text-green-700 text-lg font-bold">₹{rentalAmount.toFixed(2)}</p>
                <p className="text-sm text-green-600 mt-1">
                  This amount will be transferred to your account after the rental period is complete.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "bank" | "upi")}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" /> Bank Account
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi">UPI</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "bank" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Holder Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  name="upiId"
                  placeholder="yourname@upi"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Payment Details"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

