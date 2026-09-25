import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { AppRouter } from '@/routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}
