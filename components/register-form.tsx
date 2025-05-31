"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Smartphone, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface RegisterFormProps {
  onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, verifyOtpAndLogin, resendOtp, isLoading, error, sessionId } = useAuth()
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    addresses: JSON.stringify([
      {
        type: "Home",
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        is_default: true,
      },
    ]),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const addresses = JSON.parse(formData.addresses)
    addresses[0][name] = value
    setFormData((prev) => ({ ...prev, addresses: JSON.stringify(addresses) }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (!formData.mobile_number || !formData.email) {
      setRegisterError("Mobile number and email are required")
      return
    }

    try {
      await register({
        mobile_number: formData.mobile_number,
        name: formData.name,
        email: formData.email,
        addresses: formData.addresses,
      })
      setStep(2)
    } catch (error) {
      console.error("Registration error:", error)
      setRegisterError(error instanceof Error ? error.message : "Registration failed. Please try again.")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (!otp) {
      setRegisterError("Please enter the OTP")
      return
    }

    try {
      // Make sure we're using the registration verification endpoint
      await verifyOtpAndLogin(formData.mobile_number, otp)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("OTP verification error:", error)
      setRegisterError(error instanceof Error ? error.message : "OTP verification failed. Please try again.")
    }
  }

  const handleResendOtp = async () => {
    try {
      await resendOtp()
      setRegisterError("OTP has been resent to your email and mobile number")
    } catch (error) {
      console.error("Resend OTP error:", error)
      setRegisterError(error instanceof Error ? error.message : "Failed to resend OTP. Please try again.")
    }
  }

  return (
    <div className="space-y-4 py-4">
      {step === 1 ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                className="pl-10"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="tel"
                name="mobile_number"
                placeholder="Mobile Number"
                className="pl-10"
                value={formData.mobile_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="email"
                name="email"
                placeholder="Email Address"
                className="pl-10"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Address</h3>
            <Input
              type="text"
              name="address_line1"
              placeholder="Address Line 1"
              onChange={handleAddressChange}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input type="text" name="city" placeholder="City" onChange={handleAddressChange} required />
              <Input type="text" name="state" placeholder="State" onChange={handleAddressChange} required />
            </div>
            <Input type="text" name="pincode" placeholder="Pincode" onChange={handleAddressChange} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>

          {(error || registerError) && <p className="text-sm text-red-500 text-center">{error || registerError}</p>}
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
            {isLoading ? "Verifying..." : "Verify & Complete Registration"}
          </Button>

          {(error || registerError) && <p className="text-sm text-red-500 text-center">{error || registerError}</p>}

          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
            Edit Registration Details
          </Button>
        </form>
      )}
    </div>
  )
}

