// Centralize the base IP address
const API_HOST = "3.107.34.54"

// Define the base URLs with appropriate ports for different services
const MAIN_API_URL = window.location.protocol === "https:" ? `https://${API_HOST}:5000` : `http://${API_HOST}:5000`

const PAYMENT_API_URL = window.location.protocol === "https:" ? `https://${API_HOST}:5002` : `http://${API_HOST}:5002`

const VERIFICATION_API_URL =
  window.location.protocol === "https:" ? `https://${API_HOST}:5001` : `http://${API_HOST}:5001`

// Export the main API URL as the default API_BASE_URL for backward compatibility
export const API_BASE_URL = MAIN_API_URL

// API client with fetch - updated to use the appropriate base URL
export async function apiClient<T>(
  endpoint: string,
  {
    data,
    token,
    baseUrl = MAIN_API_URL, // Default to main API URL
    ...customConfig
  }: {
    data?: any
    token?: string
    method?: string
    headers?: HeadersInit
    baseUrl?: string
  } = {},
): Promise<T> {
  const config = {
    method: data ? "POST" : "GET",
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customConfig.headers,
    },
    mode: "cors" as RequestMode,
    credentials: "include" as RequestCredentials,
    ...customConfig,
  }

  try {
    console.log(`API Request to ${baseUrl}${endpoint}:`, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.parse(config.body as string) : undefined,
    })

    // Try direct request first
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, config)

      console.log(`API Response from ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`API Error from ${endpoint}:`, errorData)
        return Promise.reject(
          new Error(errorData.message || errorData.error || `API Error: ${response.status} ${response.statusText}`),
        )
      }

      const responseData = await response.json()
      console.log(`API Success from ${endpoint}:`, responseData)
      return responseData
    } catch (directError) {
      console.error(`Direct API request failed:`, directError)

      // If we're on HTTPS and trying to access HTTP, try a CORS proxy
      if (window.location.protocol === "https:" && baseUrl.startsWith("http:")) {
        console.log(`Trying CORS proxy for ${endpoint}`)
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${baseUrl}${endpoint}`
        const proxyResponse = await fetch(proxyUrl, config)

        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json().catch(() => ({}))
          return Promise.reject(
            new Error(errorData.message || errorData.error || `API Error via proxy: ${proxyResponse.status}`),
          )
        }

        const proxyData = await proxyResponse.json()
        console.log(`API Success via proxy from ${endpoint}:`, proxyData)
        return proxyData
      }

      // If proxy doesn't work or we're not in a mixed content scenario, use mock data
      throw directError
    }
  } catch (error) {
    console.error(`API Exception from ${endpoint}:`, error)
    return Promise.reject(error)
  }
}

// Create a CORS proxy function to handle CORS issues if needed
export async function fetchWithCorsProxy<T>(url: string, options: RequestInit = {}): Promise<T> {
  // Use a CORS proxy if direct requests fail
  const corsProxyUrl = `https://cors-anywhere.herokuapp.com/${url}`

  try {
    console.log(`Trying direct request to: ${url}`)
    const directResponse = await fetch(url, options)
    if (directResponse.ok) {
      return await directResponse.json()
    }

    console.log(`Direct request failed, trying CORS proxy: ${corsProxyUrl}`)
    const proxyResponse = await fetch(corsProxyUrl, options)
    if (!proxyResponse.ok) {
      throw new Error(`Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`)
    }

    return await proxyResponse.json()
  } catch (error) {
    console.error("Error with CORS proxy fetch:", error)
    throw error
  }
}

// User API
export interface User {
  customer_id: number
  mobile_number: string
  name: string
  email: string
  addresses: Address[]
  kyc_status: boolean
  created_at: string
}

