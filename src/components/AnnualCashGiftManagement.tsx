import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Check, 
  X, 
  AlertCircle,
  ChevronDown,
  Eye,
  Loader2,
  Plus,
  MoreVertical,
  Filter,
  RefreshCw,
  FileText,
  Pencil
} from 'lucide-react';
import { cn, normalizeCashGiftResponse } from '../lib/utils';
import BenefitsProfileModal from './BenefitsProfileModal';
import { motion, AnimatePresence } from 'motion/react';

interface AnnualCashGiftManagementProps {
  hideHeader?: boolean;
}

export default function AnnualCashGiftManagement({ 
  hideHeader = false
}: AnnualCashGiftManagementProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isUpdatingDisbursement, setIsUpdatingDisbursement] = useState<number | null>(null);
  const [pendingDisbursements, setPendingDisbursements] = useState<Record<number, string>>({});

  const lastFetchRef = useRef<number>(0);

  const fetchApplications = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 15000) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/benefit-applications", {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.status === 429) return;

      const data = await response.json();
      setApplications(normalizeCashGiftResponse(data));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayStatus = (status: string) => {
    if (!status) return "Pending";
    const s = status.toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'for release') return 'For Release';
    if (s === 'claimed') return 'Claimed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getCleanPath = (file: any) => {
    if (!file) return "";
    if (typeof file === "string" && file.startsWith("[")) {
      try {
        const parsed = JSON.parse(file);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const item = parsed[0];
          if (typeof item === 'string') return item;
          return item.path || item.file_path || file;
        }
      } catch (e) {}
    }
    if (Array.isArray(file) && file.length > 0) {
      const item = file[0];
      if (typeof item === 'string') return item;
      return item.path || item.file_path || "";
    }
    if (typeof file === "string" && file.startsWith("http")) {
       const parts = file.split('/storage/');
       if (parts.length > 1) return parts[1];
    }
    return file;
  };

  const updateDisbursementStatus = async (id: number) => {
    const status = pendingDisbursements[id];
    if (!status) return;

    // Use lowercase values for API
    const apiStatus = status.toLowerCase();

    setIsUpdatingDisbursement(id);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        disbursement_status: apiStatus,
      };

      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/benefit-applications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Use disbursement field from response and ensure it's lowercase for UI matching
        const updatedDisbursement = String(data.disbursement || apiStatus).toLowerCase();

        setApplications(prev => prev.map(app => 
          app.id === id ? { 
            ...app, 
            disbursement: updatedDisbursement,
            disbursement_status: updatedDisbursement 
          } : app
        ));
        setPendingDisbursements(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        const error = await response.json();
        alert("Failed to update disbursement: " + (error.message || response.statusText));
      }
    } catch (error) {
      console.error("Disbursement update error:", error);
    } finally {
      setIsUpdatingDisbursement(null);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const statusMap: Record<string, string> = {
        'Pending': 'pending',
        'Approved': 'approved',
        'Disapproved': 'disapproved',
        'pending': 'pending',
        'approved': 'approved',
        'disapproved': 'disapproved'
      };
      const normalizedStatus = statusMap[status] || status.toLowerCase();
      
      const record = applications.find(a => a.id === id);
      if (!record) return;

      const fd = new FormData();
      
      // Required fields from mapping
      fd.append("citizen_id", record.citizen_id || "");
      fd.append("scid_number", record.scid_number || "");
      fd.append("first_name", record.first_name || "");
      fd.append("middle_name", record.middle_name || "");
      fd.append("last_name", record.last_name || "");
      fd.append("birth_date", record.birth_date || "");
      fd.append("age", String(Number(record.age || 0)));
      fd.append("contact_number", record.contact_number || "");
      fd.append("barangay", record.barangay || "");
      fd.append("city_municipality", record.city_municipality || "");
      fd.append("province", record.province || "");
      fd.append("reg_status", normalizedStatus);

      // Include existing file paths as strings to satisfy "required" validation if files aren't being changed
      const photoPath = getCleanPath(record.photo || record.photo_url);
      const bcPath = getCleanPath(record.birth_certificate || record.birth_certificate_url);
      const bgPath = getCleanPath(record.barangay_certificate || record.barangay_certificate_url);
      
      if (photoPath) fd.append("photo", photoPath);
      if (bcPath) fd.append("birth_certificate", bcPath);
      if (bgPath) fd.append("barangay_certificate", bgPath);

      // Laravel PUT override
      fd.append("_method", "PUT");
      
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/benefit-applications/${id}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: fd
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = normalizeCashGiftResponse(data);
        if (normalized.length > 0) {
          setApplications(prev => prev.map(app => app.id === id ? normalized[0] : app));
        } else {
          setApplications(prev => prev.map(app => app.id === id ? { ...app, reg_status: normalizedStatus } : app));
        }
        setOpenDropdownId(null);
      } else {
        const errorData = await response.json();
        alert("Failed to update status: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred");
    }
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const handleNewEntry = () => {
    const newApp: any = {
      id: undefined,
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      birth_date: "",
      age: 0,
      sex: "",
      civil_status: "",
      citizenship: "Filipino",
      address: "",
      barangay: "",
      email: "",
      registration_type: "Annual Cash Gift",
      reg_status: "pending"
    };
    setSelectedApp(newApp);
    setIsEditMode(true);
    setIsProfileModalOpen(true);
  };

  const handleSave = async (updatedApp: any, files?: File[]) => {
    try {
      const token = localStorage.getItem("token");
      const isNew = !updatedApp.id;
      const url = isNew 
        ? "https://api-dbosca.phoenix.com.ph/api/benefit-applications" 
        : `https://api-dbosca.phoenix.com.ph/api/benefit-applications/${updatedApp.id}`;
      
      const fd = new FormData();
      
      // Status normalization mapping
      const statusMap: Record<string, string> = {
        'Pending': 'pending',
        'Approved': 'approved',
        'Disapproved': 'disapproved',
        'pending': 'pending',
        'approved': 'approved',
        'disapproved': 'disapproved'
      };

      // Append text fields
      Object.entries(updatedApp).forEach(([key, value]) => {
        if (key === 'reg_status') {
          const normalizedStatus = statusMap[String(value)] || String(value).toLowerCase();
          fd.append('reg_status', normalizedStatus);
        } else if (value !== undefined && value !== null && typeof value !== 'object') {
          fd.append(key, String(value));
        }
      });

      // Append files if any
      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.name === "captured_photo.jpg" || file.name === "photo.jpg") {
            fd.append("photo", file);
          } else {
            fd.append("document[]", file, file.name);
          }
        });
      }

      if (!isNew) {
        fd.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method: "POST", // Use POST for FormData (+ PUT override if not isNew)
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: fd
      });

      if (response.ok) {
        await fetchApplications();
        setIsProfileModalOpen(false);
        setSelectedApp(null);
        alert(isNew ? "New application created successfully" : "Profile updated successfully");
      } else {
        const data = await response.json();
        alert(data.message || `Failed to ${isNew ? 'create' : 'update'} profile`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred during save");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/benefit-applications/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
        setOpenDropdownId(null);
        alert("Application deleted successfully");
      } else {
        alert("Failed to delete application");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred during deletion");
    }
  };

  const filteredApplications = applications.filter(app => {
    const fullName = (app.full_name || `${app.first_name} ${app.last_name}`).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || (app.scid_number && String(app.scid_number).includes(searchTerm));
    const matchesBarangay = barangayFilter === 'All' || app.barangay === barangayFilter;
    const appStatus = (app.reg_status || "").toLowerCase();
    const matchesStatus = statusFilter === 'All' || appStatus === statusFilter.toLowerCase();
    return matchesSearch && matchesBarangay && matchesStatus;
  });

  const uniqueBarangays = ['All', ...Array.from(new Set(applications.map(app => app.barangay).filter(Boolean)))].sort();

  const handleViewProfile = (app: any, isEdit = false) => {
    // Map API data to standard profile structure
    const mappedApp = {
      ...app,
      // For compatibility with BenefitsProfileModal
      city_municipality: app.city_municipality || "",
      district: app.district || "",
      province: app.province || "",
      registration_type: "Annual Cash Gift"
    };
    setSelectedApp(mappedApp);
    setIsEditMode(isEdit);
    setIsProfileModalOpen(true);
  };

  const formatDate = (date: any) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Annual Cash Gift</h2>
            <p className="text-slate-500 font-medium mt-1">Benefit Application Registry</p>
          </div>
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm"
            onClick={handleNewEntry}
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </header>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or SCID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <select 
            value={barangayFilter}
            onChange={(e) => setBarangayFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            {uniqueBarangays.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-1 focus:ring-[#ef4444] focus:border-[#ef4444] transition-all cursor-pointer min-w-[160px] shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disapproved">Disapproved</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">SCID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Age</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Barangay</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Disbursement Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-[#EF4444] animate-spin" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle className="w-16 h-16 text-slate-100" />
                      <p className="text-slate-400 font-medium text-lg">No records found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const status = (app.reg_status || "pending").toLowerCase();
                  const disbursementStatus = (app.disbursement_status || "---").toLowerCase();
                  return (
                    <tr key={app.id || `app-${index}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-500">{formatDate(app.created_at || app.registration_date)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-[#ef4444] tracking-wider">{app.scid_number || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {app.full_name || `${app.last_name}, ${app.first_name} ${app.middle_name || ''}`}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-medium text-slate-600">{app.age}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-500">{app.barangay}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                          status === 'approved' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                          status === 'pending' && "bg-amber-50 text-amber-600 border-amber-100",
                          (status === 'rejected' || status === 'disapproved') && "bg-rose-50 text-rose-600 border-rose-100",
                        )}>
                          {app.reg_status || 'pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={pendingDisbursements[app.id] || getDisplayStatus(app.disbursement)}
                            onChange={(e) => setPendingDisbursements(prev => ({ ...prev, [app.id]: e.target.value }))}
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider rounded border px-2 py-1 outline-none transition-colors",
                              (pendingDisbursements[app.id]?.toLowerCase() || String(app.disbursement).toLowerCase()) === 'claimed' && "bg-blue-50 text-blue-600 border-blue-100",
                              (pendingDisbursements[app.id]?.toLowerCase() || String(app.disbursement).toLowerCase()) === 'for release' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                              (pendingDisbursements[app.id]?.toLowerCase() === 'pending' || String(app.disbursement).toLowerCase() === 'pending' || !app.disbursement) && "bg-amber-50 text-amber-600 border-amber-100"
                            )}
                          >
                            <option value="Pending">Pending</option>
                            <option value="For Release">For Release</option>
                            <option value="Claimed">Claimed</option>
                          </select>
                          
                          {pendingDisbursements[app.id] && pendingDisbursements[app.id]?.toLowerCase() !== String(app.disbursement).toLowerCase() && (
                            <button
                              onClick={() => updateDisbursementStatus(app.id)}
                              disabled={isUpdatingDisbursement === app.id}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors disabled:opacity-50"
                              title="Save Changes"
                            >
                              {isUpdatingDisbursement === app.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === app.id ? null : app.id);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                          
                          <AnimatePresence>
                            {openDropdownId === app.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setOpenDropdownId(null)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-40"
                                >
                                  <button 
                                    onClick={() => {
                                      handleViewProfile(app, false);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-all"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    View Details
                                  </button>
                                  <button 
                                    onClick={() => {
                                      handleViewProfile(app, true);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-indigo-600 transition-all"
                                  >
                                    <Pencil className="w-4 h-4 text-indigo-400" />
                                    Edit Profile
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(app.id, 'approved')}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-600 transition-all"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(app.id, 'disapproved')}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-50 rounded-lg text-xs font-semibold text-rose-600 transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                    Disapprove
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(app.id, 'pending')}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 rounded-lg text-xs font-semibold text-amber-600 transition-all"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Move to Pending
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(app.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-rose-50 rounded-lg text-xs font-semibold text-rose-500 transition-all border-t border-slate-100"
                                  >
                                    <X className="w-4 h-4 py-0.5" />
                                    Delete
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isProfileModalOpen && selectedApp && (
          <BenefitsProfileModal 
            application={selectedApp}
            isOpen={isProfileModalOpen}
            onClose={() => {
              setIsProfileModalOpen(false);
              setIsEditMode(false);
            }}
            onSave={handleSave} 
            initialIsEditing={isEditMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

