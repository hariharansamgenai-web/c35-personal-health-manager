import { AuthProvider } from '@/context/AuthContext';
import { ActiveProfileProvider } from '@/context/ActiveProfileContext';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { AppRouter } from '@/routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ActiveProfileProvider>
          <AppRouter />
        </ActiveProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
