import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="bg-blob -top-24 -left-24 opacity-60"></div>
      <div className="bg-blob top-[40%] -right-24 opacity-40" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)' }}></div>
      
      <Sidebar />
      
      {/* Content Area */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
