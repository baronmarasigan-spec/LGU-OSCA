import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Camera,
  RotateCcw,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Application } from '../App';
import PdfViewer from './PdfViewer';

interface RegistrationProfileModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedApp: Application, newFiles?: File[], removedFiles?: string[]) => void;
  initialIsEditing?: boolean;
}

interface ProfileFormData {
  id?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate: string;
  age: string | number;
  gender: string;
  civilStatus: string;
  citizenship: string;
  birthPlace: string;
  address: string;
  barangay: string;
  city: string;
  district: string;
  province: string;
  email: string;
  livingArrangement: string;
  isPensioner: boolean | null;
  gsis: boolean | null;
  sss: boolean | null;
  afpslai: boolean | null;
  otherPension: string;
  pensionAmount: string | number;
  hasIncome: boolean | null;
  incomeSource: string;
  hasSupport: boolean | null;
  supportCash: boolean | null;
  supportCashAmount: string | number;
  supportCashFrequency: string;
  supportInKind: boolean | null;
  supportInKindDetails: string;
  hasIllness: boolean | null;
  illnessDetails: string;
  hospitalized: boolean | null;
  contactNumber: string;
  registration_type: string;
  reg_status?: string;
  application_id?: string | number;
  citizen_id?: string | number;
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
    if (dateString === null || dateString === undefined) return 'N/A';
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
  const isNull = (val: any) => val === null || val === undefined;

  if (isEditing) {
    if (disabled) {
      return (
        <div className="space-y-1.5 opacity-70">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
            {isNull(value) ? 'N/A' : (value || '---')}
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
            value={isNull(value) ? '' : value} 
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
        {type === 'checkbox' 
          ? (isNull(value) ? 'N/A' : (isTrue(value) ? 'Yes' : 'No')) 
          : (type === 'date' ? formatDate(value) : (isNull(value) ? 'N/A' : (value || '---')))}
      </p>
    </div>
  );
};

export default function RegistrationProfileModal({ application, isOpen, onClose, onSave, initialIsEditing = false }: RegistrationProfileModalProps) {
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ url: string | null, filename: string, type: string, isGoogleViewer?: boolean } | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedFilePaths, setRemovedFilePaths] = useState<string[]>([]);
  const mapBool = (val: any) => (val === null || val === undefined) ? null : (val === 1 || val === true || val === "1");

