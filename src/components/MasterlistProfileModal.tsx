import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  Edit3, 
  Save, 
  User, 
  MapPin, 
  Briefcase, 
  Heart, 
  Phone, 
  Mail, 
  FileText,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ClipboardList,
  Calendar,
  Loader2,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Application } from '../App';
import PdfViewer from './PdfViewer';

interface MasterlistProfileModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedApp: Application, newFiles?: File[], removedFiles?: string[]) => void;
  onRefresh?: () => void;
  onMoveToPending: (citizenId: number) => void;
  onResetPassword: (id: number) => void;
}

interface ProfileFormData {
  id?: number;
  application_id?: number;
  citizen_id?: number;
  scid_number: string;
  username: string;
  temp_password: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  birth_date: string;
  age: string | number;
  sex: string;
  civil_status: string;
  citizenship: string;
  birth_place: string;
  address: string;
  barangay: string;
  city_municipality: string;
  district: string;
  province: string;
  email: string;
  contact_number: string;
  living_arrangement: string;
  is_pensioner: boolean;
  pension_source_gsis: boolean;
  pension_source_sss: boolean;
  pension_source_afpslai: boolean;
  pension_source_others: string;
  pension_amount: string | number;
  has_permanent_income: boolean;
  permanent_income_source: string;
  has_regular_support: boolean;
  support_type_cash: boolean;
  support_cash_amount: string | number;
  support_cash_frequency: string;
  support_type_inkind: boolean;
  support_inkind_details: string;
  has_illness: boolean;
  illness_details: string;
  hospitalized_last_6_months: boolean;
  registration_type: string;
  reg_status?: string;
  id_status?: string;
  vital_status?: string;
  date_of_death?: string;
  date_reviewed?: string;
}

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-2 mb-6 pt-6 border-t border-slate-100 first:border-t-0 first:pt-0">
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", color)}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3>
  </div>
);

