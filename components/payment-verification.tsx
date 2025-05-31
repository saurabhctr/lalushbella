"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface PaymentAccount {
  account_id: number
  account_type: "BANK" | "UPI"
  account_name?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  upi_id?: string
  is_verified: boolean
  verification_status?: string
  is_primary: boolean
}

interface PaymentVerificationProps {
  onVerificationComplete?: (accountId: number) => void
  initialAccountId?: number
}

export default function PaymentVerification({ onVerificationComplete, initialAccountId }: PaymentVerificationProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(initialAccountId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationId, setVerificationId] = useState<number | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Fetch user's payment accounts
  useEffect(() => {
    if (!user?.customer_id || !token) return

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${user.customer_id}/payment_accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch payment accounts")

        const data = await response.json()
        setAccounts(data.accounts || [])

        // If no account is selected and we have accounts, select the first unverified one
        if (!selectedAccountId && data.accounts?.length > 0) {
          const unverifiedAccount = data.accounts.find((acc: PaymentAccount) => !acc.is_verified)
          if (unverifiedAccount) {
            setSelectedAccountId(unverifiedAccount.account_id)
          } else {
            setSelectedAccountId(data.accounts[0].account_id)
          }
        }
      } catch (error) {
        console.error("Error fetching payment accounts:", error)
        toast({
          title: "Error",
          description: "Failed to load payment accounts. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchAccounts()
  }, [user?.customer_id, token, toast, selectedAccountId])

  // Initiate penny drop verification
  const initiateVerification = async () => {
    if (!selectedAccountId || !token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/verify_account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_id: selectedAccountId }),
      })

      if (!response.ok) throw new Error("Failed to initiate verification")

      const data = await response.json()
      setVerificationId(data.verification_id)
      setVerificationStatus(data.status)

      toast({
        title: "Verification Initiated",
        description: "Account verification has been initiated. This may take a few minutes.",
      })

      // Start polling for status updates
      setIsPolling(true)
    } catch (error) {
      console.error("Error initiating verification:", error)
      toast({
        title: "Verification Failed",
        description: "Failed to initiate account verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for verification status
  useEffect(() => {
    if (!verificationId || !isPolling || !token) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/verification_status/${verificationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("Failed to check verification status")

        const data = await response.json()
        setVerificationStatus(data.status)

        // If verification is complete or failed, stop polling
        if (data.status === "Completed" || data.status === "Failed") {
          setIsPolling(false)
          clearInterval(pollInterval)

          // Refresh accounts list to get updated verification status
          if (user?.customer_id) {
            const accountsResponse = await fetch(`${API_BASE_URL}/users/${user.customer_id}/payment_accounts`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (accountsResponse.ok) {
              const accountsData = await accountsResponse.json()
              setAccounts(accountsData.accounts || [])
            }
          }

          // Show appropriate toast
          if (data.status === "Completed") {
            toast({
              title: "Verification Successful",
              description: "Your account has been successfully verified.",
              variant: "default",
            })
            if (onVerificationComplete && selectedAccountId) {
              onVerificationComplete(selectedAccountId)
            }
          } else {
            toast({
              title: "Verification Failed",
              description: "Account verification failed. Please try again or use a different account.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error)
        setIsPolling(false)
        clearInterval(pollInterval)
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(pollInterval)
  }, [verificationId, isPolling, token, toast, user?.customer_id, onVerificationComplete, selectedAccountId])

  // Get the selected account
  const selectedAccount = accounts.find((acc) => acc.account_id === selectedAccountId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Verification</CardTitle>
        <CardDescription>Verify your payment account to receive rental payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {accounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No payment accounts found. Please add a payment account first.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select Account to Verify</Label>
              <RadioGroup
                value={selectedAccountId?.toString()}
                onValueChange={(value) => setSelectedAccountId(Number(value))}
              >
                {accounts.map((account) => (
                  <div
                    key={account.account_id}
                    className="flex items-center justify-between space-x-2 border p-4 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={account.account_id.toString()} id={`account-${account.account_id}`} />
                      <Label htmlFor={`account-${account.account_id}`} className="flex-1">
                        {account.account_type === "BANK" ? (
                          <div>
                            <p className="font-medium">{account.account_name}</p>
                            <p className="text-sm text-gray-500">
                              {account.bank_name} -{" "}
                              {account.account_number?.slice(-4).padStart(account.account_number.length, "*")}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">UPI ID</p>
                            <p className="text-sm text-gray-500">{account.upi_id}</p>
                          </div>
                        )}
                      </Label>
                    </div>
                    {account.is_verified ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="text-amber-600 text-sm">Not Verified</div>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {selectedAccount && !selectedAccount.is_verified && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Verification Process</h3>
                <p className="text-sm text-blue-700 mb-4">
                  {selectedAccount.account_type === "BANK"
                    ? "We'll send a small amount (₹1) to your bank account to verify it. This amount will be refunded to you."
                    : "We'll verify your UPI ID through a verification request."}
                </p>
                <p className="text-sm text-blue-700">
                  Verification usually takes 1-2 minutes but may take longer in some cases.
                </p>
              </div>
            )}

            {verificationStatus && (
              <div
                className={`p-4 rounded-lg ${
                  verificationStatus === "Completed"
                    ? "bg-green-50 text-green-800"
                    : verificationStatus === "Failed"
                      ? "bg-red-50 text-red-800"
                      : "bg-amber-50 text-amber-800"
                }`}
              >
                <div className="flex items-center">
                  {verificationStatus === "Completed" ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : verificationStatus === "Failed" ? (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  )}
                  <span>
                    {verificationStatus === "Completed"
                      ? "Verification completed successfully"
                      : verificationStatus === "Failed"
                        ? "Verification failed"
                        : "Verification in progress..."}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        {selectedAccount && !selectedAccount.is_verified && (
          <Button
            onClick={initiateVerification}
            disabled={isLoading || isPolling || !selectedAccountId}
            className="w-full"
          >
            {isLoading || isPolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPolling ? "Verifying..." : "Initiating Verification..."}
              </>
            ) : (
              "Verify Account"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

