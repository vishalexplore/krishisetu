import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f4f8f3] text-slate-800">
      <Sidebar />

      <div className="min-h-screen lg:ml-64">
        <TopBar />

        <main className="min-h-[calc(100vh-4rem)] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default DashboardLayout;