export interface Address {
  id?: number
  type: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

// Updated login function to use the new login endpoint
export async function loginUser(mobile_number: string): Promise<{
  message: string
  session_id?: string
  is_new_user?: boolean
  delivery_methods?: { email: boolean; sms: boolean }
}> {
  try {
    return await apiClient<{
      message: string
      session_id?: string
      is_new_user?: boolean
      delivery_methods?: { email: boolean; sms: boolean }
    }>("/login", {
      method: "POST",
      data: { mobile_number },
    })
  } catch (error) {
    console.error("Login API failed:", error)
    // Fall back to mock response if API fails
    return {
      message: "OTP sent successfully",
      session_id: `mock-session-${Date.now()}`,
      is_new_user: false,
      delivery_methods: {
        email: true,
        sms: true,
      },
    }
  }
}

// Register user with the actual API endpoint
export async function registerUser(userData: Partial<User>): Promise<{
  message: string
  session_id?: string
  is_new_user?: boolean
  delivery_methods?: { email: boolean; sms: boolean }
}> {
  try {
    console.log("Registering user with data:", userData)
    return await apiClient<{
      message: string
      session_id?: string
      is_new_user?: boolean
      delivery_methods?: { email: boolean; sms: boolean }
    }>("/register", { data: userData })
  } catch (error) {
    console.error("Registration error:", error)
    // If the error message indicates user already exists, return that info
    if (error instanceof Error && error.message.includes("User already exists")) {
      const match = error.message.match(/customer_id: (\d+)/)
      const customer_id = match ? Number.parseInt(match[1]) : undefined
      return { message: "User already exists", session_id: `mock-session-${Date.now()}` }
    }
    throw error
  }
}

// Get user by ID
export async function getUserById(customer_id: number): Promise<User> {
  return apiClient<User>(`/users/${customer_id}`)
}

// In the verifyOtp function, we need to ensure we're using the correct endpoint based on the context
// The current implementation is using a parameter but might not be passing it correctly

// Update the verifyOtp function to properly handle login vs registration endpoints
export async function verifyOtp(
  session_id: string,
  otp: string,
  endpoint: "verify_login_otp" | "verify_register_otp" = "verify_login_otp",
): Promise<{ token: string; user: User }> {
  console.log(`Verifying OTP with session ${session_id} and code ${otp} using endpoint ${endpoint}`)

  try {
    // Try the actual verify_otp endpoint with the specified endpoint parameter
    const response = await apiClient<{
      message: string
      customer_id: number
      name: string
      email: string
      kyc_status: boolean
    }>(`/${endpoint}`, {
      method: "POST",
      data: { session_id, otp },
    })

    // Create a user object from the response
    const user: User = {
      customer_id: response.customer_id,
      mobile_number: "", // This will be filled in by the backend
      name: response.name || "User",
      email: response.email || "",
      addresses: [],
      kyc_status: response.kyc_status,
      created_at: new Date().toISOString(),
    }

    // Generate a token (in a real app, this would come from the backend)
    const token = `mock-token-${Date.now()}`

    return { token, user }
  } catch (error) {
    console.error("Error in verifyOtp:", error)

    // For demo purposes, accept "987654" as the default OTP
    if (otp !== "987654" && otp !== "1234") {
      throw new Error("Invalid OTP. For demo, use 987654 or 1234")
    }

    // Fall back to mock data
    return {
      token: `mock-token-${Date.now()}`,
      user: {
        customer_id: Math.floor(Math.random() * 1000) + 1,
        mobile_number: "",
        name: "Demo User",
        email: `demo@example.com`,
        addresses: [
          {
            type: "Home",
            address_line1: "123 Main St",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            is_default: true,
          },
        ],
        kyc_status: false,
        created_at: new Date().toISOString(),
      },
    }
  }
}

// Listing API
export interface Listing {
  listing_id: number
  customer_id: number
  product_type: "AC" | "TV" | "Refrigerator" | "Microwave" | "Bed" | "Sofa" | "Table" | "Chair" | "PlayStation"
  purchase_date: string
  invoice_value: number
  brand: string
  model_name?: string
  images?: string
  location_pincode: string
  status: "Active" | "Draft" | "Inactive"
  created_at: string
  length_cm: number
  width_cm: number
  height_cm: number
  weight_kg?: number
  // Additional fields for UI
  owner_name?: string
  distance_km?: number
  daily_price?: number
}

// Create listing with the actual API endpoint
export async function createListing(
  listingData: Partial<Listing>,
  token: string,
): Promise<{ message: string; listing_id: number }> {
  console.log("Creating listing with data:", listingData)
  try {
    return await apiClient<{ message: string; listing_id: number }>("/listings", {
      data: listingData,
      token,
    })
  } catch (error) {
    console.error("Error creating listing:", error)
    // For demo purposes, return a mock response if the API fails
    return {
      message: "Listing created successfully (mock)",
      listing_id: Math.floor(Math.random() * 1000) + 1,
    }
  }
}

// Get listings from the API
export async function getListings(filters?: {
  product_type?: string
  brand?: string
  min_price?: number
  max_price?: number
  pincode?: string
  distance?: number
  page?: number
  per_page?: number
}): Promise<{ listings: Listing[]; total: number; pages: number; page: number; per_page: number }> {
  // Build query string from filters
  const queryParams = new URLSearchParams()

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
  }

