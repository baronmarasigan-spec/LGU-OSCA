import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  UserPlus, 
  IdCard, 
  Heart, 
  Stethoscope, 
  ClipboardList, 
  MessageSquare,
  LogOut, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight, 
  Search, 
  BarChart3,
  Check,
  X,
  AlertCircle,
  MoreVertical,
  Eye,
  RefreshCw,
  Loader2,
  Download,
  Edit3,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { cn, normalizeCashGiftResponse } from './lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

import { Application } from './App';
import RegistrationForm from './RegistrationForm';
import LcrRegistry, { LcrRecord } from './components/LcrRegistry';
import WalkInEnrollment from './components/WalkInEnrollment';
import Masterlist from './components/Masterlist';
import RegistrationProfileModal from './components/RegistrationProfileModal';
import MasterlistProfileModal from './components/MasterlistProfileModal';
import BenefitsModule from './components/BenefitsModule';
import FeedbackConcern from './components/FeedbackConcern';
import PhilHealthFacilitation from './components/PhilHealthFacilitation';
import IdIssuanceModule from './components/IdIssuanceModule';
import { motion, AnimatePresence } from 'motion/react';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardStats {
  registration: {
    total: number;
    pending: number;
    approved: number;
    disapproved: number;
  };
  masterlist: {
    total: number;
    active: number;
    deceased: number;
    released: number;
  };
  benefits: {
    annualCashGift: number;
    socialPension: number;
    weddingIncentive: number;
    birthdayIncentive: number;
  };
  feedback: {
    total: number;
    resolved: number;
    pending: number;
  };
}

