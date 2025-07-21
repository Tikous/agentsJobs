import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import NewLayout from '@/components/NewLayout';

const HomePage = lazy(() => import('@/pages/NewHomePage'));
const AgentsPage = lazy(() => import('@/pages/AgentsPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
const AgentFormPage = lazy(() => import('@/pages/AgentFormPage'));
const JobFormPage = lazy(() => import('@/pages/JobFormPage'));
const JobResultPage = lazy(() => import('@/pages/JobResultPage'));

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingComponent />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <NewLayout />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agents',
        element: (
          <SuspenseWrapper>
            <AgentsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agents/new',
        element: (
          <SuspenseWrapper>
            <AgentFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agents/:id/edit',
        element: (
          <SuspenseWrapper>
            <AgentFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'jobs',
        element: (
          <SuspenseWrapper>
            <JobsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'jobs/new',
        element: (
          <SuspenseWrapper>
            <JobFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'jobs/:id/edit',
        element: (
          <SuspenseWrapper>
            <JobFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'jobs/:id/result',
        element: (
          <SuspenseWrapper>
            <JobResultPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;