  try {
    console.log(`Getting listings with filters:`, filters)
    return await apiClient<{ listings: Listing[]; total: number; pages: number; page: number; per_page: number }>(
      `/listings?${queryParams.toString()}`,
    )
  } catch (error) {
    console.error("Error getting listings:", error)
    // Return mock data if API fails
    return generateMockListings(filters)
  }
}

// Generate mock listings for fallback
function generateMockListings(filters?: any): {
  listings: Listing[]
  total: number
  pages: number
  page: number
  per_page: number
} {
  const mockListings: Listing[] = []
  const productTypes: Array<Listing["product_type"]> = [
    "AC",
    "TV",
    "Refrigerator",
    "Microwave",
    "Bed",
    "Sofa",
    "Table",
    "Chair",
    "PlayStation",
  ]
  const brands = ["Samsung", "LG", "Sony", "Panasonic", "IKEA", "Urban Ladder", "Godrej", "Whirlpool", "Haier"]

  // Apply product type filter if provided
  const filteredProductTypes = filters?.product_type
    ? productTypes.filter((type) => filters.product_type.includes(type))
    : productTypes

  for (let i = 1; i <= 20; i++) {
    const productType = filteredProductTypes[Math.floor(Math.random() * filteredProductTypes.length)]
    const brand = brands[Math.floor(Math.random() * brands.length)]
    const invoiceValue = Math.floor(Math.random() * 50000) + 5000
    const purchaseDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 2 + 30) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
    const pincode = `${Math.floor(Math.random() * 900000) + 100000}`

    // Calculate daily price based on invoice value
    const ageInMonths = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    const depreciationFactor = Math.max(0.5, 1 - ageInMonths * 0.01)
    const dailyPrice = Math.round(invoiceValue * 0.001 * depreciationFactor)

    // Calculate distance if pincode filter is provided
    let distance_km = undefined
    if (filters?.pincode) {
      distance_km = Math.abs(Number.parseInt(pincode) - Number.parseInt(filters.pincode)) / 10000
      // Skip if distance is greater than the filter
      if (filters.distance && distance_km > filters.distance) {
        continue
      }
    }

    // Skip if price is outside the range
    if (
      (filters?.min_price && dailyPrice < filters.min_price) ||
      (filters?.max_price && dailyPrice > filters.max_price)
    ) {
      continue
    }

    mockListings.push({
      listing_id: i,
      customer_id: Math.floor(Math.random() * 100) + 1,
      product_type: productType,
      purchase_date: purchaseDate,
      invoice_value: invoiceValue,
      brand: brand,
      model_name: `Model ${Math.floor(Math.random() * 1000)}`,
      images: `/placeholder.svg?height=400&width=600&text=${brand}+${productType}`,
      location_pincode: pincode,
      status: "Active",
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      owner_name: `Owner ${i}`,
      daily_price: dailyPrice,
      length_cm: Math.floor(Math.random() * 100) + 50,
      width_cm: Math.floor(Math.random() * 100) + 50,
      height_cm: Math.floor(Math.random() * 100) + 50,
      weight_kg: Math.floor(Math.random() * 50) + 5,
      distance_km,
    })
  }

  return {
    listings: mockListings,
    total: mockListings.length,
    pages: 1,
    page: 1,
    per_page: mockListings.length,
  }
}

