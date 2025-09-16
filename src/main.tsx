import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import App from './App.tsx';
import OnboardingPage from './routes/Onboarding';

const onboardingEnabled = import.meta.env.VITE_ONBOARDING_V1 === 'true';

function RequireOnboarding({ children }: { children: JSX.Element }) {
  if (onboardingEnabled && localStorage.getItem('hasOnboarded') !== 'true') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {onboardingEnabled && (
          <Route path="/onboarding" element={<OnboardingPage />} />
        )}
        <Route
          path="/*"
          element={
            <RequireOnboarding>
              <App />
            </RequireOnboarding>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
