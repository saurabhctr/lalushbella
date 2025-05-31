"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface PaymentAccountFormProps {
  onSuccess?: (accountId: number) => void
  onCancel?: () => void
}

export default function PaymentAccountForm({ onSuccess, onCancel }: PaymentAccountFormProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [accountType, setAccountType] = useState<"BANK" | "UPI">("BANK")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrimary, setIsPrimary] = useState(true)
  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.customer_id || !token) return

    // Validate form data
    if (accountType === "BANK") {
      if (!formData.account_name || !formData.bank_name || !formData.account_number || !formData.ifsc_code) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    } else if (accountType === "UPI") {
      if (!formData.upi_id) {
        toast({
          title: "Missing Information",
          description: "Please enter your UPI ID",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Prepare request data
      const requestData = {
        customer_id: user.customer_id,
        account_type: accountType,
        is_primary: isPrimary,
        ...(accountType === "BANK"
          ? {
              account_name: formData.account_name,
              bank_name: formData.bank_name,
              account_number: formData.account_number,
              ifsc_code: formData.ifsc_code,
            }
          : {
              upi_id: formData.upi_id,
            }),
      }

      // Send request to API
      const response = await fetch(`${API_BASE_URL}/payment_accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) throw new Error("Failed to add payment account")

      const data = await response.json()

      toast({
        title: "Account Added",
        description: "Your payment account has been added successfully",
      })

      // Call onSuccess callback with the new account ID
      if (onSuccess) {
        onSuccess(data.account_id)
      }
    } catch (error) {
      console.error("Error adding payment account:", error)
      toast({
        title: "Error",
        description: "Failed to add payment account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment Account</CardTitle>
        <CardDescription>Add your bank account or UPI ID to receive payments</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Account Type</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(value) => setAccountType(value as "BANK" | "UPI")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BANK" id="bank" />
                <Label htmlFor="bank">Bank Account</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UPI" id="upi" />
                <Label htmlFor="upi">UPI ID</Label>
              </div>
            </RadioGroup>
          </div>

          {accountType === "BANK" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Holder Name</Label>
                <Input
                  id="account_name"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                name="upi_id"
                placeholder="yourname@upi"
                value={formData.upi_id}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch id="is_primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
            <Label htmlFor="is_primary">Set as primary payment account</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

