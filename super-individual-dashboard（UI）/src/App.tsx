import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import IdeaValidator from "./pages/IdeaValidator";
import DailyReview from "./pages/DailyReview";
import ProjectManagement from "./pages/ProjectManagement";
import Marketing from "./pages/Marketing";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="idea-validator" element={<IdeaValidator />} />
          <Route path="daily-review" element={<DailyReview />} />
          <Route path="project-management" element={<ProjectManagement />} />
          <Route path="marketing" element={<Marketing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
