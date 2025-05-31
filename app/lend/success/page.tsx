import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Listing Published!</h1>

        <p className="text-gray-600 mb-8">
          Your item has been successfully listed on our platform. Potential renters can now see and request your item.
        </p>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">What happens next?</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-start">
              <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                1
              </span>
              <span>You'll receive notifications when someone is interested in your item</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                2
              </span>
              <span>Once a rental is confirmed, we'll handle the logistics and payment processing</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                3
              </span>
              <span>You'll receive your earnings after the rental period is complete</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/lend">List Another Item</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

