"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"
import PaymentAccountsManager from "@/components/payment-accounts-manager"
import PaymentVerification from "@/components/payment-verification"

export default function PaymentSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("accounts")

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-gray-600 mt-2">Manage your payment accounts and verification</p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="accounts">Payment Accounts</TabsTrigger>
            <TabsTrigger value="verification">Account Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <PaymentAccountsManager requireVerified={false} />
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Verification</CardTitle>
                <CardDescription>
                  Verify your payment accounts to receive rental payments. Verified accounts are required for payouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-blue-800 mb-2">Why verify your account?</h3>
                  <p className="text-sm text-blue-700">
                    Account verification helps ensure that your rental earnings are sent to the correct account. We use
                    a secure penny drop method to verify your bank account details.
                  </p>
                </div>
              </CardContent>
            </Card>

            <PaymentVerification />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

