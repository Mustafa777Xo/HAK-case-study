import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Layout from "@/components/Layout";
import UserSelectModal from "@/components/UserSelectModal";
import DashboardPage from "@/pages/DashboardPage";
import RequestListPage from "@/pages/RequestListPage";
import CreateRequestPage from "@/pages/CreateRequestPage";
import RequestDetailPage from "@/pages/RequestDetailPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import { useUserStore } from "@/store/useUserStore";

export default function App() {
  const { currentUser } = useUserStore();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const mustSelectUser = currentUser === null;
  const isUserModalOpen = mustSelectUser || userModalOpen;

  return (
    <BrowserRouter>
      <UserSelectModal
        isOpen={isUserModalOpen}
        canDismiss={!mustSelectUser}
        onClose={() => setUserModalOpen(false)}
      />

      <Routes>
        <Route element={<Layout onSwitchUser={() => setUserModalOpen(true)} />}>
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
