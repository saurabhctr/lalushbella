"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import PaymentAccountsManager from "./payment-accounts-manager"
import { createPayout } from "@/lib/api"

interface LenderPayoutFormProps {
  orderId: number
  amount: number
  onSuccess?: () => void
  onCancel?: () => void
}

export default function LenderPayoutForm({ orderId, amount, onSuccess, onCancel }: LenderPayoutFormProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showAccountManager, setShowAccountManager] = useState(true)

  const handleAccountSelected = (accountId: number) => {
    setSelectedAccountId(accountId)
    setShowAccountManager(false)
  }

  const handleCreatePayout = async () => {
    if (!selectedAccountId || !token || !user?.customer_id) return

    setIsProcessing(true)
    try {
      const result = await createPayout(
        {
          order_id: orderId,
          account_id: selectedAccountId,
          amount: amount,
        },
        token,
      )

      setIsComplete(true)
      toast({
        title: "Payout Setup Complete",
        description:
          "Your payout has been set up successfully. You will receive the payment once the rental period is complete.",
      })

      // Wait a moment before calling the success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
    } catch (error) {
      console.error("Error setting up payout:", error)
      toast({
        title: "Error",
        description: "Failed to set up payout. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  if (showAccountManager) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Up Payout</CardTitle>
            <CardDescription>Select or add a verified payment account to receive your rental earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-green-800">Payout Amount</h3>
                  <p className="text-2xl font-bold text-green-700">₹{amount.toFixed(2)}</p>
                  <p className="text-sm text-green-600 mt-1">
                    This amount will be transferred to your selected account after the rental period is complete.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentAccountsManager onAccountSelected={handleAccountSelected} requireVerified={true} />
      </div>
    )
  }

  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payout Setup Complete</h2>
          <p className="text-gray-600 mb-4">Your payout of ₹{amount.toFixed(2)} has been set up successfully.</p>
          <p className="text-gray-600">
            You will receive the payment in your account once the rental period is complete.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Payout Details</CardTitle>
        <CardDescription>Review and confirm your payout details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-green-800">Payout Amount</h3>
              <p className="text-2xl font-bold text-green-700">₹{amount.toFixed(2)}</p>
              <p className="text-sm text-green-600 mt-1">
                This amount will be transferred to your selected account after the rental period is complete.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Important Information</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            <li>Payouts are processed within 3-5 business days after the rental period ends</li>
            <li>A platform fee of 10% has already been deducted from your payout amount</li>
            <li>You can track the status of your payout in the dashboard</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setShowAccountManager(true)} disabled={isProcessing}>
          Change Account
        </Button>
        <Button onClick={handleCreatePayout} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Payout Details"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