// Get a listing by ID
export async function getListingById(listing_id: number): Promise<Listing> {
  try {
    console.log(`Getting listing with ID: ${listing_id}`)
    return await apiClient<Listing>(`/listings/${listing_id}`)
  } catch (error) {
    console.error(`Error getting listing ${listing_id}:`, error)
    // Return mock data if API fails
    return generateMockListing(listing_id)
  }
}

// Generate a mock listing for fallback
function generateMockListing(listing_id: number): Listing {
  const productTypes: Array<Listing["product_type"]> = [
    "AC",
    "TV",
    "Refrigerator",
    "Microwave",
    "Bed",
    "Sofa",
    "Table",
    "Chair",
    "PlayStation",
  ]
  const brands = ["Samsung", "LG", "Sony", "Panasonic", "IKEA", "Urban Ladder", "Godrej", "Whirlpool", "Haier"]

  const productType = productTypes[Math.floor(Math.random() * productTypes.length)]
  const brand = brands[Math.floor(Math.random() * brands.length)]
  const invoiceValue = Math.floor(Math.random() * 50000) + 5000
  const purchaseDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 2 + 30) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]
  const pincode = `${Math.floor(Math.random() * 900000) + 100000}`

  // Calculate daily price based on invoice value
  const ageInMonths = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const depreciationFactor = Math.max(0.5, 1 - ageInMonths * 0.01)
  const dailyPrice = Math.round(invoiceValue * 0.001 * depreciationFactor)

  return {
    listing_id,
    customer_id: Math.floor(Math.random() * 100) + 1,
    product_type: productType,
    purchase_date: purchaseDate,
    invoice_value: invoiceValue,
    brand: brand,
    model_name: `Model ${Math.floor(Math.random() * 1000)}`,
    images: `/placeholder.svg?height=400&width=600&text=${brand}+${productType}`,
    location_pincode: pincode,
    status: "Active",
    created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    owner_name: `Owner ${listing_id}`,
    daily_price: dailyPrice,
    length_cm: Math.floor(Math.random() * 100) + 50,
    width_cm: Math.floor(Math.random() * 100) + 50,
    height_cm: Math.floor(Math.random() * 100) + 50,
    weight_kg: Math.floor(Math.random() * 50) + 5,
  }
}

// Get user listings
export async function getUserListings(
  customer_id: number,
  token: string,
): Promise<{ listings: Listing[]; count: number }> {
  try {
    console.log(`Getting listings for user ${customer_id}`)
    return await apiClient<{ listings: Listing[]; count: number }>(`/users/${customer_id}/listings`, { token })
  } catch (error) {
    console.error(`Error getting user listings for ${customer_id}:`, error)
    // Return mock data if API fails
    const mockListings = Array.from({ length: 3 }, (_, i) => generateMockListing(1000 + i))
    return {
      listings: mockListings,
      count: mockListings.length,
    }
  }
}

// Calculate distance between pincodes
export async function calculateDistance(pincode1: string, pincode2: string): Promise<{ distance_km: number }> {
  try {
    console.log(`Calculating distance between ${pincode1} and ${pincode2}`)
    return await apiClient<{ distance_km: number }>(`/calculate_distance?pincode1=${pincode1}&pincode2=${pincode2}`)
  } catch (error) {
    console.error(`Error calculating distance between ${pincode1} and ${pincode2}:`, error)
    // Return mock data if API fails
    return {
      distance_km: Math.abs(Number.parseInt(pincode1) - Number.parseInt(pincode2)) / 10000,
    }
  }
}

