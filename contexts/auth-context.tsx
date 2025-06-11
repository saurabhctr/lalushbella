"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type User, loginUser, registerUser, verifyOtp, API_BASE_URL } from "@/lib/api"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  sessionId: string | null
  login: (mobile: string, email?: string) => Promise<void>
  register: (userData: Partial<User>) => Promise<void>
  verifyOtpAndLogin: (mobile: string, otp: string) => Promise<void>
  resendOtp: () => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentMobile, setCurrentMobile] = useState<string>("")

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (err) {
        console.error("Error parsing stored user:", err)
        // Clear invalid storage
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (mobile: string, email?: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentMobile(mobile)

    try {
      const response = await loginUser(mobile)
      console.log("Login response:", response)

      // Store the session ID for OTP verification
      if (response.session_id) {
        setSessionId(response.session_id)
      }

      // If user is new, suggest registration
      if (response.is_new_user) {
        setError("User not found. Please register first.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: Partial<User>) => {
    setIsLoading(true)
    setError(null)
    setCurrentMobile(userData.mobile_number || "")

    try {
      const response = await registerUser(userData)
      console.log("Register response:", response)

      // Store the session ID for OTP verification
      if (response.session_id) {
        setSessionId(response.session_id)
      }
    } catch (err) {
      console.error("Registration error:", err)
      if (err instanceof Error && err.message.includes("User already exists")) {
        // If user already exists, don't show an error, just return
        setIsLoading(false)
        return
      }
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtpAndLogin = async (mobile: string, otp: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the stored session ID for verification
      if (!sessionId) {
        throw new Error("Session expired. Please request a new OTP.")
      }

      // Determine if this is a login or registration verification
      // We need to check if we're in a registration flow or login flow
      const endpoint = currentMobile === mobile ? "verify_login_otp" : "verify_register_otp"

      const result = await verifyOtp(sessionId, otp, endpoint)
      setUser(result.user)
      setToken(result.token)

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(result.user))
      localStorage.setItem("token", result.token)

      // Clear session ID after successful verification
      setSessionId(null)
    } catch (err) {
      console.error("OTP verification error:", err)
      setError(err instanceof Error ? err.message : "OTP verification failed. Please try again.")
      throw err // Re-throw to handle in the component
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!sessionId) {
        throw new Error("Session expired. Please start over.")
      }

      // Call the resend OTP endpoint with the new API base URL
      const response = await fetch(`${API_BASE_URL}/resend_otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to resend OTP")
      }

      const data = await response.json()
      console.log("Resend OTP response:", data)

      // Update session ID if a new one is provided
      if (data.session_id) {
        setSessionId(data.session_id)
      }

      return data
    } catch (err) {
      console.error("Resend OTP error:", err)
      setError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!user || !token) {
        throw new Error("User not authenticated")
      }

      // In a real app, this would call an API to update the user
      // For now, we'll just update the local state
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)

      // Update in localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (err) {
      console.error("Update user error:", err)
      setError(err instanceof Error ? err.message : "Failed to update user. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setSessionId(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  const value = {
    user,
    token,
    isLoading,
    error,
    sessionId,
    login,
    register,
    verifyOtpAndLogin,
    resendOtp,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
