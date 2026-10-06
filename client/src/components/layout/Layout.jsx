import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ReportDiscrepancyModal from '../feedback/ReportDiscrepancyModal';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col justify-between">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)} 
        onOpenReportModal={() => setReportModalOpen(true)}
      />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDrawer={true} />
      
      {/* Main Full-Width Content Container */}
      <div className="flex-1 flex flex-col transition-all duration-200">
        <main className="relative pt-14 bg-surface min-h-[calc(100vh-3.5rem)] w-full flex flex-col">
          <div className="flex flex-col w-full flex-1">
            {children}
          </div>
        </main>
      </div>

      {/* Global Adequate Footer */}
      <Footer onOpenReportModal={() => setReportModalOpen(true)} />

      {/* Global Report Discrepancy / Bug Modal */}
      <ReportDiscrepancyModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