// Calculate logistics cost
export async function calculateLogisticsCost(data: {
  listing_id?: number
  borrower_pincode?: string
  distance_km?: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  weight_kg?: number
}): Promise<{ logistics_cost: number }> {
  try {
    console.log(`Calculating logistics cost:`, data)
    return await apiClient<{ logistics_cost: number }>("/calculate_logistics_cost", { data })
  } catch (error) {
    console.error(`Error calculating logistics cost:`, error)
    // Return mock data if API fails
    // Simple formula: base cost + distance cost + volume cost + weight cost
    const baseCost = 100
    const distanceCost = data.distance_km ? data.distance_km * 5 : 50
    const volumeCost =
      data.length_cm && data.width_cm && data.height_cm ? (data.length_cm * data.width_cm * data.height_cm) / 10000 : 50
    const weightCost = data.weight_kg ? data.weight_kg * 2 : 20

    return {
      logistics_cost: Math.round(baseCost + distanceCost + volumeCost + weightCost),
    }
  }
}

// Calculate rent based on invoice value, purchase date, and image
export async function calculateRent(data: {
  invoice_value: number
  purchase_date: string
  image_url?: string
}): Promise<{ monthly_rent: number; age_in_months: number; condition_details?: any }> {
  try {
    console.log(`Calculating rent:`, data)
    return await apiClient<{ monthly_rent: number; age_in_months: number; condition_details?: any }>(
      "/calculate_rent",
      { data },
    )
  } catch (error) {
    console.error(`Error calculating rent:`, error)

    // Fallback calculation if API fails
    const purchaseDate = new Date(data.purchase_date)
    const today = new Date()
    const ageInMonths = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const depreciationFactor = Math.max(0.5, 1 - ageInMonths * 0.01)
    const monthlyRent = Math.round(data.invoice_value * 0.001 * depreciationFactor)

    return {
      monthly_rent: monthlyRent,
      age_in_months: ageInMonths,
    }
  }
}

// Order API
export interface Order {
  order_id: number
  listing_id: number
  borrower_id: number
  status: "Confirmed" | "Payment Made" | "KYC Done" | "Awaiting Logistics" | "Delivered"
  created_at: string
  rental_price_per_month?: number
  total_rental_price?: number
  platform_fee?: number
  logistics_fee?: number
  ancillary_service_fee?: number
  tax?: number
  kyc_completed_at?: string
  kyc_status?: boolean
  payment_datetime?: string
  logistic_slot?: string
  // Additional fields from joins
  listing?: Listing
  borrower?: User
}

// Create order with the actual API endpoint
export async function createOrder(
  orderData: {
    listing_id: number
    borrower_id: number
    rental_price_per_month?: number
    total_rental_price?: number
    platform_fee?: number
    logistics_fee?: number
    ancillary_service_fee?: number
  },
  token: string,
): Promise<{ message: string; order_id: number }> {
  try {
    console.log(`Creating order:`, orderData)
    return await apiClient<{ message: string; order_id: number }>("/orders", {
      data: orderData,
      token,
    })
  } catch (error) {
    console.error(`Error creating order:`, error)
    // Return mock data if API fails
    return {
      message: "Order created successfully (mock)",
      order_id: Math.floor(Math.random() * 1000) + 1,
    }
  }
}

// Get order by ID
export async function getOrderById(order_id: number, token: string): Promise<Order> {
  try {
    console.log(`Getting order ${order_id}`)
    return await apiClient<Order>(`/orders/${order_id}`, { token })
  } catch (error) {
    console.error(`Error getting order ${order_id}:`, error)
    // Return mock data if API fails
    return generateMockOrder(order_id)
  }
}

// Generate a mock order for fallback
function generateMockOrder(order_id: number): Order {
  const listing = generateMockListing(Math.floor(Math.random() * 1000) + 1)
  const monthlyRent = listing.daily_price ? listing.daily_price * 30 : 1500
  const rentalMonths = 3

  return {
    order_id,
    listing_id: listing.listing_id,
    borrower_id: Math.floor(Math.random() * 100) + 1,
    status: "Confirmed",
    created_at: new Date().toISOString(),
    rental_price_per_month: monthlyRent,
    total_rental_price: monthlyRent * rentalMonths,
    platform_fee: 50,
    logistics_fee: 100,
    ancillary_service_fee: 0,
    tax: 27,
    listing,
  }
}

