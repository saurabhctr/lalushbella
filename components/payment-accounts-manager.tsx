"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import PaymentAccountForm from "./payment-account-form"
import PaymentVerification from "./payment-verification"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

interface PaymentAccountsManagerProps {
  onAccountSelected?: (accountId: number) => void
  requireVerified?: boolean
}

export default function PaymentAccountsManager({
  onAccountSelected,
  requireVerified = true,
}: PaymentAccountsManagerProps) {
  const { token, user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null)

  // Fetch user's payment accounts
  const fetchAccounts = async () => {
    if (!user?.customer_id || !token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.customer_id}/payment_accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch payment accounts")

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error("Error fetching payment accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load payment accounts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user?.customer_id, token, toast])

  // Handle account deletion
  const deleteAccount = async (accountId: number) => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/payment_accounts/${accountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete payment account")

      toast({
        title: "Account Deleted",
        description: "Your payment account has been deleted successfully",
      })

      // Refresh accounts list
      fetchAccounts()
    } catch (error) {
      console.error("Error deleting payment account:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAccountToDelete(null)
    }
  }

  // Handle account selection
  const handleAccountSelect = (accountId: number) => {
    if (requireVerified) {
      const account = accounts.find((acc) => acc.account_id === accountId)
      if (account && !account.is_verified) {
        setSelectedAccountId(accountId)
        setShowVerification(true)
        return
      }
    }

    if (onAccountSelected) {
      onAccountSelected(accountId)
    }
  }

  // Handle verification completion
  const handleVerificationComplete = (accountId: number) => {
    fetchAccounts()
    setShowVerification(false)

    if (onAccountSelected) {
      onAccountSelected(accountId)
    }
  }

  // Handle account addition
  const handleAccountAdded = (accountId: number) => {
    fetchAccounts()
    setShowAddForm(false)

    // If verification is required, show verification screen
    if (requireVerified) {
      setSelectedAccountId(accountId)
      setShowVerification(true)
    } else if (onAccountSelected) {
      onAccountSelected(accountId)
    }
  }

  // Render account form
  if (showAddForm) {
    return <PaymentAccountForm onSuccess={handleAccountAdded} onCancel={() => setShowAddForm(false)} />
  }

  // Render verification screen
  if (showVerification) {
    return (
      <PaymentVerification
        initialAccountId={selectedAccountId || undefined}
        onVerificationComplete={handleVerificationComplete}
      />
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Accounts</CardTitle>
              <CardDescription>Manage your payment accounts for receiving rental payments</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any payment accounts yet</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Payment Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.account_id}
                  className="flex items-center justify-between border p-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="mr-2">
                        {account.is_verified ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        {account.account_type === "BANK" ? (
                          <>
                            <p className="font-medium">
                              {account.account_name}{" "}
                              {account.is_primary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {account.bank_name} -{" "}
                              {account.account_number?.slice(-4).padStart(account.account_number.length, "*")}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">
                              UPI ID{" "}
                              {account.is_primary && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{account.upi_id}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!account.is_verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccountId(account.account_id)
                          setShowVerification(true)
                        }}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant={account.is_verified || !requireVerified ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAccountSelect(account.account_id)}
                      disabled={requireVerified && !account.is_verified}
                    >
                      Select
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAccountToDelete(account.account_id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={accountToDelete !== null} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToDelete && deleteAccount(accountToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

