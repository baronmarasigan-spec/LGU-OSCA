import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import RegistrationForm from './RegistrationForm';
import AdminDashboard from './AdminDashboard';
import CitizenPortal from './CitizenPortal';

export interface Application {
  id: number;
  application_id?: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix?: string;
  birth_date: string;
  age: number;
  sex?: string;
  // Wedding Anniversary fields
  husband_first_name?: string;
  husband_middle_name?: string;
  husband_last_name?: string;
  husband_birth_date?: string;
  husband_age?: number;
  husband_contact_number?: string;
  wife_first_name?: string;
  wife_middle_name?: string;
  wife_last_name?: string;
  wife_birth_date?: string;
  wife_age?: number;
  wife_contact_number?: string;
  marriage_date?: string;
  marriage_certificate_path?: string;
  // Birthday Incentive fields
  incentive_tier?: string | number;
  birthcertificate?: string;
  // Common fields
  civil_status?: string;
  citizenship?: string;
  birth_place?: string;
  address?: string;
  barangay: string;
  city_municipality?: string;
  district?: string;
  province?: string;
  email?: string;
  contact_number?: string;
  living_arrangement?: string;
  is_pensioner?: number | boolean;
  pension_source_gsis?: number | boolean;
  pension_source_sss?: number | boolean;
  pension_source_afpslai?: number | boolean;
  pension_source_others?: string;
  pension_amount?: number;
  has_permanent_income?: number | boolean;
  permanent_income_source?: string;
  has_regular_support?: number | boolean;
  support_type_cash?: number | boolean;
  support_cash_amount?: number;
  support_cash_frequency?: string;
  support_type_inkind?: number | boolean;
  support_inkind_details?: string;
  has_illness?: number | boolean;
  illness_details?: string;
  hospitalized_last_6_months?: number | boolean;
  registration_type: string;
  reg_status: 'pending' | 'approved' | 'rejected' | 'disapproved';
  rejection_remarks?: string;
  registration_date?: string;
  created_at?: string;
  date_reviewed?: string;
  username?: string;
  temp_password?: string;
  id_status?: string;
  vital_status?: string;
  date_of_death?: string;
  document?: any;
  id_file?: string;
  id_photo?: string;
  // New Annual Cash Gift fields
  full_name?: string;
  scid_number?: string;
  citizen_id?: string | number;
  photo_url?: string;
  birth_certificate_url?: string;
  barangay_certificate_url?: string;
  husband_scid?: string;
  wife_scid?: string;
  remarks?: string;
}

const INITIAL_DATA: Application[] = [];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<Application[]>(INITIAL_DATA);
  const [annualCashGiftApplications, setAnnualCashGiftApplications] = useState<any[]>([]);
  const [socialPensionApplications, setSocialPensionApplications] = useState<any[]>([]);

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/applications", {
        method: "GET",
        headers
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      console.log("API RESPONSE:", data);
      
      let apps = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data?.data)) {
          apps = data.data.data;
        } else if (Array.isArray(data.data)) {
          apps = data.data;
        } else if (Array.isArray(data)) {
          apps = data;
        }
      }
      
      console.log("EXTRACTED APPLICATIONS:", apps);
      setApplications(apps);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);

  // Auto redirect on load
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 1 || user.role === 2) {
          fetchApplications();
        }
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    if (user.role === 1 || user.role === 2) {
      navigate('/dashboard');
      fetchApplications();
    } else if (user.role === 5) {
      navigate('/portal');
    } else {
      alert("Unauthorized access");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate('/');
  };

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const hasValidToken = !!(token && token !== 'undefined' && token !== 'null');
  const isAdmin = !!(hasValidToken && user && (user.role === 1 || user.role === 2));
  const isCitizen = !!(hasValidToken && user && user.role === 5);

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={
          <LandingPage 
            onStartRegistration={() => navigate('/registration')}
            onLoginSuccess={handleLoginSuccess}
          />
        } />
        
        <Route path="/registration" element={
          <RegistrationForm 
            onComplete={(newApp) => {
              setApplications(prev => [newApp, ...prev]);
              navigate('/');
            }}
            onBack={() => navigate('/')}
          />
        } />

        <Route path="/dashboard" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/registration" element={<Navigate to="/registration/management" replace />} />
        <Route path="/registration/management" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/registration/walk-in" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/masterlist" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/id-issuance" element={<Navigate to="/id-issuance/management" replace />} />
        <Route path="/id-issuance/management" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />
        <Route path="/id-issuance/walk-in" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/benefits/*" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/philhealth-facilitation" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/feedback-and-concern" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/registry" element={
          isAdmin ? (
            <AdminDashboard 
              applications={applications}
              setApplications={setApplications}
              fetchApplications={fetchApplications}
              onSignOut={handleLogout} 
            />
          ) : (
            <Navigate to="/" />
          )
        } />

        <Route path="/portal/*" element={
          isCitizen ? (
            <CitizenPortal 
              onLogout={handleLogout} 
              annualCashGiftApplications={annualCashGiftApplications}
              setAnnualCashGiftApplications={setAnnualCashGiftApplications}
              socialPensionApplications={socialPensionApplications}
              setSocialPensionApplications={setSocialPensionApplications}
            />
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </div>
  );
}