export default function AdminDashboard({ 
  applications, 
  setApplications, 
  fetchApplications,
  onSignOut 
}: { 
  applications: Application[],
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>,
  fetchApplications: () => Promise<void>,
  onSignOut: () => void 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Management');

  const formatDate = (dateString: string) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatDateLong = (dateString: string | null | undefined) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatName = (app: Application) => {
    return `${app.last_name}, ${app.first_name} ${app.middle_name || ''}`.trim();
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isIdIssuanceOpen, setIsIdIssuanceOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    registration: { total: 0, pending: 0, approved: 0, disapproved: 0 },
    masterlist: { total: 0, active: 0, deceased: 0, released: 0 },
    benefits: { annualCashGift: 0, socialPension: 0, weddingIncentive: 0, birthdayIncentive: 0 },
    feedback: { total: 0, resolved: 0, pending: 0 }
  });

  const [notifications, setNotifications] = useState({
    registration: 0,
    idIssuance: 0,
    benefits: 0,
    total: 0
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const lastFetchNotifications = useRef<number>(0);
  const lastFetchStats = useRef<number>(0);

  const fetchNotifications = useCallback(async () => {
    // Throttle: don't fetch more than once every 10 seconds unless forced
    const now = Date.now();
    if (now - lastFetchNotifications.current < 10000) return;
    lastFetchNotifications.current = now;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };

      // 1. Pending Registrations
      const pendingReg = applications.filter(a => a.reg_status === 'pending').length;

      // 2. Pending ID Issuances
      const idRes = await fetch("https://api-dbosca.phoenix.com.ph/api/id-issuances", { headers });
      if (idRes.status === 429) {
        console.warn("Throttled: ID fetch returned 429");
        return;
      }
      if (!idRes.ok) throw new Error(`ID fetch failed: ${idRes.status}`);
      const idData = await idRes.json();
      const idListRaw = idData.data?.data || idData.data || idData;
      const idList = Array.isArray(idListRaw) ? idListRaw : [];
      const pendingId = idList.filter((i: any) => (i.status?.issuance_status || i.id_status || '').toLowerCase() === 'pending').length;

      // 3. Pending Benefits (Annual Cash Gift as priority)
      const annualRes = await fetch("https://api-dbosca.phoenix.com.ph/api/benefit-applications", { headers });
      if (annualRes.status === 429) {
        console.warn("Throttled: Benefits fetch returned 429");
        return;
      }
      if (!annualRes.ok) throw new Error(`Benefits fetch failed: ${annualRes.status}`);
      const annualData = await annualRes.json();
      const annualApps = normalizeCashGiftResponse(annualData);
      const pendingBenefits = Array.isArray(annualApps) ? annualApps.filter((a: any) => (a.status || '').toLowerCase() === 'pending').length : 0;

      setNotifications({
        registration: pendingReg,
        idIssuance: pendingId,
        benefits: pendingBenefits,
        total: pendingReg + pendingId + pendingBenefits
      });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      if (error.message?.includes('401')) {
        onSignOut();
      }
    }
  }, [applications, onSignOut]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Fetch every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const fetchDashboardStats = useCallback(async () => {
    // Throttle: don't fetch stats more than once every 15 seconds
    const now = Date.now();
    if (now - lastFetchStats.current < 15000) return;
    lastFetchStats.current = now;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/json" };

      // 1. Registration Stats (from applications prop/fetch)
      const reg = {
        total: applications.length,
        pending: applications.filter(a => a.reg_status === 'pending').length,
        approved: applications.filter(a => a.reg_status === 'approved').length,
        disapproved: applications.filter(a => a.reg_status === 'disapproved' || a.reg_status === 'rejected').length
      };

      // 2. Masterlist Stats
      const masterRes = await fetch("https://api-dbosca.phoenix.com.ph/api/masterlist", { headers });
      if (masterRes.status === 429) {
        console.warn("Throttled: Masterlist fetch returned 429");
        return;
      }
      if (!masterRes.ok) throw new Error(`Masterlist fetch failed: ${masterRes.status}`);
      const masterData = await masterRes.json();
      const masterArrayRaw = masterData.data?.data || masterData.data || masterData;
      const masterArray = Array.isArray(masterArrayRaw) ? masterArrayRaw : [];
      const mStats = {
        total: masterArray.length,
        active: masterArray.filter((a: any) => (a.vital_status || 'active').toLowerCase() === 'active').length,
        deceased: masterArray.filter((a: any) => (a.vital_status || '').toLowerCase() === 'deceased').length,
        released: masterArray.filter((a: any) => (a.id_status || '').toLowerCase() === 'released').length
      };

      // 3. Benefit Stats
      const annualRes = await fetch("https://api-dbosca.phoenix.com.ph/api/benefit-applications", { headers });
      if (annualRes.status === 429) return;
      if (!annualRes.ok) throw new Error(`Annual benefits fetch failed: ${annualRes.status}`);
      const annualData = await annualRes.json();
      const annualApps = normalizeCashGiftResponse(annualData);
      const annualCount = Array.isArray(annualApps) ? annualApps.length : 0;

      const pensionRes = await fetch("https://api-dbosca.phoenix.com.ph/api/social-pension", { headers });
      if (pensionRes.status === 429) return;
      if (!pensionRes.ok) throw new Error(`Pension fetch failed: ${pensionRes.status}`);
      const pensionData = await pensionRes.json();
      const pensionArray = pensionData.data?.data || pensionData.data || pensionData;
      const pensionCount = Array.isArray(pensionArray) ? pensionArray.length : 0;
      
      const weddingRes = await fetch("https://api-dbosca.phoenix.com.ph/api/wedding-anniversary-incentives", { headers });
      if (weddingRes.status === 429) return;
      if (!weddingRes.ok) throw new Error(`Wedding fetch failed: ${weddingRes.status}`);
      const weddingData = await weddingRes.json();
      const weddingArray = weddingData.data?.data || weddingData.data || weddingData;
      const weddingCount = Array.isArray(weddingArray) ? weddingArray.length : 0;

      // Feedback Stats
      const feedbackRes = await fetch("https://api-dbosca.phoenix.com.ph/api/feedback-concerns", { headers });
      if (feedbackRes.status === 429) return;
      if (!feedbackRes.ok) throw new Error(`Feedback fetch failed: ${feedbackRes.status}`);
      const feedbackData = await feedbackRes.json();
      const feedbacksRaw = feedbackData.data || [];
      const feedbacks = Array.isArray(feedbacksRaw) ? feedbacksRaw : [];
      const fStats = {
        total: feedbacks.length,
        resolved: feedbacks.filter((f: any) => f.status === 'Resolved').length,
        pending: feedbacks.filter((f: any) => f.status === 'Pending').length
      };

      setStats({
        registration: reg,
        masterlist: mStats,
        benefits: {
          annualCashGift: annualCount,
          socialPension: pensionCount,
          weddingIncentive: weddingCount,
          birthdayIncentive: 0 // Placeholder
        },
        feedback: fStats
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      if (error.message?.includes('401')) {
        onSignOut();
      }
    }
  }, [applications, onSignOut]);

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') setActiveTab('Dashboard');
    else if (path === '/registration/management') {
      setActiveTab('Management');
      setIsRegistrationOpen(true);
    }
    else if (path === '/registration/walk-in') {
      setActiveTab('Walk-in');
      setIsRegistrationOpen(true);
    }
    else if (path === '/masterlist') setActiveTab('Masterlist');
    else if (path === '/id-issuance/management') {
      setActiveTab('IdManagement');
      setIsIdIssuanceOpen(true);
    }
    else if (path === '/id-issuance/walk-in') {
      setActiveTab('IdWalkIn');
      setIsIdIssuanceOpen(true);
    }
    else if (path.startsWith('/benefits')) setActiveTab('Benefits');
    else if (path === '/philhealth-facilitation') setActiveTab('PhilHealthFacilitation');
    else if (path === '/feedback-and-concern') setActiveTab('FeedbackConcern');
    else if (path === '/registry') setActiveTab('LcrRegistry');
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'Dashboard': navigate('/dashboard'); break;
      case 'Management': navigate('/registration/management'); break;
      case 'Walk-in': navigate('/registration/walk-in'); break;
      case 'Masterlist': navigate('/masterlist'); break;
      case 'IdManagement': navigate('/id-issuance/management'); break;
      case 'IdWalkIn': navigate('/id-issuance/walk-in'); break;
      case 'Benefits': navigate('/benefits'); break;
      case 'PhilHealthFacilitation': navigate('/philhealth-facilitation'); break;
      case 'FeedbackConcern': navigate('/feedback-and-concern'); break;
      case 'LcrRegistry': navigate('/registry'); break;
    }
  };
  
  const initialLcrData: LcrRecord[] = [
    {
      id: 1,
      full_name: "JUAN DELA CRUZ",
      birth_date: "1955-05-20",
      age: 70
    },
    {
      id: 2,
      full_name: "MARIA SANTOS",
      birth_date: "1958-11-12",
      age: 66
    },
    {
      id: 3,
      full_name: "CARLOS REYES",
      birth_date: "1960-03-08",
      age: 65
    },
    {
      id: 4,
      full_name: "ANA LOPEZ",
      birth_date: "1952-07-25",
      age: 72
    },
    {
      id: 5,
      full_name: "ROBERTO GOMEZ",
      birth_date: "1949-01-15",
      age: 76
    },
    {
      id: 6,
      full_name: "LIZA SOBERANO",
      birth_date: "1998-01-04",
      age: 28
    }
  ];

  const [lcrData, setLcrData] = useState<LcrRecord[]>(initialLcrData);
  
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [modalInitialIsEditing, setModalInitialIsEditing] = useState(false);
  const [isMasterlistModalOpen, setIsMasterlistModalOpen] = useState(false);
  const [masterlistRefreshKey, setMasterlistRefreshKey] = useState(0);

  const [isDisapproveModalOpen, setIsDisapproveModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [disapprovingId, setDisapprovingId] = useState<number | null>(null);

  const [isWalkInFormOpen, setIsWalkInFormOpen] = useState(false);
  const [selectedLcrRecord, setSelectedLcrRecord] = useState<LcrRecord | null>(null);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Move to Pending State
  const [isMoveToPendingModalOpen, setIsMoveToPendingModalOpen] = useState(false);
  const [pendingCitizenId, setPendingCitizenId] = useState<number | null>(null);
  const [isMovingToPending, setIsMovingToPending] = useState(false);

  // Reset Password State
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Pagination State for Registration Module
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Rejection Remarks Modal State
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState('');

  // Filters State
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All record');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    const handleFetch = async () => {
      setIsLoading(true);
      setApplications([]); // Reset state before fetch
      try {
        await fetchApplications();
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'Management') {
      handleFetch();
    }
    
    // Reset filters on tab change
    setBarangayFilter('All');
    setStatusFilter('All record');
    setSearchQuery('');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
    
  }, [activeTab, fetchApplications]);

  useEffect(() => {
    if (activeTab === 'Masterlist') {
      setMasterlistRefreshKey(prev => prev + 1);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [barangayFilter, statusFilter, dateRange, searchQuery]);

  const barangayCounts = applications.reduce((acc, app) => {
    acc[app.barangay] = (acc[app.barangay] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueBarangaysLabels = Object.keys(barangayCounts).sort();

  const filteredApplications = applications.filter(app => {
    const fullName = formatName(app).toLowerCase();
    const matchesSearch = searchQuery === '' || fullName.includes(searchQuery.toLowerCase());
    const matchesBarangay = barangayFilter === 'All' || app.barangay === barangayFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'All record') {
      const statusMap: Record<string, string> = {
        'For Approval (pending)': 'pending',
        'Approved': 'approved',
        'Rejected': 'disapproved'
      };
      matchesStatus = app.reg_status === statusMap[statusFilter];
    }

    const regDate = app.registration_date ? new Date(app.registration_date) : null;
    let matchesDate = true;
    if (dateRange.from && regDate) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && regDate >= fromDate;
    }
    if (dateRange.to && regDate) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && regDate <= toDate;
    }

    return matchesSearch && matchesBarangay && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    if (filteredApplications.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Full Name", "Barangay", "Birthdate", "Registration Date", "Type", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredApplications.map(app => [
        `"${formatName(app)}"`,
        `"${app.barangay}"`,
        `"${formatDateLong(app.birth_date)}"`,
        `"${formatDate(app.registration_date || '')}"`,
        `"${app.registration_type}"`,
        `"${app.reg_status.toUpperCase()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registration_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (id: number, status: 'approved' | 'disapproved' | 'pending', remarks?: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const body: any = {
        reg_status: status
      };

      if (remarks) {
        body.rejection_remarks = remarks;
      }

      // Determine if it's a citizen_id or application_id
      const isCitizenId = id > 1000000;
      const endpoint = isCitizenId 
        ? `https://api-dbosca.phoenix.com.ph/api/masterlist/${id}`
        : `https://api-dbosca.phoenix.com.ph/api/applications/${id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      if (res.ok) {
        alert("Status updated successfully");
        if (activeTab === 'Masterlist') {
          setMasterlistRefreshKey(prev => prev + 1);
        }
        await fetchApplications();
      } else {
        alert(`Update failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed");
    }
  };

  const handleViewProfile = (app: Application) => {
    setSelectedApp(app);
    if (activeTab === 'Masterlist') {
      setIsMasterlistModalOpen(true);
    } else {
      setIsRegistrationModalOpen(true);
    }
  };

  const handleSaveProfile = async (updatedApp: Application, newFiles?: File[], removedFiles?: string[]) => {
    if (!updatedApp.id && !updatedApp.citizen_id) {
      alert("Error: Record ID is missing");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Use FormData only if there are new files to upload
      let body: any;
      let method = "PUT";
      let contentType: string | undefined = "application/json";

      if (newFiles && newFiles.length > 0) {
        const formData = new FormData();
        
        // For multipart/form-data updates, many backends require POST with _method=PUT
        formData.append("_method", "PUT");
        method = "POST";
        
        // Append all fields from updatedApp
        Object.entries(updatedApp).forEach(([key, value]) => {
          if (key === 'document') return; // Handle documents separately
          if (value === null || value === undefined) {
            formData.append(key, "");
          } else if (typeof value === 'boolean') {
            formData.append(key, value ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        });

        // Append new files
        newFiles.forEach(file => {
          if (file instanceof File) {
            if (file.name === "captured_photo.jpg") {
              formData.append("id_photo", file);
            } else {
              formData.append("document[]", file);
            }
          }
        });

        // Append existing documents info (filtered by removedFiles)
        const docField = updatedApp.document;
        let docArray: any[] = [];
        if (Array.isArray(docField)) {
          docArray = docField;
        } else if (typeof docField === 'string' && docField.trim()) {
          try {
            const parsed = JSON.parse(docField);
            docArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            docArray = [];
          }
        }
        
        const currentDocs = docArray.filter(doc => !removedFiles?.includes(doc.path));
        formData.append("existing_documents", JSON.stringify(currentDocs));

        body = formData;
        contentType = undefined; // Let the browser set it for FormData
      } else {
        // Use JSON for updates without new files
        // If there are removed files, filter the document array
        const docField = updatedApp.document;
        let docArray: any[] = [];
        if (Array.isArray(docField)) {
          docArray = docField;
        } else if (typeof docField === 'string' && docField.trim()) {
          try {
            const parsed = JSON.parse(docField);
            docArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            docArray = [];
          }
        }

        const currentDocs = docArray.filter(doc => !removedFiles?.includes(doc.path));
        
        const payload: any = {
          ...updatedApp,
          existing_documents: currentDocs,
          reg_status: updatedApp.reg_status || "pending"
        };
        
        // Omit the 'document' field from JSON payload because it contains objects,
        // but the backend validation expects it to be an array of files.
        delete payload.document;
        
        body = JSON.stringify(payload);
      }

      const fetchOptions: RequestInit = {
        method,
        headers: contentType ? { ...headers, "Content-Type": contentType } : headers,
        body
      };

      // Determine endpoint and ID
      const targetId = updatedApp.citizen_id || updatedApp.id;
      const endpoint = updatedApp.citizen_id 
        ? `https://api-dbosca.phoenix.com.ph/api/masterlist/${targetId}`
        : `https://api-dbosca.phoenix.com.ph/api/applications/${targetId}`;

      const res = await fetch(endpoint, fetchOptions);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update application");
      }

      alert("Changes saved successfully");
      setIsRegistrationModalOpen(false);
      setIsMasterlistModalOpen(false);
      setSelectedApp(null);
      if (activeTab === 'Masterlist') {
        setMasterlistRefreshKey(prev => prev + 1);
      }
      await fetchApplications();
    } catch (err) {
      console.error("Update error:", err);
      alert(err instanceof Error ? err.message : "An error occurred while saving changes");
    }
  };

  const handleDisapproveClick = (id: number) => {
    setDisapprovingId(id);
    setRejectionRemarks('');
    setIsDisapproveModalOpen(true);
  };

  const submitDisapproval = async () => {
    if (disapprovingId) {
      await updateStatus(disapprovingId, 'disapproved', rejectionRemarks);
      setIsDisapproveModalOpen(false);
      setDisapprovingId(null);
      setRejectionRemarks('');
    }
  };

  const handleApproveClick = (id: number) => {
    setApprovingId(id);
    setIsApproveModalOpen(true);
  };

  const submitApproval = async () => {
    if (approvingId) {
      await updateStatus(approvingId, 'approved');
      setIsApproveModalOpen(false);
      setApprovingId(null);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const submitDelete = async () => {
    if (!deletingId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`https://api-dbosca.phoenix.com.ph/api/applications/${deletingId}`, {
        method: "DELETE",
        headers
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
      }

      if (res.ok) {
        alert("Record deleted successfully");
        if (activeTab === 'Masterlist') {
          setMasterlistRefreshKey(prev => prev + 1);
        }
        await fetchApplications();
      } else {
        alert(`Delete failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const triggerMoveToPending = (citizenId: number) => {
    setPendingCitizenId(citizenId);
    setIsMoveToPendingModalOpen(true);
  };

  const handleMoveToPending = async () => {
    if (!pendingCitizenId || isMovingToPending) return;
    
    const citizenId = pendingCitizenId;
    setIsMovingToPending(true);
    setIsMoveToPendingModalOpen(false);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`https://api-dbosca.phoenix.com.ph/api/masterlist/move-to-pending/${citizenId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setPendingCitizenId(null);
        setMasterlistRefreshKey(prev => prev + 1);
        await fetchApplications();
        alert("Successfully moved to pending.");
      } else {
        alert(response.data.message || "Failed to move to pending.");
      }
    } catch (error: any) {
      console.error("Move to pending error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred while moving the record to pending.";
      alert(errorMessage);
    } finally {
      setIsMovingToPending(false);
    }
  };

  const triggerResetPassword = (id: number) => {
    setResetPasswordUserId(id);
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || isResettingPassword) return;
    
    const userId = resetPasswordUserId;
    setIsResettingPassword(true);
    setIsResetPasswordModalOpen(false);
    
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`https://api-dbosca.phoenix.com.ph/api/auth/admin/reset-password/${userId}`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        alert("Password reset successfully");
        setResetPasswordUserId(null);
      } else {
        const data = await res.json();
        alert(`Reset failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Reset password failed");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans text-[#1E293B]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ef4444] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-200">
            SC
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-[#0F172A]">SeniorConnect</h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wide">Administrator</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          <button 
            onClick={() => handleTabChange('Dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'Dashboard' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'Dashboard' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-r-full" />}
            <LayoutDashboard className={cn("w-5 h-5", activeTab === 'Dashboard' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            Dashboard
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all group",
                activeTab === 'Management' || activeTab === 'Walk-in' ? "text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <UserPlus className={cn("w-5 h-5", (activeTab === 'Management' || activeTab === 'Walk-in') ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
                Registration
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isRegistrationOpen && "rotate-180")} />
            </button>
            {isRegistrationOpen && (
              <div className="ml-12 space-y-1">
                <button 
                  onClick={() => handleTabChange('Management')}
                  className={cn(
                    "w-full text-left px-4 py-2 text-base font-semibold transition-colors relative",
                    activeTab === 'Management' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'Management' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full" />}
                  Management
                </button>
                <button 
                  onClick={() => handleTabChange('Walk-in')}
                  className={cn(
                    "w-full text-left px-4 py-2 text-base font-semibold transition-colors relative",
                    activeTab === 'Walk-in' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'Walk-in' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full" />}
                  Walk-in
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleTabChange('Masterlist')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'Masterlist' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'Masterlist' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full" />}
            <ClipboardList className={cn("w-6 h-6", activeTab === 'Masterlist' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            Masterlist
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsIdIssuanceOpen(!isIdIssuanceOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all group",
                activeTab === 'IdManagement' || activeTab === 'IdWalkIn' ? "text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <IdCard className={cn("w-6 h-6", (activeTab === 'IdManagement' || activeTab === 'IdWalkIn') ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
                ID Issuance
              </div>
              <ChevronDown className={cn("w-5 h-5 transition-transform", isIdIssuanceOpen && "rotate-180")} />
            </button>
            {isIdIssuanceOpen && (
              <div className="ml-12 space-y-1">
                <button 
                  onClick={() => handleTabChange('IdManagement')}
                  className={cn(
                    "w-full text-left px-4 py-2 text-base font-semibold transition-colors relative",
                    activeTab === 'IdManagement' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'IdManagement' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full" />}
                  Management
                </button>
                <button 
                  onClick={() => handleTabChange('IdWalkIn')}
                  className={cn(
                    "w-full text-left px-4 py-2 text-base font-semibold transition-colors relative",
                    activeTab === 'IdWalkIn' ? "text-[#ef4444]" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {activeTab === 'IdWalkIn' && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-red-500 rounded-full" />}
                  Walk-in
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleTabChange('Benefits')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'Benefits' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'Benefits' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full" />}
            <Heart className={cn("w-6 h-6", activeTab === 'Benefits' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            Benefits
          </button>

          <button 
            onClick={() => handleTabChange('PhilHealthFacilitation')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'PhilHealthFacilitation' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'PhilHealthFacilitation' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full" />}
            <Stethoscope className={cn("w-6 h-6", activeTab === 'PhilHealthFacilitation' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            PhilHealth Facilitation
          </button>

          <button 
            onClick={() => handleTabChange('FeedbackConcern')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'FeedbackConcern' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'FeedbackConcern' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full" />}
            <MessageSquare className={cn("w-6 h-6", activeTab === 'FeedbackConcern' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            Feedback and Concern
          </button>

          <div className="pt-10 pb-2">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Registry Reference</p>
          </div>

          <button 
            onClick={() => handleTabChange('LcrRegistry')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all relative group",
              activeTab === 'LcrRegistry' ? "bg-red-50 text-[#ef4444]" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {activeTab === 'LcrRegistry' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full" />}
            <BarChart3 className={cn("w-6 h-6", activeTab === 'LcrRegistry' ? "text-[#ef4444]" : "text-slate-400 group-hover:text-slate-600")} />
            LCR/PWD Registry
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-6 h-6" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 overflow-y-auto p-12 relative">
        {/* Persistent Top Header with Notification Bell */}
        <div className="flex justify-end mb-6 sticky top-0 z-[40]">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={cn(
                "p-3 rounded-2xl transition-all relative group shadow-sm border",
                isNotificationOpen ? "bg-[#ef4444] border-[#ef4444] text-white shadow-red-200" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <Bell className={cn("w-5 h-5 transition-colors", isNotificationOpen ? "text-white" : "text-slate-500 group-hover:text-[#ef4444]")} />
              {notifications.total > 0 && !isNotificationOpen && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#ef4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all duration-300">
                  {notifications.total}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsNotificationOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-[320px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#ef4444] rounded-lg flex items-center justify-center">
                          <Bell className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-[#ef4444] text-[10px] font-black rounded-full">
                        {notifications.total} NEW
                      </span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.registration > 0 && (
                        <div 
                          onClick={() => { handleTabChange('Management'); setIsNotificationOpen(false); }}
                          className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer group"
                        >
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                              <UserPlus className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight mb-1">New Registration Submissions</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                <span className="text-[#ef4444] font-bold">1</span> new user registered, total <span className="text-[#ef4444] font-bold">{notifications.registration}</span> pending in registration.
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Just now
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {notifications.idIssuance > 0 && (
                        <div 
                          onClick={() => { handleTabChange('IdManagement'); setIsNotificationOpen(false); }}
                          className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer group"
                        >
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                              <IdCard className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight mb-1">ID Issuance Requests</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                There are <span className="text-amber-500 font-extrabold">{notifications.idIssuance}</span> pending ID requests awaiting review.
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Awaiting Action
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {notifications.benefits > 0 && (
                        <div 
                          onClick={() => { handleTabChange('Benefits'); setIsNotificationOpen(false); }}
                          className="p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer group"
                        >
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                              <Heart className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight mb-1">Benefit Applications</p>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                <span className="text-rose-500 font-extrabold">{notifications.benefits}</span> new benefit applications submitted online.
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Action Needed
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {notifications.total === 0 && (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No new notifications</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                      <button 
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#ef4444] transition-colors"
                      >
                        Close Panel
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeTab === 'Management' && (
          <>
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Registration Management</h2>
              <p className="text-slate-500 font-medium mt-1">Central Enrollment Registry</p>
            </header>

            <div className="space-y-6 mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Search Record</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Search by full name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm h-[52px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Date Range</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm h-[52px]">
                    <input 
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none w-full"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="bg-transparent text-sm font-semibold text-slate-900 outline-none w-full"
                    />
                    {(dateRange.from || dateRange.to) && (
                      <button 
                        onClick={() => setDateRange({ from: '', to: '' })}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Barangay</label>
                  <div className="relative">
                    <select 
                      value={barangayFilter}
                      onChange={(e) => setBarangayFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer shadow-sm pr-10 h-[52px]"
                    >
                      <option value="All">All Barangays ({applications.length})</option>
                      {uniqueBarangaysLabels.map(brgy => (
                        <option key={brgy} value={brgy}>
                          {brgy} ({barangayCounts[brgy]})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
                  <label className="text-xs font-semibold text-slate-500 tracking-wide ml-1">Status</label>
                  <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all cursor-pointer shadow-sm pr-10 h-[52px]"
                    >
                      <option value="All record">All Records</option>
                      <option value="For Approval (pending)">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-3 self-end">
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-8 py-3 bg-[#ef4444] text-white rounded-xl text-base font-semibold hover:bg-red-600 transition-all shadow-sm shadow-red-100"
                  >
                    <Download className="w-5 h-5" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider">Full Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Barangay</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Birthdate</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Registration Date</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Type</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500 tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <AlertCircle className="w-16 h-16 text-slate-100" />
                            <p className="text-slate-400 font-medium text-lg">No records found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatName(app)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-semibold text-slate-700">
                              {app.barangay}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-600">{formatDateLong(app.birth_date)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-medium text-slate-500">{formatDate(app.registration_date || '')}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 tracking-wider">
                            {app.registration_type}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight shadow-sm",
                                app.reg_status === 'approved' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                app.reg_status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                                app.reg_status === 'disapproved' && "bg-rose-50 text-rose-600 border-rose-100",
                              )}>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  app.reg_status === 'approved' && "bg-emerald-500",
                                  app.reg_status === 'pending' && "bg-amber-500 animate-pulse",
                                  app.reg_status === 'disapproved' && "bg-rose-500",
                                )} />
                                {app.reg_status === 'disapproved' ? 'Disapproved' : (app.reg_status === 'approved' ? 'Approved' : (app.reg_status?.charAt(0).toUpperCase() + app.reg_status?.slice(1)))}
                              </div>
                              {app.reg_status === 'disapproved' && (
                                <button 
                                  onClick={() => {
                                    setSelectedRemarks(app.rejection_remarks || 'No remarks provided.');
                                    setIsRemarksModalOpen(true);
                                  }}
                                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-1"
                                >
                                  View Remarks
                                </button>
                              )}
                              {(app.reg_status === 'approved' || app.reg_status === 'disapproved') && app.date_reviewed && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                  Reviewed: {formatDateLong(app.date_reviewed)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === app.id ? null : app.id);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </button>

                              <AnimatePresence>
                                {openDropdownId === app.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1, ease: "easeOut" }}
                                    className="absolute right-12 top-1/2 -translate-y-1/2 z-30 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1 overflow-hidden origin-right"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button 
                                      onClick={() => {
                                        handleViewProfile(app);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-4 h-4 text-slate-400" />
                                      View Profile
                                    </button>
                                    
                                    {app.reg_status === 'pending' && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setSelectedApp(app);
                                            setModalInitialIsEditing(true);
                                            setIsRegistrationModalOpen(true);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <Edit3 className="w-4 h-4 text-slate-400" />
                                          Edit Profile
                                        </button>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button 
                                          onClick={() => {
                                            handleApproveClick(app.id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <Check className="w-4 h-4" />
                                          Approve
                                        </button>
                                        <button 
                                          onClick={() => {
                                            handleDisapproveClick(app.id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                          Disapprove
                                        </button>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button 
                                          onClick={() => {
                                            handleDeleteClick(app.id);
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                          Delete Record
                                        </button>
                                      </>
                                    )}

                                    {app.reg_status === 'disapproved' && (
                                      <>
                                        <div className="h-px bg-slate-50 my-1" />
                                        <button 
                                          onClick={() => {
                                            updateStatus(app.id, 'pending');
                                            setOpenDropdownId(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-amber-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                          <RefreshCw className="w-4 h-4" />
                                          Move to Pending
                                        </button>
                                      </>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredApplications.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    Showing <span className="text-slate-900 font-semibold">{Math.min(filteredApplications.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-slate-900 font-semibold">{Math.min(filteredApplications.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900 font-semibold">{filteredApplications.length}</span> records
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredApplications.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                            currentPage === page 
                              ? "bg-[#ef4444] text-white shadow-sm" 
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredApplications.length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(filteredApplications.length / itemsPerPage)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all font-semibold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'Walk-in' && (
          !isWalkInFormOpen ? (
            <WalkInEnrollment 
              lcrData={lcrData}
              onProceed={(record) => {
                setSelectedLcrRecord(record);
                setIsWalkInFormOpen(true);
              }}
              onBack={() => handleTabChange('Management')}
            />
          ) : (
            <RegistrationForm 
              registrationType="Walk-in"
              isLcrVerified={!!selectedLcrRecord}
              lcrName={selectedLcrRecord?.full_name || ""}
              initialData={selectedLcrRecord ? {
                lastName: selectedLcrRecord.full_name.split(' ').slice(-1)[0],
                firstName: selectedLcrRecord.full_name.split(' ').slice(0, -1).join(' '),
                birthDate: selectedLcrRecord.birth_date,
                age: selectedLcrRecord.age
              } : undefined}
              onComplete={() => {
                fetchApplications();
                setIsWalkInFormOpen(false);
                setSelectedLcrRecord(null);
                handleTabChange('Management');
              }}
              onBack={() => {
                setIsWalkInFormOpen(false);
                setSelectedLcrRecord(null);
              }}
            />
          )
        )}

        {activeTab === 'IdManagement' && (
          <IdIssuanceModule 
            type="Management" 
            applications={applications} 
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'IdWalkIn' && (
          <IdIssuanceModule 
            type="Walk-In" 
            applications={applications} 
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'Benefits' && (
          <BenefitsModule />
        )}

        {activeTab === 'PhilHealthFacilitation' && (
          <PhilHealthFacilitation />
        )}

        {activeTab === 'LcrRegistry' && (
          <LcrRegistry 
            lcrData={lcrData}
            onRefresh={() => setLcrData(initialLcrData)}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'Masterlist' && (
          <Masterlist 
            onViewProfile={handleViewProfile}
            refreshTrigger={masterlistRefreshKey}
            onMoveToPending={triggerMoveToPending}
            onResetPassword={triggerResetPassword}
            onUnauthorized={onSignOut}
          />
        )}

        {activeTab === 'FeedbackConcern' && (
          <FeedbackConcern />
        )}

        {activeTab === 'Dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
              <p className="text-slate-500 font-medium mt-1">Live OSCA System Module Analytics</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Total Registrations', 
                  value: stats.registration.total, 
                  sub: `${stats.registration.pending} Pending Approval`, 
                  icon: UserPlus, 
                  color: 'text-blue-600', 
                  bg: 'bg-blue-50' 
                },
                { 
                  title: 'Masterlist Records', 
                  value: stats.masterlist.total, 
                  sub: `${stats.masterlist.released} IDs Released`, 
                  icon: ClipboardList, 
                  color: 'text-[#ef4444]', 
                  bg: 'bg-red-50' 
                },
                { 
                  title: 'Benefit Applications', 
                  value: stats.benefits.annualCashGift + stats.benefits.socialPension, 
                  sub: 'Total Service Requests', 
                  icon: Heart, 
                  color: 'text-rose-600', 
                  bg: 'bg-rose-50' 
                },
                { 
                  title: 'Citizen Feedbacks', 
                  value: stats.feedback.total, 
                  sub: `${stats.feedback.pending} Awaiting Response`, 
                  icon: MessageSquare, 
                  color: 'text-amber-600', 
                  bg: 'bg-amber-50' 
                },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                      <stat.icon className={cn("w-7 h-7", stat.color)} />
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg">
                      <Check className="w-4 h-4" />
                      Live
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.value.toLocaleString()}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Registration Breakdown */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Registration Status Analytics</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Approved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Pending</span>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Approved', value: stats.registration.approved, fill: '#10b981' },
                      { name: 'Pending', value: stats.registration.pending, fill: '#f59e0b' },
                      { name: 'Rejected', value: stats.registration.disapproved, fill: '#ef4444' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Masterlist Vitality */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Vitality Index</h3>
                <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: stats.masterlist.active, color: '#0ea5e9' },
                          { name: 'Deceased', value: stats.masterlist.deceased, color: '#94a3b8' },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#0ea5e9' },
                          { color: '#94a3b8' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
                    <span className="text-2xl font-black text-slate-900">{stats.masterlist.total}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                   <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-sky-500" />
                         <span className="text-xs font-bold text-slate-700">Active Members</span>
                      </div>
                      <span className="text-xs font-black text-sky-600">{stats.masterlist.active}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-slate-400" />
                         <span className="text-xs font-bold text-slate-700">Deceased Records</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{stats.masterlist.deceased}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Benefits & Feedback Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Usage */}
              <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">System Service Requests</h3>
                    <p className="text-slate-400 text-xs font-medium mt-1">Application volume for each benefit type</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-2xl">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: 'Annual Cash Gift', value: stats.benefits.annualCashGift, color: 'bg-rose-500', total: Math.max(1, stats.benefits.annualCashGift + stats.benefits.socialPension) },
                    { label: 'Social Pension (DSWD)', value: stats.benefits.socialPension, color: 'bg-blue-500', total: Math.max(1, stats.benefits.annualCashGift + stats.benefits.socialPension) },
                  ].map((service, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-200">{service.label}</span>
                        <span className="text-sm font-black text-white">{service.value}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(service.value / service.total) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                          className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]", service.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleTabChange('Benefits')}
                  className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all border border-white/10"
                >
                  Manage All Benefits
                </button>
              </div>

              {/* Recent Feedback Feed */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Feedback Summary</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Communication monitoring</p>
                  </div>
                  <div className="px-4 py-2 bg-amber-50 rounded-xl text-amber-600 font-bold text-xs">
                    {stats.feedback.pending} PENDING
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 h-full">
                   <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <span className="text-2xl font-black text-slate-900">{stats.feedback.resolved}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                      <span className="text-2xl font-black text-slate-900">{stats.feedback.pending}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                   </div>
                </div>
                
                <button 
                  onClick={() => handleTabChange('FeedbackConcern')}
                  className="w-full mt-10 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest transition-all border border-slate-200"
                >
                  View Engagement Logs
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isRegistrationModalOpen && selectedApp && (
            <RegistrationProfileModal 
              application={selectedApp}
              isOpen={isRegistrationModalOpen}
              initialIsEditing={modalInitialIsEditing}
              onClose={() => {
                setIsRegistrationModalOpen(false);
                setModalInitialIsEditing(false);
              }}
              onSave={handleSaveProfile}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMasterlistModalOpen && selectedApp && (
            <MasterlistProfileModal 
              application={selectedApp}
              isOpen={isMasterlistModalOpen}
              onClose={() => setIsMasterlistModalOpen(false)}
              onSave={handleSaveProfile}
              onRefresh={() => {
                setMasterlistRefreshKey(prev => prev + 1);
                fetchApplications();
              }}
              onMoveToPending={triggerMoveToPending}
              onResetPassword={triggerResetPassword}
            />
          )}
        </AnimatePresence>

        {/* Disapprove Modal */}
        <AnimatePresence>
          {isDisapproveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Disapprove Application</h3>
                    <button 
                      onClick={() => setIsDisapproveModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-slate-500 tracking-wide ml-1">Rejection Remarks</label>
                      <textarea 
                        value={rejectionRemarks}
                        onChange={(e) => setRejectionRemarks(e.target.value)}
                        placeholder="Enter reason for disapproval..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setIsDisapproveModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDisapproval}
                      className="flex-1 px-6 py-3.5 bg-red-500 text-white rounded-2xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm shadow-red-200"
                    >
                      Disapprove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Approve Modal */}
        <AnimatePresence>
          {isApproveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Approve Application</h3>
                    <button 
                      onClick={() => setIsApproveModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium">Are you sure you want to approve this application? This will mark the citizen as an official senior citizen member.</p>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setIsApproveModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitApproval}
                      className="flex-1 px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                    >
                      Confirm Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Delete Record</h3>
                    <button 
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium">Are you sure you want to delete this record? This action cannot be undone and all data associated with this application will be permanently removed.</p>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitDelete}
                      className="flex-1 px-6 py-3.5 bg-rose-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Move to Pending Confirmation Modal */}
        <AnimatePresence>
          {isMoveToPendingModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Confirm Action
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    Are you sure you want to move this record to pending?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsMoveToPendingModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMoveToPending}
                      disabled={isMovingToPending}
                      className="flex-1 px-6 py-4 bg-amber-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                    >
                      {isMovingToPending ? "Moving..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Reset Password Confirmation Modal */}
        <AnimatePresence>
          {isResetPasswordModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Confirm Action
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-8">
                    Are you sure you want to reset this user's password?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsResetPasswordModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="flex-1 px-6 py-4 bg-blue-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                      {isResettingPassword ? "Resetting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rejection Remarks Modal */}
        <AnimatePresence>
          {isRemarksModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    Rejection Details
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                    <p className="text-slate-600 leading-relaxed italic">
                      "{selectedRemarks}"
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRemarksModalOpen(false)}
                    className="w-full px-6 py-4 bg-slate-900 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
