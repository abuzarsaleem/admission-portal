import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { AdmissionsPage } from '@/pages/AdmissionsPage'
import { OfferingDetailPage } from '@/pages/OfferingDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <AdmissionsPage /> },
      { path: 'admissions', element: <Navigate to="/" replace /> },
      { path: 'offerings/:offeringId', element: <OfferingDetailPage /> },
      { path: 'admissions/offerings/:offeringId', element: <OfferingDetailPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
