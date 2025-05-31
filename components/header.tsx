"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoginForm from "@/components/login-form"
import RegisterForm from "@/components/register-form"

export default function Header() {
  const { user, logout } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OAL-p4MblWKmpjU8hZ12BuTgPzQ7uGzlol.png"
            alt="OneAssist Logo"
            className="h-8"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/browse" className="text-gray-700 hover:text-purple-600">
            Browse
          </Link>
          <Link href="/lend" className="text-gray-700 hover:text-purple-600">
            Lend
          </Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-purple-600">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-gray-600">Hello, {user.name || "User"}</span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => setAuthDialogOpen(true)}>Login / Register</Button>
          )}
        </div>
      </div>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Access</DialogTitle>
            <DialogDescription>Login or create a new account to continue</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={() => setAuthDialogOpen(false)} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </header>
  )
}