const Field = ({ 
  label, 
  value, 
  field, 
  isEditing, 
  onChange, 
  type = "text", 
  options,
  disabled = false
}: { 
  label: string, 
  value: any, 
  field: string, 
  isEditing: boolean,
  onChange: (field: string, value: any) => void,
  type?: string, 
  options?: string[],
  disabled?: boolean
}) => {
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

  const isTrue = (val: any) => val === true || val === 1 || val === "1";

  if (isEditing) {
    if (disabled) {
      return (
        <div className="space-y-1.5 opacity-70">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
            {value || '---'}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {type === "select" ? (
          <select 
            value={value || ''} 
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          >
            <option value="">Select {label}</option>
            {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : type === "checkbox" ? (
          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              checked={isTrue(value)} 
              onChange={(e) => onChange(field, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-slate-700">Yes</span>
          </div>
        ) : (
          <input 
            type={type} 
            value={value === null || value === undefined ? '' : value} 
            onChange={(e) => onChange(field, type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700">
        {type === 'checkbox' ? (isTrue(value) ? 'YES' : 'NO') : (type === 'date' ? formatDate(value) : (value || '---'))}
      </p>
    </div>
  );
};

export default function MasterlistProfileModal({ application, isOpen, onClose, onSave, onRefresh, onMoveToPending, onResetPassword }: MasterlistProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ url: string | null, filename: string, type: string, isGoogleViewer?: boolean } | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedFilePaths, setRemovedFilePaths] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProfileFormData>({
    id: application.id,
    application_id: application.application_id,
    citizen_id: application.citizen_id,
    scid_number: application.scid_number || "",
    username: application.username || "",
    temp_password: application.temp_password || "",
    first_name: application.first_name || "",
    middle_name: application.middle_name || "",
    last_name: application.last_name || "",
    suffix: application.suffix || "",
    birth_date: application.birth_date || "",
    age: application.age || "",
    sex: application.sex || "",
    civil_status: application.civil_status || "",
    citizenship: application.citizenship || "",
    birth_place: application.birth_place || "",
    address: application.address || "",
    barangay: application.barangay || "",
    city_municipality: application.city_municipality || "",
    district: application.district || "",
    province: application.province || "",
    email: application.email || "",
    contact_number: application.contact_number || "",
    living_arrangement: application.living_arrangement || "",
    is_pensioner: application.is_pensioner === 1 || application.is_pensioner === true,
    pension_source_gsis: application.pension_source_gsis === 1 || application.pension_source_gsis === true,
    pension_source_sss: application.pension_source_sss === 1 || application.pension_source_sss === true,
    pension_source_afpslai: application.pension_source_afpslai === 1 || application.pension_source_afpslai === true,
    pension_source_others: application.pension_source_others || "",
    pension_amount: application.pension_amount || "",
    has_permanent_income: application.has_permanent_income === 1 || application.has_permanent_income === true,
    permanent_income_source: application.permanent_income_source || "",
    has_regular_support: application.has_regular_support === 1 || application.has_regular_support === true,
    support_type_cash: application.support_type_cash === 1 || application.support_type_cash === true,
    support_cash_amount: application.support_cash_amount || "",
    support_cash_frequency: application.support_cash_frequency || "",
    support_type_inkind: application.support_type_inkind === 1 || application.support_type_inkind === true,
    support_inkind_details: application.support_inkind_details || "",
    has_illness: application.has_illness === 1 || application.has_illness === true,
    illness_details: application.illness_details || "",
    hospitalized_last_6_months: application.hospitalized_last_6_months === 1 || application.hospitalized_last_6_months === true,
    registration_type: application.registration_type || "",
    reg_status: application.reg_status || "approved",
    id_status: application.id_status || "",
    vital_status: application.vital_status || "",
    date_of_death: application.date_of_death || "",
    date_reviewed: application.date_reviewed || ""
  });

  useEffect(() => {
    if (application && !isEditing) {
      setFormData({
        id: application.id,
        application_id: application.application_id,
        citizen_id: application.citizen_id,
        scid_number: application.scid_number || "",
        username: application.username || "",
        temp_password: application.temp_password || "",
        first_name: application.first_name || "",
        middle_name: application.middle_name || "",
        last_name: application.last_name || "",
        suffix: application.suffix || "",
        birth_date: application.birth_date || "",
        age: application.age || "",
        sex: application.sex || "",
        civil_status: application.civil_status || "",
        citizenship: application.citizenship || "",
        birth_place: application.birth_place || "",
        address: application.address || "",
        barangay: application.barangay || "",
        city_municipality: application.city_municipality || "",
        district: application.district || "",
        province: application.province || "",
        email: application.email || "",
        contact_number: application.contact_number || "",
        living_arrangement: application.living_arrangement || "",
        is_pensioner: application.is_pensioner === 1 || application.is_pensioner === true,
        pension_source_gsis: application.pension_source_gsis === 1 || application.pension_source_gsis === true,
        pension_source_sss: application.pension_source_sss === 1 || application.pension_source_sss === true,
        pension_source_afpslai: application.pension_source_afpslai === 1 || application.pension_source_afpslai === true,
        pension_source_others: application.pension_source_others || "",
        pension_amount: application.pension_amount || "",
        has_permanent_income: application.has_permanent_income === 1 || application.has_permanent_income === true,
        permanent_income_source: application.permanent_income_source || "",
        has_regular_support: application.has_regular_support === 1 || application.has_regular_support === true,
        support_type_cash: application.support_type_cash === 1 || application.support_type_cash === true,
        support_cash_amount: application.support_cash_amount || "",
        support_cash_frequency: application.support_cash_frequency || "",
        support_type_inkind: application.support_type_inkind === 1 || application.support_type_inkind === true,
        support_inkind_details: application.support_inkind_details || "",
        has_illness: application.has_illness === 1 || application.has_illness === true,
        illness_details: application.illness_details || "",
        hospitalized_last_6_months: application.hospitalized_last_6_months === 1 || application.hospitalized_last_6_months === true,
        registration_type: application.registration_type || "",
        reg_status: application.reg_status || "approved",
        id_status: application.id_status || "",
        vital_status: application.vital_status || "",
        date_of_death: application.date_of_death || "",
        date_reviewed: application.date_reviewed || ""
      });
    }
  }, [application, isEditing]);

  if (!isOpen) return null;

  const calculateAge = (birth_date: string) => {
    if (!birth_date) return 0;
    const today = new Date();
    const birth = new Date(birth_date);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Minimal validation for Masterlist as requested
    const updatedApp: Application = {
      ...application,
      id: formData.id!,
      application_id: formData.application_id,
      citizen_id: formData.citizen_id,
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      suffix: formData.suffix,
      birth_date: formData.birth_date,
      age: Number(formData.age),
      sex: formData.sex,
      civil_status: formData.civil_status,
      citizenship: formData.citizenship,
      birth_place: formData.birth_place,
      address: formData.address,
      barangay: formData.barangay,
      city_municipality: formData.city_municipality,
      district: formData.district,
      province: formData.province,
      email: formData.email,
      contact_number: formData.contact_number,
      living_arrangement: formData.living_arrangement,
      is_pensioner: formData.is_pensioner ? 1 : 0,
      pension_source_gsis: formData.pension_source_gsis ? 1 : 0,
      pension_source_sss: formData.pension_source_sss ? 1 : 0,
      pension_source_afpslai: formData.pension_source_afpslai ? 1 : 0,
      pension_source_others: formData.pension_source_others,
      pension_amount: Number(formData.pension_amount),
      has_permanent_income: formData.has_permanent_income ? 1 : 0,
      permanent_income_source: formData.permanent_income_source,
      has_regular_support: formData.has_regular_support ? 1 : 0,
      support_type_cash: formData.support_type_cash ? 1 : 0,
      support_cash_amount: Number(formData.support_cash_amount),
      support_cash_frequency: formData.support_cash_frequency,
      support_type_inkind: formData.support_type_inkind ? 1 : 0,
      support_inkind_details: formData.support_inkind_details,
      has_illness: formData.has_illness ? 1 : 0,
      illness_details: formData.illness_details,
      hospitalized_last_6_months: formData.hospitalized_last_6_months ? 1 : 0,
      registration_type: formData.registration_type,
      reg_status: formData.reg_status as any,
      id_status: formData.id_status,
      vital_status: formData.vital_status,
      date_of_death: formData.date_of_death,
      date_reviewed: formData.date_reviewed,
      document: application.document
    };

    onSave(updatedApp, newFiles, removedFilePaths);
    setIsEditing(false);
    setNewFiles([]);
    setRemovedFilePaths([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'birth_date') {
        newData.age = calculateAge(value);
      }
      return newData;
    });
  };

  const handleToggle = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !(prev as any)[field]
    }));
  };

  const getAttachments = (attachments: any) => {
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const handleFileAction = async (path: string, filename: string, action: 'view' | 'download') => {
    setIsFetchingFile(true);
    try {
      const token = localStorage.getItem('token');
      const url = `https://api-dbosca.phoenix.com.ph/api/files/view?path=${encodeURIComponent(path)}&name=${encodeURIComponent(filename)}&action=${action}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File fetch failed:', { status: response.status, errorText, url });
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const blob = await response.blob();

      if (action === 'view') {
        let fileUrl: string | null = null;
        let fileType: string = blob.type;
        
        if (!fileType) {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) fileType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
          else if (ext === 'pdf') fileType = 'application/pdf';
          else fileType = 'application/octet-stream';
        }

        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await blob.text();
            if (text.trim().startsWith('{')) {
              const data = JSON.parse(text);
              fileUrl = data.url || data.data || data.content;
              if (data.file_type) fileType = data.file_type;
            }
          } catch (e) {
            console.warn('JSON parsing failed, using blob directly');
          }
        }

        if (!fileUrl) {
          fileUrl = window.URL.createObjectURL(blob);
        }

        setViewingFile({ url: fileUrl, filename, type: fileType });
      } else {
        const fileUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(fileUrl);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      alert('Failed to process file request. Please try again.');
    } finally {
      setIsFetchingFile(false);
    }
  };

  useEffect(() => {
    const currentUrl = viewingFile?.url;
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [viewingFile]);

  const [showTempPassword, setShowTempPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 lg:px-12 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {formData.first_name} {formData.middle_name} {formData.last_name} {formData.suffix}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  (() => {
                    const status = (formData.reg_status || 'PENDING').toString().toLowerCase();
                    if (status === 'approved') return "bg-emerald-50 text-emerald-600 border-emerald-100";
                    if (status === 'pending') return "bg-amber-50 text-amber-600 border-amber-100";
                    if (status === 'rejected' || status === 'disapproved') return "bg-rose-50 text-rose-600 border-rose-100";
                    return "bg-slate-50 text-slate-600 border-slate-100";
                  })()
                )}>
                  REGS: {formData.reg_status}
                </span>
                {formData.id_status && (
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    (() => {
                      const status = formData.id_status.toString().toLowerCase();
                      if (status === 'new' || status === 'pending') return "bg-amber-50 text-amber-600 border-amber-100";
                      if (status === 'printed') return "bg-blue-50 text-blue-600 border-blue-200";
                      if (status === 'released' || status === 'issued') return "bg-indigo-50 text-indigo-600 border-indigo-200";
                      if (status === 'for releasing') return "bg-blue-50 text-blue-600 border-blue-200";
                      if (status === 'rejected' || status === 'cancelled' || status === 'disapproved') return "bg-rose-50 text-rose-600 border-rose-200";
                      return "bg-slate-50 text-slate-600 border-slate-100";
                    })()
                  )}>
                    ID: {formData.id_status}
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">ID: {formData.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowActions(!showActions)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {showActions && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50"
                      >
                        <button 
                          onClick={() => {
                            onResetPassword((application.citizen_id as any) || application.id);
                            setShowActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          Reset Password
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button 
                          onClick={() => {
                            onMoveToPending(application.citizen_id as any);
                            setShowActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Move to Pending
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-6 h-12 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 h-12 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 no-scrollbar">
          <div className="space-y-8">
            <SectionHeader icon={User} title="Personal Information" color="bg-indigo-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Field label="SCID Number" value={formData.scid_number} field="scid_number" isEditing={isEditing} onChange={handleChange} disabled={true} />
              <Field label="First Name" value={formData.first_name} field="first_name" isEditing={isEditing} onChange={handleChange} />
              <Field label="Middle Name" value={formData.middle_name} field="middle_name" isEditing={isEditing} onChange={handleChange} />
              <Field label="Last Name" value={formData.last_name} field="last_name" isEditing={isEditing} onChange={handleChange} />
              <Field label="Suffix" value={formData.suffix} field="suffix" isEditing={isEditing} onChange={handleChange} />
              <Field label="Birthdate" value={formData.birth_date} field="birth_date" type="date" isEditing={isEditing} onChange={handleChange} />
              <Field label="Age" value={formData.age} field="age" type="number" isEditing={isEditing} onChange={handleChange} />
              <Field label="Sex" value={formData.sex} field="sex" type="select" options={['Male', 'Female']} isEditing={isEditing} onChange={handleChange} />
              <Field label="Civil Status" value={formData.civil_status} field="civil_status" type="select" options={['Single', 'Married', 'Widowed', 'Separated']} isEditing={isEditing} onChange={handleChange} />
              <Field label="Citizenship" value={formData.citizenship} field="citizenship" isEditing={isEditing} onChange={handleChange} />
              <Field label="Birth Place" value={formData.birth_place} field="birth_place" isEditing={isEditing} onChange={handleChange} />
              <Field label="Registration Type" value={formData.registration_type} field="registration_type" type="select" options={['Online', 'Walk-in']} isEditing={isEditing} onChange={handleChange} />
            </div>
          </div>

          {/* Section: Account Information */}
          <div className="space-y-8">
            <SectionHeader icon={CreditCard} title="Account Information" color="bg-slate-900" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <Field label="Username" value={formData.username} field="username" isEditing={isEditing} onChange={handleChange} disabled={true} />
              <div className="space-y-1.5 opacity-70">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporary Password</label>
                <div className="relative">
                  <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
                    {showTempPassword ? (formData.temp_password || '---') : '••••••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors pointer-events-auto"
                  >
                    {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <SectionHeader icon={MapPin} title="Residential Address" color="bg-rose-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Field label="Address" value={formData.address} field="address" isEditing={isEditing} onChange={handleChange} />
              </div>
              <Field 
                label="Barangay" 
                value={formData.barangay} 
                field="barangay" 
                type="select" 
                options={
                  formData.district === 'District 1' 
                    ? ['Balong-Bato', 'Corazon de Jesus', 'Ermitaño', 'Isabelita', 'Kabayanan', 'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Salapan', 'San Perfecto', 'Tibagan']
                    : formData.district === 'District 2'
                      ? ['Addition Hills', 'Batis', 'Greenhills', 'Little Baguio', 'Maytunas', 'Saint Joseph', 'Santa Lucia', 'West Crame']
                      : ['Addition Hills', 'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño', 'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Saint Joseph', 'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame']
                } 
                isEditing={isEditing} 
                onChange={handleChange} 
              />
              <Field label="City / Municipality" value={formData.city_municipality} field="city_municipality" isEditing={isEditing} onChange={handleChange} />
              <Field label="District" value={formData.district} field="district" type="select" options={['District 1', 'District 2']} isEditing={isEditing} onChange={handleChange} />
              <Field label="Province" value={formData.province} field="province" isEditing={isEditing} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-8">
            <SectionHeader icon={Briefcase} title="Socio-Economic Status" color="bg-emerald-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Field label="Living Arrangement" value={formData.living_arrangement} field="living_arrangement" type="select" options={['Owned', 'Rent', 'Living with Relatives', 'Others']} isEditing={isEditing} onChange={handleChange} />
              <Field label="Is Pensioner?" value={formData.is_pensioner} field="is_pensioner" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              {formData.is_pensioner && (
                <>
                  <div className="lg:col-span-2 flex gap-4">
                    <Field label="GSIS" value={formData.pension_source_gsis} field="pension_source_gsis" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
                    <Field label="SSS" value={formData.pension_source_sss} field="pension_source_sss" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
                    <Field label="AFPSLAI" value={formData.pension_source_afpslai} field="pension_source_afpslai" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
                  </div>
                  <Field label="Other Pension" value={formData.pension_source_others} field="pension_source_others" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Pension Amount" value={formData.pension_amount} field="pension_amount" type="number" isEditing={isEditing} onChange={handleChange} />
                </>
              )}
              <Field label="Permanent Income?" value={formData.has_permanent_income} field="has_permanent_income" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              {formData.has_permanent_income && (
                <Field label="Income Source" value={formData.permanent_income_source} field="permanent_income_source" isEditing={isEditing} onChange={handleChange} />
              )}
            </div>
          </div>

          <div className="space-y-8">
            <SectionHeader icon={Heart} title="Family Support" color="bg-pink-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Field label="Has Regular Support?" value={formData.has_regular_support} field="has_regular_support" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              {formData.has_regular_support && (
                <>
                  <Field label="Cash Support" value={formData.support_type_cash} field="support_type_cash" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
                  <Field label="Cash Amount" value={formData.support_cash_amount} field="support_cash_amount" type="number" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Frequency" value={formData.support_cash_frequency} field="support_cash_frequency" isEditing={isEditing} onChange={handleChange} />
                  <Field label="In-kind Support" value={formData.support_type_inkind} field="support_type_inkind" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
                  <div className="lg:col-span-2">
                    <Field label="In-kind Details" value={formData.support_inkind_details} field="support_inkind_details" isEditing={isEditing} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <SectionHeader icon={CheckCircle2} title="Health Information" color="bg-cyan-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Field label="Has Illness?" value={formData.has_illness} field="has_illness" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              <div className="md:col-span-2">
                <Field label="Illness Details" value={formData.illness_details} field="illness_details" isEditing={isEditing} onChange={handleChange} />
              </div>
              <Field label="Hospitalized (6mo)?" value={formData.hospitalized_last_6_months} field="hospitalized_last_6_months" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
            </div>
          </div>

          <div className="space-y-8">
            <SectionHeader icon={Phone} title="Contact Information" color="bg-blue-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <Field label="Mobile Number" value={formData.contact_number} field="contact_number" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <Field label="Email Address" value={formData.email} field="email" type="email" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 pb-12">
            <SectionHeader icon={FileText} title="Attachments" color="bg-slate-500" />
            
            {isEditing && (
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Download className="w-8 h-8 text-slate-300 group-hover:text-rose-500 transition-colors mb-2 rotate-180" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Click to upload new files</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files) {
                        setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(() => {
                const attachments = getAttachments(application.document).filter((f: any) => !removedFilePaths.includes(f.path));
                
                return (
                  <>
                    {attachments.map((file: any, idx: number) => (
                      <div key={`existing-${idx}`} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 relative group/file">
                        {isEditing && (
                          <button 
                            onClick={() => setRemovedFilePaths(prev => [...prev, file.path])}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{file.filename}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{file.file_type || 'Uploaded Document'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            disabled={isFetchingFile}
                            onClick={() => handleFileAction(file.path, file.filename, 'view')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFetchingFile ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5" />}
                            VIEW
                          </button>
                          <button 
                            type="button"
                            disabled={isFetchingFile}
                            onClick={() => handleFileAction(file.path, file.filename, 'download')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 border border-slate-200 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFetchingFile ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
                            DOWNLOAD
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {newFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-3 relative group/file">
                        <button 
                          onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/file:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <FileText className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-emerald-900 truncate uppercase tracking-tight">{file.name}</p>
                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">New Upload</p>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg font-black text-[8px] text-center uppercase tracking-widest">
                          Ready to Save
                        </div>
                      </div>
                    ))}

                    {attachments.length === 0 && newFiles.length === 0 && (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No attachments uploaded</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {viewingFile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingFile(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{viewingFile.filename}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingFile.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingFile(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className={cn(
                "flex-1 overflow-auto bg-slate-50 p-4 flex min-h-[400px]",
                (viewingFile.type === 'application/pdf' || viewingFile.url.toLowerCase().endsWith('.pdf') || viewingFile.url.startsWith('data:application/pdf') || viewingFile.isGoogleViewer)
                  ? "items-start justify-center"
                  : "items-center justify-center"
              )}>
                {viewingFile.url && (
                  (viewingFile.type.startsWith('image/') || viewingFile.url.startsWith('data:image')) && !viewingFile.isGoogleViewer ? (
                    <img 
                      src={viewingFile.url} 
                      alt={viewingFile.filename} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (viewingFile.type === 'application/pdf' || viewingFile.url.toLowerCase().endsWith('.pdf') || viewingFile.url.startsWith('data:application/pdf') || viewingFile.isGoogleViewer) ? (
                    <div className="w-full h-full flex flex-col gap-4">
                      {viewingFile.isGoogleViewer ? (
                        <iframe 
                          src={viewingFile.url} 
                          className="w-full h-full min-h-[600px] rounded-lg border border-slate-200 shadow-inner bg-white"
                          title={viewingFile.filename}
                        />
                      ) : (
                        <PdfViewer url={viewingFile.url} filename={viewingFile.filename} />
                      )}
                      {!viewingFile.isGoogleViewer && (
                        <div className="flex justify-center gap-4 pb-4">
                          <a 
                            href={viewingFile.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Open in New Tab
                          </a>
                          <button 
                            type="button"
                            onClick={() => {
                              const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(viewingFile.url || '')}&embedded=true`;
                              setViewingFile(prev => prev ? { ...prev, url: googleViewerUrl, isGoogleViewer: true } : null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Use Google Viewer
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-12">
                      <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Preview not available for this file type</p>
                      <button 
                        onClick={() => {
                          const attachments = getAttachments(application.document);
                          const file = attachments.find((d: any) => d.filename === viewingFile.filename);
                          if (file) {
                            handleFileAction(file.path, viewingFile.filename, 'download');
                          }
                        }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        Download to View
                      </button>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
