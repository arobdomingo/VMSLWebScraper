import{ createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import { LoadingMessage } from "./components/RequestFeedback";
import './App.css'

const router = createBrowserRouter([
  {
    element: <Layout/>,
    hydrateFallbackElement: <LoadingMessage>Loading page...</LoadingMessage>,
    children: [
      { path: "/", lazy: async () => ({ Component: (await import("./pages/Home")).default }) },
      { path: "/team/:year/:division/:teamSlug", lazy: async () => ({ Component: (await import("./pages/TeamHub")).default }) },
      { path: "/divisions/:year/:division/standings", lazy: async () => ({ Component: (await import("./pages/Standings")).default }) },
      { path: "/team/:year/:division/:teamSlug/schedule", lazy: async () => ({ Component: (await import("./pages/Schedule")).default }) },
      { path: "/team/:year/:division/:teamSlug/scorers", lazy: async () => ({ Component: (await import("./pages/DivisionScorers")).default })},
      { path: "/team/:year/:division/:teamSlug/mvps", lazy: async () => ({ Component: (await import("./pages/DivisionMvps")).default }) },
      { path: "/team/:year/:division/:teamSlug/shutouts", lazy: async () => ({ Component: (await import("./pages/DivisionShutouts")).default })},
      { path: "/team/:year/:division/:teamSlug/goals", lazy: async () => ({ Component: (await import("./pages/GoalData")).default })}
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />
}

export default App


//User clicks button andnavigate() changes URL
//React Router matches route
//Layout renders
//TeamHub renders inside Outlet
//useParams reads URL values effectively
