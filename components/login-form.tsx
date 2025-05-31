"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smartphone, Mail } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface LoginFormProps {
  onSuccess?: () => void
  defaultMobileNumber?: string
}

export default function LoginForm({ onSuccess, defaultMobileNumber = "" }: LoginFormProps) {
  const { login, verifyOtpAndLogin, resendOtp, isLoading, error, sessionId } = useAuth()
  const [mobileNumber, setMobileNumber] = useState(defaultMobileNumber)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    if (!mobileNumber || mobileNumber.length < 10) {
      setLoginError("Please enter a valid mobile number")
      return
    }

    try {
      await login(mobileNumber, email)
      setStep(2)
    } catch (error) {
      console.error("Login error:", error)
      setLoginError(error instanceof Error ? error.message : "Login failed. Please try again.")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    if (!otp) {
      setLoginError("Please enter the OTP")
      return
    }

    try {
      // Make sure we're using the login verification endpoint
      await verifyOtpAndLogin(mobileNumber, otp)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("OTP verification error:", error)
      setLoginError(error instanceof Error ? error.message : "OTP verification failed. Please try again.")
    }
  }

  const handleResendOtp = async () => {
    try {
      await resendOtp()
      setLoginError("OTP has been resent to your email and mobile number")
    } catch (error) {
      console.error("Resend OTP error:", error)
      setLoginError(error instanceof Error ? error.message : "Failed to resend OTP. Please try again.")
    }
  }

  return (
    <div className="space-y-4 py-4">
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
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

          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="email"
                placeholder="Email (optional)"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>

          {(error || loginError) && <p className="text-sm text-red-500 text-center">{error || loginError}</p>}
          <p className="text-xs text-gray-500 text-center">For demo, use any mobile number and OTP: 987654 or 1234</p>
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
              We've sent a verification code to your email and mobile number.
            </p>
            <p className="text-sm text-center text-gray-500">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={handleResendOtp}
                disabled={isLoading || !sessionId}
              >
                Resend
              </button>
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify & Login"}
          </Button>

          {(error || loginError) && <p className="text-sm text-red-500 text-center">{error || loginError}</p>}

          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
            Change Mobile Number
          </Button>
        </form>
      )}
    </div>
  )
}

