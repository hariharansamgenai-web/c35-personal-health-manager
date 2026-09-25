import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { CheckInsPage } from '@/pages/CheckIns';
import { ExercisePage } from '@/pages/Exercise';
import { GoalsPage } from '@/pages/Goals';
import { NutritionPage } from '@/pages/Nutrition';
import { DocumentsPage } from '@/pages/Documents';
import { TimelinePage } from '@/pages/Timeline';
import { SharingPage } from '@/pages/Sharing';
import { FamilyPage } from '@/pages/Family';
import { ProfilePage } from '@/pages/Profile';
import { AISummaryPage } from '@/pages/AISummary';
import { NotFoundPage } from '@/pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/check-ins', element: <CheckInsPage /> },
      { path: '/exercise', element: <ExercisePage /> },
      { path: '/goals', element: <GoalsPage /> },
      { path: '/nutrition', element: <NutritionPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/timeline', element: <TimelinePage /> },
      { path: '/sharing', element: <SharingPage /> },
      { path: '/family', element: <FamilyPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/ai-summary', element: <AISummaryPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
