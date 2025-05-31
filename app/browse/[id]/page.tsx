"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MapPin, MessageCircle, Share, Star, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  getListingById,
  type Listing,
  calculateLogisticsCost as calculateLogisticsCostApi,
  calculateRent,
} from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

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

const RENTAL_PERIODS = [
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 9, label: "9 Months" },
  { value: 12, label: "12 Months" },
]

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [rentalMonths, setRentalMonths] = useState(3)
  const [paymentType, setPaymentType] = useState<"monthly" | "upfront">("monthly")
  const [step, setStep] = useState(1)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [logisticsCost, setLogisticsCost] = useState<number | null>(null)
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true)
      try {
        const data = await getListingById(Number.parseInt(params.id))
        setListing(data)

        // Extract image URLs from the images string or object
        if (data.images) {
          let urls: string[] = []
          if (typeof data.images === "string") {
            urls = data.images.split(",").filter((url) => url.trim() !== "")
          } else if (typeof data.images === "object") {
            urls = Object.values(data.images).filter((url) => url) as string[]
          }
          setImageUrls(urls)
        }

        // Calculate rent using the AI API if daily_price is not set
        if (!data.daily_price) {
          try {
            const rentResponse = await calculateRent({
              invoice_value: data.invoice_value,
              purchase_date: data.purchase_date,
              image_url: imageUrls[0] || undefined,
            })

            setMonthlyRent(rentResponse.monthly_rent)

            // Update the listing with the calculated rent
            setListing({
              ...data,
              daily_price: rentResponse.monthly_rent,
            })
          } catch (error) {
            console.error("Error calculating rent:", error)
            // Fallback calculation
            const purchaseDate = new Date(data.purchase_date)
            const ageInMonths = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
            const depreciationFactor = Math.max(0.5, 1 - ageInMonths * 0.01)
            const calculatedRent = Math.round(data.invoice_value * 0.001 * depreciationFactor * 30)

            setMonthlyRent(calculatedRent)

            // Update the listing with the calculated rent
            setListing({
              ...data,
              daily_price: calculatedRent,
            })
          }
        } else {
          setMonthlyRent(data.daily_price)
        }
      } catch (error) {
        console.error("Error fetching listing:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [params.id])

  // Add function to calculate logistics cost
  const calculateLogisticsCost = async () => {
    if (!listing || !user?.addresses || user.addresses.length === 0) return

    try {
      const response = await calculateLogisticsCostApi({
        listing_id: listing.listing_id,
        borrower_pincode: user.addresses[0].pincode,
      })

      setLogisticsCost(response.logistics_cost)
    } catch (error) {
      console.error("Error calculating logistics cost:", error)
    }
  }

  // Call this function when listing is loaded
  useEffect(() => {
    if (listing && user?.addresses && user.addresses.length > 0) {
      calculateLogisticsCost()
    }
  }, [listing, user])

  const nextImage = () => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)
    }
  }

  const prevImage = () => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)
    }
  }

  // Update the totals calculation to use monthly pricing
  const calculateTotal = () => {
    if (!listing || !monthlyRent)
      return {
        monthlyRent: 0,
        subtotal: 0,
        serviceFee: 0,
        deliveryFee: 0,
        total: 0,
        upfrontDiscount: 0,
        upfrontTotal: 0,
      }

    // Ensure we're using the correct monthly rent value
    const monthlyRentValue = monthlyRent
    console.log("Monthly rent value:", monthlyRentValue)

    const subtotal = monthlyRentValue * rentalMonths
    const serviceFee = subtotal * 0.1
    const deliveryFee = logisticsCost || 500 // Use calculated logistics cost or default
    const total = subtotal + serviceFee + deliveryFee

    // Calculate upfront discount (10% off rental amount)
    const upfrontDiscount = subtotal * 0.1
    const upfrontTotal = total - upfrontDiscount

    return {
      monthlyRent: monthlyRentValue,
      subtotal,
      serviceFee,
      deliveryFee,
      total,
      upfrontDiscount,
      upfrontTotal,
    }
  }

  const handleContinue = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    // Skip to payment step (previously was KYC)
    router.push(`/browse/${params.id}/payment?months=${rentalMonths}&paymentType=${paymentType}`)
  }

  const totals = calculateTotal()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Item not found</h2>
        <p className="mt-4 text-gray-600">The item you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-6" onClick={() => router.push("/browse")}>
          Back to Browse
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/browse")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100">
            <div className="aspect-w-16 aspect-h-9 relative">
              <img
                src={imageUrls[currentImageIndex] || "/placeholder.svg?height=400&width=600"}
                alt={`${listing.brand} ${listing.model_name || ""}`}
                className="w-full h-[400px] object-cover"
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
              {imageUrls.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${
                    index === currentImageIndex ? "ring-2 ring-purple-600" : "opacity-70"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg?height=100&width=100"}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Item Details */}
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {listing.brand} {listing.model_name}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Pincode: {listing.location_pincode}</span>
                    <span className="mx-2">•</span>
                    <span>{PRODUCT_TYPES.find((t) => t.value === listing.product_type)?.label}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="owner">Owner</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 pt-4">
                <p className="text-gray-700">
                  {listing.brand} {listing.model_name} -{" "}
                  {PRODUCT_TYPES.find((t) => t.value === listing.product_type)?.label}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Product Type</span>
                    <p className="font-medium">{PRODUCT_TYPES.find((t) => t.value === listing.product_type)?.label}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Brand</span>
                    <p className="font-medium">{listing.brand}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Purchase Date</span>
                    <p className="font-medium">{new Date(listing.purchase_date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-500">Security Deposit</span>
                    <p className="font-medium">₹{(monthlyRent || 0) * 2}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features" className="pt-4">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Brand: {listing.brand}</span>
                  </li>
                  {listing.model_name && (
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>Model: {listing.model_name}</span>
                    </li>
                  )}
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Type: {PRODUCT_TYPES.find((t) => t.value === listing.product_type)?.label}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Purchase Date: {new Date(listing.purchase_date).toLocaleDateString()}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Original Value: ₹{listing.invoice_value}</span>
                  </li>
                </ul>
              </TabsContent>
              <TabsContent value="owner" className="pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=50&width=50" alt="Owner" />
                    <AvatarFallback>{listing.owner_name?.charAt(0) || "O"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{listing.owner_name || "Owner"}</h3>
                    <div className="flex items-center text-sm">
                      <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" />
                      <span>4.8</span>
                      <span className="text-gray-500 ml-1">(12 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Verified Member</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Response time: Within 2 hours</span>
                  </div>
                </div>
                <Button className="w-full">Contact Owner</Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Booking */}
        <div>
          <Card className="sticky top-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-2xl font-bold">₹{monthlyRent || 0}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Available Now
                </Badge>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Select Rental Period</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <RadioGroup
                    value={rentalMonths.toString()}
                    onValueChange={(value) => setRentalMonths(Number.parseInt(value))}
                    className="grid grid-cols-2 gap-2"
                  >
                    {RENTAL_PERIODS.map((period) => (
                      <div key={period.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={period.value.toString()} id={`period-${period.value}`} />
                        <Label htmlFor={`period-${period.value}`}>{period.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Payment Option</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <RadioGroup
                    value={paymentType}
                    onValueChange={(value) => setPaymentType(value as "monthly" | "upfront")}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="payment-monthly" />
                      <Label htmlFor="payment-monthly">Pay Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upfront" id="payment-upfront" />
                      <Label htmlFor="payment-upfront">Pay Upfront (10% discount)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>
                    ₹{totals.monthlyRent} × {rentalMonths} months
                  </span>
                  <span>₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>₹{totals.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span>₹{totals.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Security Deposit</span>
                  <span className="font-medium">₹{(monthlyRent || 0) * 1.2}</span>
                </div>

                {paymentType === "upfront" && (
                  <div className="flex justify-between text-green-600">
                    <span>Upfront payment discount (10%)</span>
                    <span>-₹{totals.upfrontDiscount.toFixed(2)}</span>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {paymentType === "upfront"
                      ? `₹${totals.upfrontTotal.toFixed(2)} (one-time payment)`
                      : `₹${totals.monthlyRent.toFixed(2)}/month for ${rentalMonths} months`}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={handleContinue}>
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

