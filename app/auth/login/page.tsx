"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Smartphone } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, verifyOtpAndLogin, isLoading, error } = useAuth()
  const [mobileNumber, setMobileNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mobileNumber || mobileNumber.length < 10) {
      return
    }

    try {
      await login(mobileNumber)
      setStep(2)
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length < 4) {
      return
    }

    try {
      await verifyOtpAndLogin(mobileNumber, otp)
      router.push("/dashboard")
    } catch (error) {
      console.error("OTP verification error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {step === 1 ? "Login to Your Account" : "Verify OTP"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1
                ? "Enter your mobile number to continue"
                : `We've sent a verification code to ${mobileNumber}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Smartphone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <Input
                      type="tel"
                      placeholder="Mobile Number"
                      className="pl-10"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-sm text-center text-gray-500">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => login(mobileNumber)}
                      disabled={isLoading}
                    >
                      Resend
                    </button>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </Button>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
                  Change Mobile Number
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

