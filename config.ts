// Update the config.ts file to use the new API base URL
import { API_BASE_URL } from "./lib/api"

// Export the API base URL for different services
// Now all services use the same base URL
export const MAIN_API_URL = API_BASE_URL
export const PAYMENT_API_URL = API_BASE_URL
export const VERIFICATION_API_URL = API_BASE_URL