  const [formData, setFormData] = useState<ProfileFormData>({
    id: application.id,
    firstName: application.first_name || "",
    middleName: application.middle_name || "",
    lastName: application.last_name || "",
    suffix: application.suffix || "",
    birthDate: application.birth_date || "",
    age: application.age || "",
    gender: application.sex || "",
    civilStatus: application.civil_status || "",
    citizenship: application.citizenship || "",
    birthPlace: application.birth_place || "",
    address: application.address || "",
    barangay: application.barangay || "",
    city: application.city_municipality || "",
    district: application.district || "",
    province: application.province || "",
    email: application.email || "",
    livingArrangement: application.living_arrangement || "",
    isPensioner: mapBool(application.is_pensioner),
    gsis: mapBool(application.pension_source_gsis),
    sss: mapBool(application.pension_source_sss),
    afpslai: mapBool(application.pension_source_afpslai),
    otherPension: application.pension_source_others || "",
    pensionAmount: application.pension_amount || "",
    hasIncome: mapBool(application.has_permanent_income),
    incomeSource: application.permanent_income_source || "",
    hasSupport: mapBool(application.has_regular_support),
    supportCash: mapBool(application.support_type_cash),
    supportCashAmount: application.support_cash_amount || "",
    supportCashFrequency: application.support_cash_frequency || "",
    supportInKind: mapBool(application.support_type_inkind),
    supportInKindDetails: application.support_inkind_details || "",
    hasIllness: mapBool(application.has_illness),
    illnessDetails: application.illness_details || "",
    hospitalized: mapBool(application.hospitalized_last_6_months),
    contactNumber: application.contact_number || "",
    registration_type: application.registration_type || "",
    reg_status: application.reg_status || "pending",
    application_id: application.application_id || application.id,
    citizen_id: application.citizen_id || ""
  });

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Camera access failed. Please allow camera permission.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const base64ToFile = (base64: string, filename: string) => {
    if (!base64 || !base64.includes(',')) return null;
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      console.error("Base64 to File conversion failed:", e);
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setIsCapturing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (application && !isEditing) {
      setFormData({
        id: application.id,
        firstName: application.first_name || "",
        middleName: application.middle_name || "",
        lastName: application.last_name || "",
        suffix: application.suffix || "",
        birthDate: application.birth_date || "",
        age: application.age || "",
        gender: application.sex || "",
        civilStatus: application.civil_status || "",
        citizenship: application.citizenship || "",
        birthPlace: application.birth_place || "",
        address: application.address || "",
        barangay: application.barangay || "",
        city: application.city_municipality || "",
        district: application.district || "",
        province: application.province || "",
        email: application.email || "",
        livingArrangement: application.living_arrangement || "",
        isPensioner: mapBool(application.is_pensioner),
        gsis: mapBool(application.pension_source_gsis),
        sss: mapBool(application.pension_source_sss),
        afpslai: mapBool(application.pension_source_afpslai),
        otherPension: application.pension_source_others || "",
        pensionAmount: application.pension_amount || "",
        hasIncome: mapBool(application.has_permanent_income),
        incomeSource: application.permanent_income_source || "",
        hasSupport: mapBool(application.has_regular_support),
        supportCash: mapBool(application.support_type_cash),
        supportCashAmount: application.support_cash_amount || "",
        supportCashFrequency: application.support_cash_frequency || "",
        supportInKind: mapBool(application.support_type_inkind),
        supportInKindDetails: application.support_inkind_details || "",
        hasIllness: mapBool(application.has_illness),
        illnessDetails: application.illness_details || "",
        hospitalized: mapBool(application.hospitalized_last_6_months),
        contactNumber: application.contact_number || "",
        registration_type: application.registration_type || "",
        reg_status: application.reg_status || "pending",
        application_id: application.application_id || application.id,
        citizen_id: application.citizen_id || ""
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

  const handleMoveToPending = () => {
    const updatedApp: Application = {
      ...application,
      reg_status: 'pending'
    };
    onSave(updatedApp);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (formData.contactNumber && formData.contactNumber.toString().trim() && formData.contactNumber.toString().length !== 11) {
      alert("Contact number must be 11 digits");
      return;
    }

    const updatedApp: Application = {
      ...application,
      id: formData.id!,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      birth_date: formData.birthDate,
      age: Number(formData.age),
      sex: formData.gender,
      civil_status: formData.civilStatus,
      citizenship: formData.citizenship,
      birth_place: formData.birthPlace,
      address: formData.address,
      barangay: formData.barangay,
      city_municipality: formData.city,
      district: formData.district,
      province: formData.province,
      email: formData.email,
      living_arrangement: formData.livingArrangement,
      is_pensioner: formData.isPensioner ? 1 : 0,
      pension_source_gsis: formData.gsis ? 1 : 0,
      pension_source_sss: formData.sss ? 1 : 0,
      pension_source_afpslai: formData.afpslai ? 1 : 0,
      pension_source_others: formData.otherPension,
      pension_amount: Number(formData.pensionAmount),
      has_permanent_income: formData.hasIncome ? 1 : 0,
      permanent_income_source: formData.incomeSource,
      has_regular_support: formData.hasSupport ? 1 : 0,
      support_type_cash: formData.supportCash ? 1 : 0,
      support_cash_amount: Number(formData.supportCashAmount),
      support_cash_frequency: formData.supportCashFrequency,
      support_type_inkind: formData.supportInKind ? 1 : 0,
      support_inkind_details: formData.supportInKindDetails,
      has_illness: formData.hasIllness ? 1 : 0,
      illness_details: formData.illnessDetails,
      hospitalized_last_6_months: formData.hospitalized ? 1 : 0,
      contact_number: formData.contactNumber,
      registration_type: formData.registration_type,
      reg_status: formData.reg_status as any,
      application_id: formData.application_id as any,
      citizen_id: formData.citizen_id as any
    };

    const finalNewFiles = [...newFiles];
    if (capturedPhoto) {
      const photoFile = base64ToFile(capturedPhoto, "captured_photo.jpg");
      if (photoFile) finalNewFiles.push(photoFile);
    }

    onSave(updatedApp, finalNewFiles, removedFilePaths);
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
      if (field === 'birthDate') {
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

  const isPending = formData.reg_status === 'pending';
  const isApproved = formData.reg_status === 'approved';
  const isDisapproved = formData.reg_status === 'disapproved';

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
                {formData.lastName}, {formData.firstName} {formData.middleName || ''}
              </h2>
              <div className="flex items-center gap-2 mt-1">
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
                  {formData.reg_status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• ID: {formData.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                {isPending && (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
                {isDisapproved && (
                  <button 
                    type="button"
                    onClick={handleMoveToPending}
                    className="flex items-center gap-2 px-6 h-12 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Move to Pending
                  </button>
                )}
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
              className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 no-scrollbar">
          <div className="space-y-8">
            <SectionHeader icon={User} title="PERSONAL INFORMATION" color="bg-indigo-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <Field label="First Name" value={formData.firstName} field="firstName" isEditing={isEditing} onChange={handleChange} />
        <Field label="Middle Name" value={formData.middleName} field="middleName" isEditing={isEditing} onChange={handleChange} />
        <Field label="Last Name" value={formData.lastName} field="lastName" isEditing={isEditing} onChange={handleChange} />
        <Field label="Suffix" value={formData.suffix} field="suffix" isEditing={isEditing} onChange={handleChange} />
        <Field label="Birthdate" value={formData.birthDate} field="birthDate" type="date" isEditing={isEditing} onChange={handleChange} />
        <Field label="Age" value={formData.age} field="age" type="number" isEditing={isEditing} onChange={handleChange} />
        <Field label="Sex" value={formData.gender} field="gender" type="select" options={['Male', 'Female']} isEditing={isEditing} onChange={handleChange} />
        <Field label="Civil Status" value={formData.civilStatus} field="civilStatus" type="select" options={['Single', 'Married', 'Widowed', 'Separated', 'Others']} isEditing={isEditing} onChange={handleChange} />
        <Field label="Citizenship" value={formData.citizenship} field="citizenship" isEditing={isEditing} onChange={handleChange} />
        <Field label="Birth Place" value={formData.birthPlace} field="birthPlace" isEditing={isEditing} onChange={handleChange} />
        <Field label="Registration Type" value={formData.registration_type} field="registration_type" type="select" options={['Online', 'Walk-in']} isEditing={isEditing} onChange={handleChange} />
        <Field label="Application ID" value={formData.application_id} field="application_id" isEditing={isEditing} onChange={handleChange} disabled={true} />
        {!( (formData.registration_type?.toLowerCase() || '').includes('annual cash gift') || (formData.registration_type?.toLowerCase() || '').includes('social pension')) && <Field label="Citizen ID" value={formData.citizen_id} field="citizen_id" isEditing={isEditing} onChange={handleChange} disabled={true} />}
      </div>
    </div>

    <div className="space-y-8 pt-8 border-t border-slate-50">
      <SectionHeader icon={MapPin} title="RESIDENTIAL ADDRESS" color="bg-rose-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
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
        <Field label="City / Municipality" value={formData.city} field="city" isEditing={isEditing} onChange={handleChange} />
        <Field label="District" value={formData.district} field="district" type="select" options={['District 1', 'District 2']} isEditing={isEditing} onChange={handleChange} />
        <Field label="Province" value={formData.province} field="province" isEditing={isEditing} onChange={handleChange} />
      </div>
    </div>

    <div className="space-y-8 pt-8 border-t border-slate-50">
      <SectionHeader icon={Briefcase} title="SOCIO-ECONOMIC STATUS" color="bg-emerald-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <Field label="Living Arrangement" value={formData.livingArrangement} field="livingArrangement" type="select" options={['Owned', 'Rent', 'Living with Relatives', 'Others']} isEditing={isEditing} onChange={handleChange} />
        <Field label="Is Pensioner?" value={formData.isPensioner} field="isPensioner" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
        {formData.isPensioner && (
          <>
            <div className="lg:col-span-2 flex items-center gap-6">
              <Field label="GSIS" value={formData.gsis} field="gsis" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              <Field label="SSS" value={formData.sss} field="sss" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
              <Field label="AFPSLAI" value={formData.afpslai} field="afpslai" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
            </div>
            <Field label="Other Pension" value={formData.otherPension} field="otherPension" isEditing={isEditing} onChange={handleChange} />
            <Field label="Pension Amount" value={formData.pensionAmount} field="pensionAmount" type="number" isEditing={isEditing} onChange={handleChange} />
          </>
        )}
        <Field label="Permanent Income?" value={formData.hasIncome} field="hasIncome" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
        {formData.hasIncome && (
          <Field label="Income Source" value={formData.incomeSource} field="incomeSource" isEditing={isEditing} onChange={handleChange} />
        )}
      </div>
    </div>

    <div className="space-y-8 pt-8 border-t border-slate-50">
      <SectionHeader icon={Heart} title="FAMILY SUPPORT" color="bg-pink-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <Field label="Has Regular Support?" value={formData.hasSupport} field="hasSupport" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
        {formData.hasSupport && (
          <>
            <Field label="Cash Support" value={formData.supportCash} field="supportCash" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
            <Field label="Cash Amount" value={formData.supportCashAmount} field="supportCashAmount" type="number" isEditing={isEditing} onChange={handleChange} />
            <Field label="Frequency" value={formData.supportCashFrequency} field="supportCashFrequency" isEditing={isEditing} onChange={handleChange} />
            <Field label="In-kind Support" value={formData.supportInKind} field="supportInKind" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
            <div className="lg:col-span-2">
              <Field label="In-kind Details" value={formData.supportInKindDetails} field="supportInKindDetails" isEditing={isEditing} onChange={handleChange} />
            </div>
          </>
        )}
      </div>
    </div>

    <div className="space-y-8 pt-8 border-t border-slate-50">
      <SectionHeader icon={CheckCircle2} title="HEALTH INFORMATION" color="bg-cyan-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
        <Field label="Has Illness?" value={formData.hasIllness} field="hasIllness" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
        <div className="md:col-span-2">
          <Field label="Illness Details" value={formData.illnessDetails} field="illnessDetails" isEditing={isEditing} onChange={handleChange} />
        </div>
        <Field label="Hospitalized (6mo)?" value={formData.hospitalized} field="hospitalized" type="checkbox" isEditing={isEditing} onChange={handleToggle} />
      </div>
    </div>

    <div className="space-y-8 pt-8 border-t border-slate-50">
      <SectionHeader icon={Phone} title="CONTACT INFORMATION" color="bg-blue-500" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0 mt-1">
            <Phone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <Field label="Mobile Number" value={formData.contactNumber} field="contactNumber" isEditing={isEditing} onChange={handleChange} />
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0 mt-1">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-rose-50/20 p-6 rounded-[2.5rem] border border-rose-100/50">
                {/* Photo Capture Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Photo Capture</h4>
                    </div>
                    {capturedPhoto && (
                      <button 
                        onClick={() => setCapturedPhoto(null)}
                        className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                      >
                        Retake
                      </button>
                    )}
                  </div>

                  <div className={cn(
                    "relative aspect-video rounded-[2rem] border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all",
                    capturedPhoto ? "border-emerald-500 bg-white" : "border-slate-300 bg-white/50"
                  )}>
                    {isCapturing ? (
                      <div className="absolute inset-0 bg-slate-900">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                          <button 
                            type="button" 
                            onClick={capturePhoto}
                            className="p-4 bg-rose-500 text-white rounded-full shadow-xl hover:scale-105 transition-all"
                          >
                            <Camera className="w-6 h-6" />
                          </button>
                          <button 
                            type="button" 
                            onClick={stopCamera}
                            className="p-4 bg-slate-800 text-white rounded-full shadow-xl hover:scale-105 transition-all"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ) : capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                      <button 
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Click to launch camera</span>
                      </button>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Upload Files</h4>
                  </div>
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-300 rounded-[2rem] hover:bg-white hover:border-rose-500 transition-all cursor-pointer group bg-white/50">
                    <div className="flex flex-col items-center justify-center">
                      <Download className="w-8 h-8 text-slate-300 group-hover:text-rose-500 transition-colors mb-2 rotate-180" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Drop files or click to upload</p>
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
