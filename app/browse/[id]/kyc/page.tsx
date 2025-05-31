"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Shield, Upload, User } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { updateKycStatus, updateOrderStatus, uploadImage } from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"
import { Checkbox } from "@/components/ui/checkbox"

export default function KYCPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [idType, setIdType] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [idImage, setIdImage] = useState<string | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [skipDocuments, setSkipDocuments] = useState(false)

  useEffect(() => {
    // Get order ID from URL params
    const searchParams = new URLSearchParams(window.location.search)
    const orderIdParam = searchParams.get("orderId")
    if (orderIdParam) {
      setOrderId(Number.parseInt(orderIdParam))
    }
  }, [])

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && token) {
      setUploadingImage(true)
      try {
        const result = await uploadImage(e.target.files[0], token)
        setIdImage(result.url)
      } catch (error) {
        console.error("Error uploading ID image:", error)
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && token) {
      setUploadingImage(true)
      try {
        const result = await uploadImage(e.target.files[0], token)
        setSelfieImage(result.url)
      } catch (error) {
        console.error("Error uploading selfie image:", error)
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleComplete = async () => {
    if (!user || !token) {
      router.push("/auth/login")
      return
    }

    // Validate required fields if not skipping documents
    if (!skipDocuments && (!idType || !idNumber)) {
      alert("Please fill in the required ID information")
      return
    }

    setIsSubmitting(true)
    try {
      // Get the order ID either from state or params
      const currentOrderId = orderId || Number.parseInt(params.id)

      // Update KYC status
      await updateKycStatus(
        user.customer_id,
        {
          id_type: idType,
          id_number: idNumber,
          id_image: idImage || "",
          selfie_image: selfieImage || "",
          skip_documents: skipDocuments,
        },
        token,
      )

      // Update order status to KYC Done
      await updateOrderStatus(currentOrderId, "KYC Done", token)

      // Redirect to scheduling page
      router.push(`/browse/${params.id}/schedule?orderId=${currentOrderId}`)
    } catch (error) {
      console.error("Error completing KYC:", error)
      alert("Failed to complete verification. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push(`/browse/${params.id}/payment`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Identity Verification</h1>
          <p className="text-gray-600 mt-2">Complete verification to finalize your rental</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
            <CardDescription>We need to verify your identity for security purposes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Why we need this</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your ID helps us verify your identity and protect both lenders and borrowers. All information is
                  encrypted and securely stored.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-documents"
                checked={skipDocuments}
                onCheckedChange={(checked) => setSkipDocuments(checked as boolean)}
              />
              <Label htmlFor="skip-documents">Skip document verification for now (you can complete this later)</Label>
            </div>

            {!skipDocuments && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id-type">
                    ID Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger id="id-type">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver-license">Driver's License</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="national-id">National ID Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id-number">
                    ID Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id-number"
                    placeholder="Enter your ID number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload ID Document (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {idImage ? (
                      <div className="relative">
                        <img
                          src={idImage || "/placeholder.svg"}
                          alt="ID Document"
                          className="max-h-40 mx-auto rounded-md"
                        />
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setIdImage(null)}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload ID Document</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Please upload a clear photo of your {idType || "ID document"}
                        </p>
                        <label htmlFor="id-upload" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            <Upload className="h-4 w-4 mr-2" /> {uploadingImage ? "Uploading..." : "Select File"}
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="id-upload"
                            onChange={handleIdUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Take a Selfie (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {selfieImage ? (
                      <div className="relative">
                        <img
                          src={selfieImage || "/placeholder.svg"}
                          alt="Selfie"
                          className="max-h-40 mx-auto rounded-md"
                        />
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setSelfieImage(null)}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <User className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Take a Selfie</h3>
                        <p className="text-sm text-gray-500 mb-4">Please upload a clear photo of your face</p>
                        <label htmlFor="selfie-upload" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            <Upload className="h-4 w-4 mr-2" /> {uploadingImage ? "Uploading..." : "Select File"}
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="selfie-upload"
                            onChange={handleSelfieUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <Checkbox id="terms" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I confirm that all information provided is accurate and I agree to the rental terms and conditions
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Complete Verification"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

