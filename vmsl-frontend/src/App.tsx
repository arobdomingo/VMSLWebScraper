import{ createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home"
import TeamHub from "./pages/TeamHub"
import Standings from "./pages/Standings"
import Schedule from "./pages/Schedule"
import DivisionScorers from "./pages/DivisionScorers"
import DivisionMvps from "./pages/DivisionMvps";
import DivisionShutouts from "./pages/DivisionShutouts";
import GoalData from "./pages/GoalData";
import './App.css'

const router = createBrowserRouter([
  {
    element: <Layout/>,
    children: [
      { path: "/", element: <Home/> },
      { path: "/team/:year/:division/:teamSlug", element: <TeamHub/> },
      { path: "/divisions/:year/:division/standings", element: <Standings /> },
      { path: "/team/:year/:division/:teamSlug/schedule", element: <Schedule /> },
      { path: "/team/:year/:division/:teamSlug/scorers", element: <DivisionScorers />},
      { path: "/team/:year/:division/:teamSlug/mvps", element: <DivisionMvps /> },
      { path: "/team/:year/:division/:teamSlug/shutouts", element: <DivisionShutouts />},
      { path: "/team/:year/:division/:teamSlug/goals", element: <GoalData />}
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
