"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Mail, Smartphone, User } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register, verifyOtpAndLogin, isLoading, error } = useAuth()
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
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)

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

  // Update the handleRegister function to match the API
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await register({
        mobile_number: formData.mobile_number,
        name: formData.name,
        email: formData.email,
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
      setStep(2)
    } catch (error) {
      console.error("Registration error:", error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length < 4) {
      return
    }

    try {
      await verifyOtpAndLogin(formData.mobile_number, otp)
      router.push("/dashboard")
    } catch (error) {
      console.error("OTP verification error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {step === 1 ? "Create an Account" : "Verify OTP"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1
                ? "Enter your details to register"
                : `We've sent a verification code to ${formData.mobile_number}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <Smartphone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={18}
                    />
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
                      onClick={() => register(formData)}
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
                  Edit Registration Details
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

