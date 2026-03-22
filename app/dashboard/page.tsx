'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UploadForm from './components/UploadForm';
import HeavyRainfallVerificationTab from './components/HeavyRainfallVerificationTab';
import LeadTimeVerificationTab from './LeadTimeVerificationTab';
import AnalysisTab from './components/AnalysisTab';
import TabularAnalysisTab from './components/TabularAnalysisTab';
import AdminConfigModal from './components/AdminConfigModal';
import MapAnalysisTab from './components/MapAnalysisTab';
import ChatbotWidget from './components/ChatbotWidget';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'graphical' | 'tabular' | 'leadtime' | 'verification' | 'map'>('graphical');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    
    if (!authToken) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Keyboard shortcut for admin panel (Ctrl+H or Cmd+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('imd_authenticated');
    localStorage.removeItem('imd_user');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">IMD Mumbai</h1>
              <div className="ml-4 text-sm text-black font-bold">
                Rainfall Forecast Verification Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-black font-bold">Welcome, IMD Mumbai</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['upload', 'graphical', 'tabular', 'map', 'leadtime', 'verification'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-black font-bold hover:text-blue-700 hover:border-gray-300'
                }`}
              >
                {tab === 'upload' && 'Upload Data'}
                {tab === 'graphical' && 'Graphical Analysis'}
                {tab === 'tabular' && 'Tabular Analysis'}
                {tab === 'map' && 'Map Analysis'}
                {tab === 'leadtime' && 'Lead-Time Verification'}
                {tab === 'verification' && 'Heavy Rainfall Verification'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Tab */}
        {activeTab === 'upload' && <UploadForm />}

        {/* Graphical Analysis Tab */}
        {activeTab === 'graphical' && <AnalysisTab />}

        {/* Tabular Analysis Tab */}
        {activeTab === 'tabular' && <TabularAnalysisTab />}

        {/* Map Analysis Tab */}
        {activeTab === 'map' && <MapAnalysisTab />}

        {/* Lead-Time Verification Tab */}
        {activeTab === 'leadtime' && <LeadTimeVerificationTab />}

        {/* Heavy Rainfall Verification Tab */}
        {activeTab === 'verification' && <HeavyRainfallVerificationTab />}
      </div>

      {/* Admin Configuration Modal */}
      <AdminConfigModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
      />

      {/* AI Research Chatbot - persists across all tabs */}
      <ChatbotWidget />
    </div>
  );
}
