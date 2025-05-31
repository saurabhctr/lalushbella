"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Search, ShieldCheck, Truck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
// Import the Footer component
import Footer from "@/components/footer"
import { getListings } from "@/lib/api"

export default function Home() {
  const { user } = useAuth()
  const [featuredItems, setFeaturedItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      setIsLoading(true)
      try {
        // Get featured listings (most recent active listings)
        const response = await getListings({
          status: "Active",
          per_page: 3, // Limit to 3 items
        })
        setFeaturedItems(response.listings || [])
      } catch (error) {
        console.error("Error fetching featured items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedItems()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OAL-p4MblWKmpjU8hZ12BuTgPzQ7uGzlol.png"
                alt="OneAssist Logo"
                className="h-16"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Smart Living: Rent, List, and Elevate Your Home!
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Elevate Your Lifestyle: Smart Living Starts Here—Rent and List Effortlessly!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
                <Link href={user ? "/lend" : "/auth/login"}>Start Lending</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/browse">Browse Items</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Lenders */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-purple-600">For Lenders</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="bg-purple-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">List Your Items</h4>
                    <p className="text-gray-600">Upload photos, videos and details of your furniture or appliances</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-purple-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 6V18M18 12H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Get AI-Powered Pricing</h4>
                    <p className="text-gray-600">Our AI suggests optimal pricing based on market data</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-purple-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Coordinate Logistics</h4>
                    <p className="text-gray-600">We handle pickup and delivery for a seamless experience</p>
                  </div>
                </li>
              </ul>
              <Button asChild className="w-full mt-8 bg-purple-600 hover:bg-purple-700">
                <Link href={user ? "/lend" : "/auth/login"}>
                  Start Lending <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* For Borrowers */}
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-blue-600">For Borrowers</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Browse & Match</h4>
                    <p className="text-gray-600">Find the perfect items for your needs at affordable rates</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Complete KYC</h4>
                    <p className="text-gray-600">Quick verification process ensures trust and security</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Confirm & Receive</h4>
                    <p className="text-gray-600">Make payment and get your items delivered to your doorstep</p>
                  </div>
                </li>
              </ul>
              <Button asChild className="w-full mt-8 bg-blue-600 hover:bg-blue-700">
                <Link href="/browse">
                  Start Browsing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Featured Items</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {featuredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredItems.map((item) => (
                    <div key={item.listing_id} className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="h-48 bg-gray-200 relative">
                        <img
                          src={
                            item.images?.front ||
                            Object.values(item.images || {})[0] ||
                            "/placeholder.svg?height=200&width=300"
                          }
                          alt={`${item.brand} ${item.model_name || ""}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-2">
                          {item.brand} {item.model_name}
                        </h3>
                        <p className="text-gray-600 mb-4">{item.product_type} - Available for rent</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold">₹{item.daily_price}/month</span>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/browse/${item.listing_id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-6">No featured items available at the moment</p>
                </div>
              )}

              <div className="text-center mt-10">
                <Button asChild variant="outline">
                  <Link href="/browse">
                    View All Items <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

