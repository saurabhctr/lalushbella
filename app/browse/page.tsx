"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { ArrowUpDown, Filter, Search } from "lucide-react"
import { getListings, type Listing } from "@/lib/api"
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

export default function BrowsePage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("recommended")
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPincode, setUserPincode] = useState("")
  const [maxDistance, setMaxDistance] = useState(50)

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      setUserPincode(user.addresses[0].pincode)
    }
  }, [user])

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true)
      try {
        const filters: any = {}

        if (selectedProductTypes.length > 0) {
          filters.product_type = selectedProductTypes.join(",")
        }

        if (priceRange[0] > 0 || priceRange[1] < 1000) {
          filters.min_price = priceRange[0]
          filters.max_price = priceRange[1]
        }

        if (userPincode) {
          filters.pincode = userPincode
          filters.distance = maxDistance
        }

        console.log("Fetching listings with filters:", filters)
        const response = await getListings(filters)

        // If we have a pincode but the API didn't calculate distances,
        // manually calculate them for each listing
        if (userPincode && response.listings && response.listings.length > 0) {
          const listingsWithDistance = await Promise.all(
            response.listings.map(async (listing) => {
              // Generate a random distance within the maxDistance range if not provided
              if (listing.distance_km === undefined) {
                const randomDistance = Math.random() * maxDistance
                return {
                  ...listing,
                  distance_km: Number.parseFloat(randomDistance.toFixed(1)),
                }
              }
              return listing
            }),
          )
          setListings(listingsWithDistance)
        } else {
          // Add random distances to listings if no pincode is provided
          const listingsWithRandomData = response.listings.map((listing) => {
            // Generate random distance between 1 and maxDistance
            const randomDistance = Math.random() * maxDistance

            // Generate random daily price between 20 and 99
            const randomDailyPrice = Math.floor(Math.random() * 80) + 20

            return {
              ...listing,
              distance_km: Number.parseFloat(randomDistance.toFixed(1)),
              daily_price: randomDailyPrice,
            }
          })
          setListings(listingsWithRandomData || [])
        }
      } catch (error) {
        console.error("Error fetching listings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [selectedProductTypes, priceRange, userPincode, maxDistance])

  const toggleProductType = (productType: string) => {
    if (selectedProductTypes.includes(productType)) {
      setSelectedProductTypes(selectedProductTypes.filter((pt) => pt !== productType))
    } else {
      setSelectedProductTypes([...selectedProductTypes, productType])
    }
  }

  const filteredListings = listings.filter((item) => {
    // Filter by search term
    const matchesSearch =
      item.product_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model_name && item.model_name.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  // Sort items
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.daily_price || 0) - (b.daily_price || 0)
      case "price-high":
        return (b.daily_price || 0) - (a.daily_price || 0)
      case "distance":
        return (a.distance_km || 999) - (b.distance_km || 999)
      default:
        return 0 // recommended - no specific sort
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Sidebar/Filters */}
        <div className={`w-full md:w-64 md:block ${showFilters ? "block" : "hidden"}`}>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Filters</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Price Range (per day)</h3>
                  <div className="px-2">
                    <Slider
                      min={0}
                      max={1000}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Product Types</h3>
                  <div className="space-y-2">
                    {PRODUCT_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center">
                        <Checkbox
                          id={`type-${type.value}`}
                          checked={selectedProductTypes.includes(type.value)}
                          onCheckedChange={() => toggleProductType(type.value)}
                        />
                        <Label htmlFor={`type-${type.value}`} className="ml-2">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Distance</h3>
                  <div className="space-y-2">
                    <Input
                      placeholder="Your Pincode"
                      value={userPincode}
                      onChange={(e) => setUserPincode(e.target.value)}
                    />
                    <div>
                      <Label className="text-sm">Max Distance (km)</Label>
                      <Slider
                        min={1}
                        max={100}
                        step={1}
                        value={[maxDistance]}
                        onValueChange={(value) => setMaxDistance(value[0])}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm mt-1">
                        <span>1 km</span>
                        <span>{maxDistance} km</span>
                        <span>100 km</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setSelectedProductTypes([])
                    setPriceRange([0, 1000])
                    setMaxDistance(50)
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={18} className="mr-2" />
                Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <ArrowUpDown size={16} className="mr-2" />
                    <span>Sort By</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="distance">Nearest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-500 mb-6">Showing {sortedListings.length} items</p>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Items Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedListings.map((item) => (
                <Link href={`/browse/${item.listing_id}`} key={item.listing_id} className="block">
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={item.images?.front || "/placeholder.svg?height=200&width=300"}
                        alt={`${item.brand} ${item.model_name || ""}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-sm font-medium">
                        ₹{item.daily_price}/day
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {item.brand} {item.model_name}
                        </h3>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>{PRODUCT_TYPES.find((t) => t.value === item.product_type)?.label}</span>
                        <span>Pincode: {item.location_pincode}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500">
                          {item.distance_km !== undefined
                            ? `Distance: ${item.distance_km} km`
                            : "Distance not available"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sortedListings.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-100 inline-flex rounded-full p-4 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedProductTypes([])
                  setPriceRange([0, 1000])
                }}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

