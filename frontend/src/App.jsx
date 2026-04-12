import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/Layout/AppShell";
import EditorPage from "./pages/EditorPage";
import Login from "./components/Login";
import Register from "./components/Register";
import PricingPage from "./pages/PricingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/p/welcome" replace />} />
        <Route path="/p/:pageId" element={<EditorPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/p/welcome" replace />} />
    </Routes>
  );
}
