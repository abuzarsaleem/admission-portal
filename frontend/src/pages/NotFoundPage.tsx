import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-[#0644ff]">404</h1>
      <p className="mt-4 text-xl font-semibold">Page not found</p>
      <p className="mt-2 text-[#43599e]">The page you are looking for does not exist.</p>
      <Link to="/dashboard">
        <Button className="mt-6 bg-[#0c3cff] hover:bg-[#0934dc]">Back to Dashboard</Button>
      </Link>
    </div>
  )
}