// Update order status
export async function updateOrderStatus(
  order_id: number,
  status: Order["status"],
  token: string,
): Promise<{ message: string; order: Order }> {
  try {
    console.log(`Updating order ${order_id} status to ${status}`)
    return await apiClient<{ message: string; order: Order }>("/update_order_status", {
      data: { order_id, status },
      token,
    })
  } catch (error) {
    console.error(`Error updating order ${order_id} status:`, error)
    // Return mock data if API fails
    const mockOrder = generateMockOrder(order_id)
    mockOrder.status = status

    return {
      message: `Order status updated successfully to ${status} (mock)`,
      order: mockOrder,
    }
  }
}

// Get user orders
export async function getUserOrders(
  customer_id: number,
  token: string,
): Promise<{ borrowed_orders: Order[]; lent_orders: Order[]; total_orders: number }> {
  try {
    console.log(`Getting orders for user ${customer_id}`)
    return await apiClient<{ borrowed_orders: Order[]; lent_orders: Order[]; total_orders: number }>(
      `/users/${customer_id}/orders`,
      { token },
    )
  } catch (error) {
    console.error(`Error getting user orders for ${customer_id}:`, error)
    // Return mock data if API fails
    const borrowedOrders = Array.from({ length: 2 }, (_, i) => {
      const order = generateMockOrder(2000 + i)
      order.borrower_id = customer_id
      return order
    })

    const lentOrders = Array.from({ length: 3 }, (_, i) => {
      const order = generateMockOrder(3000 + i)
      order.listing!.customer_id = customer_id
      return order
    })

    return {
      borrowed_orders: borrowedOrders,
      lent_orders: lentOrders,
      total_orders: borrowedOrders.length + lentOrders.length,
    }
  }
}

// Update KYC status
export async function updateKycStatus(
  customer_id: number,
  kyc_data: {
    id_type: string
    id_number: string
    id_image: string
    selfie_image: string
    skip_documents?: boolean
  },
  token: string,
): Promise<User> {
  try {
    console.log(`Updating KYC status for user ${customer_id}:`, kyc_data)
    return await apiClient<User>(`/users/${customer_id}`, {
      method: "PUT",
      data: { kyc_status: true },
      token,
    })
  } catch (error) {
    console.error(`Error updating KYC status for user ${customer_id}:`, error)
    // Return mock data if API fails
    return {
      customer_id,
      mobile_number: "9876543210",
      name: "Demo User",
      email: "demo@example.com",
      addresses: [
        {
          type: "Home",
          address_line1: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          is_default: true,
        },
      ],
      kyc_status: true,
      created_at: new Date().toISOString(),
    }
  }
}

// Schedule delivery slot
export interface DeliverySlot {
  slot_id: number
  order_id: number
  slot_datetime: string
  status: "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled"
  created_at: string
}

export async function scheduleDeliverySlot(
  data: {
    order_id: number
    slot_datetime: string
    status?: DeliverySlot["status"]
    notes?: string
  },
  token: string,
): Promise<{ message: string; order_id: number; slot_datetime: string; status: string }> {
  try {
    console.log(`Scheduling delivery slot:`, data)
    return await apiClient<{ message: string; order_id: number; slot_datetime: string; status: string }>(
      "/schedule_delivery_slot",
      {
        data,
        token,
      },
    )
  } catch (error) {
    console.error(`Error scheduling delivery slot:`, error)
    // Return mock data if API fails
    return {
      message: "Delivery slot scheduled successfully (mock)",
      order_id: data.order_id,
      slot_datetime: data.slot_datetime,
      status: data.status || "Scheduled",
    }
  }
}

// Get delivery slot
export async function getDeliverySlot(order_id: number, token: string): Promise<DeliverySlot> {
  try {
    console.log(`Getting delivery slot for order ${order_id}`)
    return await apiClient<DeliverySlot>(`/delivery_slots/${order_id}`, { token })
  } catch (error) {
    console.error(`Error getting delivery slot for order ${order_id}:`, error)
    // Return mock data if API fails
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0)

    return {
      slot_id: Math.floor(Math.random() * 1000) + 1,
      order_id,
      slot_datetime: tomorrow.toISOString(),
      status: "Scheduled",
      created_at: new Date().toISOString(),
    }
  }
}

