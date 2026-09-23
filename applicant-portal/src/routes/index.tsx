import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { AdmissionsPage } from '@/pages/AdmissionsPage'
import { HomePage } from '@/pages/HomePage'
import { OfferingDetailPage } from '@/pages/OfferingDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'admissions', element: <AdmissionsPage /> },
      { path: 'admissions/offerings/:offeringId', element: <OfferingDetailPage /> },
      { path: '*', element: <Navigate to="/admissions" replace /> },
    ],
  },
])
