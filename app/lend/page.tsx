"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { createListing, uploadImage, calculateRent } from "@/lib/api"
import ProtectedRoute from "@/components/protected-route"

const PRODUCT_TYPES = [
  { value: "AC", label: "Air Conditioner" },
  { value: "TV", label: "Television" },
  { value: "Refrigerator", label: "Refrigerator" },
  { value: "Microwave", label: "Microwave" },
  { value: "Bed", label: "Bed" },
  { value: "Sofa", label: "Sofa" },
  { value: "Table", label: "Table" },
  { value: "Chair", label: "Chair" },
  { value: "PlayStation", label: "PlayStation" },
]

export default function LendPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [step, setStep] = useState(1)
  const [images, setImages] = useState<{ [key: string]: string }>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({})
  const [videoUrl, setVideoUrl] = useState("")
  const [aiPrice, setAiPrice] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    customer_id: user?.customer_id || 0,
    product_type: "",
    purchase_date: "",
    invoice_value: 0,
    brand: "",
    model_name: "",
    location_pincode: user?.addresses && user.addresses.length > 0 ? user.addresses[0].pincode : "",
    status: "Active",
    daily_price: 0,
    suggestedPrice: 0,
    finalPrice: 0,
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    weight_kg: 0,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true)
      try {
        const file = e.target.files[0]
        if (token) {
          const result = await uploadImage(file, token)
          setImages({
            ...images,
            [type]: result.url,
          })
        }
      } catch (error) {
        console.error("Error uploading image:", error)
      } finally {
        setUploadingImages(false)
      }
    }
  }

  const removeImage = (type: string) => {
    const newImages = { ...images }
    delete newImages[type]
    setImages(newImages)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async () => {
    if (!token) {
      router.push("/auth/login")
      return
    }

    try {
      // Process images - convert to comma-separated URLs if any exist
      let imagesString = undefined
      if (Object.keys(images).length > 0) {
        imagesString = Object.values(images).join(",")
      }

      // Create listing with API
      const listingData = {
        customer_id: user?.customer_id,
        product_type: formData.product_type,
        purchase_date: formData.purchase_date,
        invoice_value: formData.invoice_value,
        brand: formData.brand,
        model_name: formData.model_name,
        images: imagesString,
        location_pincode: formData.location_pincode,
        status: "Active" as const,
        daily_price: aiPrice || 0,
        length_cm: formData.length_cm,
        width_cm: formData.width_cm,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg || 10, // Default weight if not provided
      }

      await createListing(listingData, token)
      router.push("/lend/success")
    } catch (error) {
      console.error("Error creating listing:", error)
    }
  }

  // Calculate AI price using the calculateRent API
  const calculateAIPrice = async () => {
    try {
      // Get the front image URL if available
      const imageUrl = images.front || Object.values(images)[0] || ""

      // Call the calculateRent API
      const response = await calculateRent({
        invoice_value: formData.invoice_value,
        purchase_date: formData.purchase_date,
        image_url: imageUrl,
      })

      let calculatedRent = response.monthly_rent || 0

      // If the calculated rent is too low (likely a daily price), multiply by 30
      if (calculatedRent < 100) {
        calculatedRent = calculatedRent * 30
      }

      // Set the AI price (this is monthly)
      setAiPrice(calculatedRent)
      setFormData({
        ...formData,
        suggestedPrice: calculatedRent,
        finalPrice: calculatedRent,
      })
    } catch (error) {
      console.error("Error calculating AI price:", error)

      // Fallback calculation if API fails
      const purchaseDate = new Date(formData.purchase_date)
      const ageInMonths = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const depreciationFactor = Math.max(0.5, 1 - ageInMonths * 0.01)
      const basePrice = formData.invoice_value * 0.03 * depreciationFactor

      setAiPrice(Math.round(basePrice))
      setFormData({
        ...formData,
        suggestedPrice: Math.round(basePrice),
        finalPrice: Math.round(basePrice),
      })
    }
  }

  const nextStep = () => {
    if (step === 1) {
      // Check if dimensions are provided
      if (!formData.length_cm || !formData.width_cm || !formData.height_cm) {
        alert("Please provide the item dimensions")
        return
      }
    }

    if (step === 2) {
      calculateAIPrice()
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">List Your Item for Rent</h1>
          <p className="text-gray-600 mt-2">Share your furniture or appliances and earn passive income</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  i <= step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
            ))}
            <div className="absolute h-1 bg-gray-200 top-4 left-0 right-0 -z-0"></div>
            <div
              className="absolute h-1 bg-purple-600 top-4 left-0 -z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Item Details</span>
            <span>Media</span>
            <span>Pricing</span>
            <span>Review</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Provide basic information about your item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">Product Type</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("product_type", value)}
                  value={formData.product_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="e.g., Samsung, IKEA"
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model_name">Model Name (Optional)</Label>
                <Input
                  id="model_name"
                  name="model_name"
                  placeholder="e.g., Galaxy S21, MALM"
                  value={formData.model_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_value">Invoice Value (₹)</Label>
                  <Input
                    id="invoice_value"
                    name="invoice_value"
                    type="number"
                    placeholder="Original purchase price"
                    value={formData.invoice_value || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_pincode">Location Pincode</Label>
                <Input
                  id="location_pincode"
                  name="location_pincode"
                  placeholder="e.g., 110001"
                  value={formData.location_pincode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="font-medium">Item Dimensions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="length_cm">Length (cm)</Label>
                    <Input
                      id="length_cm"
                      name="length_cm"
                      type="number"
                      placeholder="Length in cm"
                      value={formData.length_cm || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width_cm">Width (cm)</Label>
                    <Input
                      id="width_cm"
                      name="width_cm"
                      type="number"
                      placeholder="Width in cm"
                      value={formData.width_cm || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <Input
                      id="height_cm"
                      name="height_cm"
                      type="number"
                      placeholder="Height in cm"
                      value={formData.height_cm || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      name="weight_kg"
                      type="number"
                      placeholder="Weight in kg"
                      value={formData.weight_kg || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={nextStep}
                disabled={
                  !formData.product_type ||
                  !formData.brand ||
                  !formData.purchase_date ||
                  !formData.invoice_value ||
                  !formData.location_pincode ||
                  !formData.length_cm ||
                  !formData.width_cm ||
                  !formData.height_cm
                }
              >
                Continue to Media
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Upload photos of your item from different angles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["front", "back", "left", "right", "top", "bottom"].map((angle) => (
                  <div key={angle} className="space-y-2">
                    <Label htmlFor={`image-${angle}`} className="capitalize">
                      {angle} View
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {images[angle] ? (
                        <div className="relative">
                          <img
                            src={images[angle] || "/placeholder.svg"}
                            alt={`${angle} view`}
                            className="max-h-40 mx-auto rounded-md"
                          />
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => removeImage(angle)}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">Upload {angle} view</p>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`image-${angle}`}
                              onChange={(e) => handleImageUpload(e, angle)}
                              disabled={uploadingImages}
                            />
                            <Label htmlFor={`image-${angle}`}>
                              <Button variant="outline" className="cursor-pointer w-full" disabled={uploadingImages}>
                                {uploadingImages ? "Uploading..." : "Select Image File"}
                              </Button>
                            </Label>

                            <div className="text-center my-2">
                              <span className="text-sm text-gray-500">OR</span>
                            </div>

                            <div className="flex space-x-2">
                              <Input
                                type="url"
                                placeholder="Paste image URL"
                                value={imageUrls[angle] || ""}
                                onChange={(e) => {
                                  const newImageUrls = { ...imageUrls }
                                  newImageUrls[angle] = e.target.value
                                  setImageUrls(newImageUrls)
                                }}
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (imageUrls[angle]) {
                                    setImages({
                                      ...images,
                                      [angle]: imageUrls[angle],
                                    })
                                  }
                                }}
                                disabled={!imageUrls[angle]}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Continue to Pricing</Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>AI-powered pricing suggestion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-2">AI-Calculated Monthly Rent</h3>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-purple-700">₹{aiPrice || "Calculating..."}</span>
                  <span className="text-purple-600 ml-1">/month</span>
                </div>
                <p className="text-sm text-purple-600 mt-2">
                  Based on product type, age, condition, and market demand. This price will be used for your listing.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="weekend-pricing" />
                    <Label htmlFor="weekend-pricing">Enable weekend pricing</Label>
                  </div>
                  <span className="text-sm text-gray-500">+20%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="long-term-discount" />
                    <Label htmlFor="long-term-discount">Long-term rental discount</Label>
                  </div>
                  <span className="text-sm text-gray-500">-15%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id="security-deposit" defaultChecked disabled />
                    <Label htmlFor="security-deposit">Security deposit (1.2x monthly rent)</Label>
                  </div>
                  <span className="text-sm text-gray-500">₹{aiPrice ? (aiPrice * 1.2).toFixed(0) : 0}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Platform fee (10%)</span>
                  <span className="font-medium">₹{aiPrice ? (aiPrice * 0.1).toFixed(2) : "0.00"}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>You earn per month</span>
                  <span>₹{aiPrice ? (aiPrice * 0.9).toFixed(2) : "0.00"}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Review Listing</Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Listing</CardTitle>
              <CardDescription>Make sure everything looks good before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Item Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Product Type</dt>
                      <dd className="font-medium">
                        {PRODUCT_TYPES.find((t) => t.value === formData.product_type)?.label || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Brand</dt>
                      <dd className="font-medium capitalize">{formData.brand || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Model</dt>
                      <dd className="font-medium capitalize">{formData.model_name || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Purchase Date</dt>
                      <dd className="font-medium">{formData.purchase_date || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Invoice Value</dt>
                      <dd className="font-medium">₹{formData.invoice_value}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Location</dt>
                      <dd className="font-medium">Pincode: {formData.location_pincode}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium text-lg mb-4">Pricing</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Monthly Rate</dt>
                      <dd className="font-medium">₹{aiPrice || 0}/month</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Security Deposit</dt>
                      <dd className="font-medium">₹{aiPrice ? aiPrice * 2 : 0}</dd>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <dt className="text-gray-500">You Earn (per month)</dt>
                      <dd className="font-bold text-green-600">₹{aiPrice ? (aiPrice * 0.9).toFixed(2) : "0.00"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {Object.keys(images).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-4">Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {Object.entries(images).map(([angle, url]) => (
                      <div key={angle} className="relative">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`${angle} view`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded capitalize">
                          {angle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button onClick={handleSubmit}>Publish Listing</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