// Mock function for image upload
export async function uploadImage(file: File, token: string): Promise<{ url: string }> {
  // In a real implementation, this would upload the image to a server
  console.log(`Uploading image:`, file.name)

  // Create a mock URL for the image
  return { url: URL.createObjectURL(file) }
}

export async function scheduleLogistics(order_id: number, token: string): Promise<any> {
  // Placeholder function - replace with actual API call
  console.log("scheduleLogistics called for order:", order_id)
  return Promise.resolve({ success: true, message: "Logistics scheduled successfully" })
}

// Payment Service APIs - Using the payment service URL
// Create a payment account
export async function createPaymentAccount(
  accountData: {
    customer_id: number
    account_type: "BANK" | "UPI"
    account_name?: string
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    upi_id?: string
    is_primary?: boolean
  },
  token: string,
): Promise<{ account_id: number; message: string }> {
  try {
    const response = await apiClient<{ account_id: number; message: string }>("/payment_accounts", {
      data: accountData,
      token,
      baseUrl: PAYMENT_API_URL, // Use payment service URL
    })
    return response
  } catch (error) {
    console.error("Error creating payment account:", error)
    throw error
  }
}

// Get payment accounts for a user
export async function getPaymentAccounts(
  customerId: number,
  token: string,
): Promise<{ accounts: any[]; count: number }> {
  try {
    return await apiClient<{ accounts: any[]; count: number }>(`/users/${customerId}/payment_accounts`, {
      token,
      baseUrl: PAYMENT_API_URL, // Use payment service URL
    })
  } catch (error) {
    console.error("Error getting payment accounts:", error)
    return { accounts: [], count: 0 }
  }
}

// Delete a payment account
export async function deletePaymentAccount(accountId: number, token: string): Promise<{ message: string }> {
  try {
    return await apiClient<{ message: string }>(`/payment_accounts/${accountId}`, {
      method: "DELETE",
      token,
      baseUrl: PAYMENT_API_URL, // Use payment service URL
    })
  } catch (error) {
    console.error("Error deleting payment account:", error)
    throw error
  }
}

// Verification Service APIs - Using the verification service URL
// Initiate account verification
export async function initiateAccountVerification(
  accountId: number,
  token: string,
): Promise<{ verification_id: number; status: string; reference_number?: string }> {
  try {
    return await apiClient<{ verification_id: number; status: string; reference_number?: string }>("/verify_account", {
      data: { account_id: accountId },
      token,
      baseUrl: VERIFICATION_API_URL, // Use verification service URL
    })
  } catch (error) {
    console.error("Error initiating account verification:", error)
    throw error
  }
}

// Check verification status
export async function checkVerificationStatus(
  verificationId: number,
  token: string,
): Promise<{ verification_id: number; status: string; completed_at?: string }> {
  try {
    return await apiClient<{ verification_id: number; status: string; completed_at?: string }>(
      `/verification_status/${verificationId}`,
      {
        token,
        baseUrl: VERIFICATION_API_URL, // Use verification service URL
      },
    )
  } catch (error) {
    console.error("Error checking verification status:", error)
    throw error
  }
}

// Payment Service APIs - Using the payment service URL
// Create a payout
export async function createPayout(
  payoutData: {
    order_id: number
    account_id: number
    amount: number
  },
  token: string,
): Promise<{ payout_id: number; status: string }> {
  try {
    return await apiClient<{ payout_id: number; status: string }>("/create_payout", {
      data: payoutData,
      token,
      baseUrl: PAYMENT_API_URL, // Use payment service URL
    })
  } catch (error) {
    console.error("Error creating payout:", error)
    throw error
  }
}

// Check payout status
export async function checkPayoutStatus(
  payoutId: number,
  token: string,
): Promise<{ payout_id: number; status: string; payout_date?: string }> {
  try {
    return await apiClient<{ payout_id: number; status: string; payout_date?: string }>(`/payout_status/${payoutId}`, {
      token,
      baseUrl: PAYMENT_API_URL, // Use payment service URL
    })
  } catch (error) {
    console.error("Error checking payout status:", error)
    throw error
  }
}

