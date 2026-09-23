import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <Card className="w-full gap-0 py-0">
        <CardHeader className="border-b border-[#e8edf5] px-6 py-8">
          <CardTitle className="text-2xl text-[#071759]">Welcome to Taleem AI</CardTitle>
          <CardDescription className="text-base">
            Applicant portal for browsing open admissions and programmes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-8">
          <p className="text-sm text-[#354a8d]">
            View published intakes, explore available programmes, and review criteria and fees.
            Applications will be enabled in a later release.
          </p>
          <Link
            to="/admissions"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0c3cff] px-6 text-sm font-medium text-white hover:bg-[#0934dc]"
          >
            Browse admissions
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
