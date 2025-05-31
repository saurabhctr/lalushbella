// Import the API host from lib/api
import { API_HOST } from "./lib/api"

// Export the API base URLs for different services
export const MAIN_API_URL =
  window.location.protocol === "https:" ? `https://${API_HOST}:5000` : `http://${API_HOST}:5000`

export const PAYMENT_API_URL =
  window.location.protocol === "https:" ? `https://${API_HOST}:5002` : `http://${API_HOST}:5002`

export const VERIFICATION_API_URL =
  window.location.protocol === "https:" ? `https://${API_HOST}:5001` : `http://${API_HOST}:5001`

// For backward compatibility
export const API_BASE_URL = MAIN_API_URL

