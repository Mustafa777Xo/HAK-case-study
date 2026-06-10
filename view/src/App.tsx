import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import UserSelectModal from "@/components/UserSelectModal";
import DashboardPage from "@/pages/DashboardPage";
import RequestListPage from "@/pages/RequestListPage";
import CreateRequestPage from "@/pages/CreateRequestPage";
import RequestDetailPage from "@/pages/RequestDetailPage";
import ApprovalsPage from "@/pages/ApprovalsPage";

export default function App() {
  return (
    <BrowserRouter>
      {/* Modal renders on top of everything until a user is selected */}
      <UserSelectModal />

      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestListPage />} />
          <Route path="/requests/new" element={<CreateRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
