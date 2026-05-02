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
  Trash2,
  Camera,
  Upload,
  RotateCcw,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Application } from '../App';
import PdfViewer from './PdfViewer';

const formatDate = (date: any) => {
  if (!date) return '---';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getFileUrl = (file: any) => {
  if (!file) return null;

  const storageBaseUrl = "https://api-dbosca.phoenix.com.ph/storage/";

  // If it's a data URL or already absolute, return as is
  if (typeof file === "string" && (file.startsWith('data:') || file.startsWith('http'))) {
    return file;
  }

  // If it starts with /api/, it's already a full view URL from the backend
  if (typeof file === "string" && file.startsWith('/api/')) {
    return `https://api-dbosca.phoenix.com.ph${file}`;
  }

  // If JSON string → parse
  if (typeof file === "string" && file.startsWith("[")) {
    try {
      const parsed = JSON.parse(file);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const path = parsed[0].path || parsed[0].file_path;
        return path ? `${storageBaseUrl}${path}` : null;
      }
    } catch (e) {
      console.error("JSON parse error in getFileUrl:", e);
    }
  }

  // If already array
  if (Array.isArray(file)) {
    if (file.length > 0) {
      const path = file[0].path || file[0].file_path;
      return path ? `${storageBaseUrl}${path}` : null;
    }
    return null;
  }

  // If raw string path
  if (typeof file === "string") {
    // Clean potential quotes
    const cleanPath = file.replace(/^["']|["']$/g, '');
    return `${storageBaseUrl}${cleanPath}`;
  }

  return null;
};

const getRawPath = (file: any) => {
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
     if (file.includes('/storage/')) {
       const parts = file.split('/storage/');
       if (parts.length > 1) return parts[1];
     }
     if (file.includes('path=')) {
       try {
         const url = new URL(file);
         const path = url.searchParams.get('path');
         if (path) return path;
       } catch (e) {
         const match = file.match(/[?&]path=([^&]+)/);
         if (match) return decodeURIComponent(match[1]);
       }
     }
  }
  return file;
};

const AuthenticatedPreview = ({ path, label }: { path: string, label: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    
    // If it's already a data URL
    if (path.startsWith('data:')) {
      setUrl(path);
      setLoading(false);
      return;
    }

    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        const cleanPath = path.includes('/storage/') ? path.split('/storage/')[1] : path;
        
        // If it's a full external URL but not ours
        if (path.startsWith('http') && !path.includes('api-dbosca.phoenix.com.ph')) {
           setUrl(path);
           setLoading(false);
           return;
        }

        const response = await fetch(`https://api-dbosca.phoenix.com.ph/api/files/view?path=${encodeURIComponent(cleanPath)}&action=view`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          setUrl(URL.createObjectURL(blob));
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
    return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); };
  }, [path]);

  if (loading) return <div className="flex items-center justify-center p-4"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>;
  if (error || !url) return <div className="flex flex-col items-center gap-2"><AlertCircle className="w-8 h-8 text-slate-200" /><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Load Error</span></div>;

  const isPdf = path.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');

  if (isPdf) return <div className="flex flex-col items-center gap-2 px-4 text-center"><FileText className="w-8 h-8 text-rose-400" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PDF Document</span></div>;

  return <img src={url} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
};

interface BenefitsProfileModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedApp: Application, files?: File[]) => Promise<void> | void;
  readOnly?: boolean;
  initialIsEditing?: boolean;
}

interface ProfileFormData {
  id?: number;
  citizen_id: string;
  scid_number: string;
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
  isPensioner: boolean;
  gsis: boolean;
  sss: boolean;
  afpslai: boolean;
  otherPension: string;
  pensionAmount: string | number;
  hasIncome: boolean;
  incomeSource: string;
  hasSupport: boolean;
  supportCash: boolean;
  supportCashAmount: string | number;
  supportCashFrequency: string;
  supportInKind: boolean;
  supportInKindDetails: string;
  hasIllness: boolean;
  illnessDetails: string;
  hospitalized: boolean;
  contactNumber: string;
  registration_type: string;
  reg_status?: string;
  incentive_tier?: string | number;
  created_at?: string;
  remarks?: string;
  // Wedding specific
  husband_first_name?: string;
  husband_middle_name?: string;
  husband_last_name?: string;
  husband_birth_date?: string;
  husband_age?: string | number;
  husband_contact_number?: string;
  wife_first_name?: string;
  wife_middle_name?: string;
  wife_last_name?: string;
  wife_birth_date?: string;
  wife_age?: string | number;
  wife_contact_number?: string;
  marriage_date?: string;
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
  disabled = false,
  placeholder
}: { 
  label: string, 
  value: any, 
  field: string, 
  isEditing: boolean,
  onChange: (field: string, value: any) => void,
  type?: string, 
  options?: string[],
  disabled?: boolean,
  placeholder?: string
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
        ) : type === "textarea" ? (
          <textarea 
            value={value || ''} 
            onChange={(e) => onChange(field, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
            placeholder={placeholder}
          />
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
            placeholder={placeholder}
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

export default function BenefitsProfileModal({ 
  application, 
  isOpen, 
  onClose, 
  onSave, 
  readOnly = false,
  initialIsEditing = false 
}: BenefitsProfileModalProps) {
  const app = application as any;
  const isExisting = !!application.id;
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fullApplication, setFullApplication] = useState<any>(application);

  // Attachment and Photo Capture State
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(initialIsEditing);
      setNewAttachments([]);
      setCapturedPhoto(null);
      setIsCapturing(false);
      setFullApplication(application);

      // Fetch full details if it's an existing record
      if (application.id) {
        fetchFullDetails();
      }
    }
  }, [isOpen, initialIsEditing, application.id]);

  const fetchFullDetails = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      const regType = (application.registration_type || "").toLowerCase();
      const isWedding = regType.includes("wedding");
      const isBirthday = regType.includes("birthday");
      
      if (isWedding) {
        endpoint = `https://api-dbosca.phoenix.com.ph/api/wedding-anniversary-incentives`;
      } else if (isBirthday) {
        endpoint = `https://api-dbosca.phoenix.com.ph/api/birthday-incentives`;
      } else if (regType.includes("social pension")) {
        endpoint = `https://api-dbosca.phoenix.com.ph/api/social-pension/${application.id}`;
      } else {
        endpoint = `https://api-dbosca.phoenix.com.ph/api/benefit-applications/${application.id}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (isWedding) {
          // If it's a wedding record, we fetch the list and find the ID (as suggested by the list endpoint screenshot)
          const rawData = result.data || result;
          const arrayData = Array.isArray(rawData) ? rawData : (rawData.data || []);
          const sourceItem = Array.isArray(arrayData) ? arrayData.find((it: any) => Number(it.id) === Number(application.id)) : null;
          
          if (sourceItem) {
            const husband = sourceItem.husband || {};
            const wife = sourceItem.wife || {};
            const details = sourceItem.marriage_details || {};
            const location = sourceItem.location || {};
            
            // Try to split full name if individuals are missing (common for "data accuracy" requests when source only has full_name)
            const splitName = (fullName: string) => {
              if (!fullName) return { first: "", last: "", middle: "" };
              const parts = fullName.split(' ');
              if (parts.length === 1) return { first: parts[0], last: "", middle: "" };
              if (parts.length === 2) return { first: parts[0], last: parts[1], middle: "" };
              return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
            };

            const hName = splitName(husband.full_name);
            const wName = splitName(wife.full_name);

            const normalized = {
              ...sourceItem,
              id: sourceItem.id,
              husband_first_name: husband.first_name || hName.first || "",
              husband_middle_name: husband.middle_name || hName.middle || "",
              husband_last_name: husband.last_name || hName.last || "",
              husband_birth_date: husband.birth_date || "",
              husband_age: Number(husband.age || 0),
              husband_contact_number: husband.contact_number || "",
              wife_first_name: wife.first_name || wName.first || "",
              wife_middle_name: wife.middle_name || wName.middle || "",
              wife_last_name: wife.last_name || wName.last || "",
              wife_birth_date: wife.birth_date || "",
              wife_age: Number(wife.age || 0),
              wife_contact_number: wife.contact_number || "",
              marriage_date: details.marriage_date || "",
              marriage_certificate_url: details.certificate_url || "",
              barangay: location.barangay || "",
              city_municipality: location.city_municipality || "",
              province: location.province || "",
              status: (sourceItem.status || "pending").toLowerCase(),
              reg_status: (sourceItem.status || "pending").toLowerCase(),
              disbursement_status: String(sourceItem.disbursement?.status || sourceItem.disbursement_status || "pending").toLowerCase(),
              registration_type: "50th Wedding Anniversary Incentive",
              submitted_at: sourceItem.submitted_at || sourceItem.created_at || "",
              updated_at: sourceItem.updated_at || ""
            };
            setFullApplication(normalized);
          }
        } else if (isBirthday) {
          const rawData = result.data || result;
          const arrayData = Array.isArray(rawData) ? rawData : (rawData.data || []);
          const sourceItem = Array.isArray(arrayData) ? arrayData.find((it: any) => Number(it.id) === Number(application.id)) : null;

          if (sourceItem) {
            const splitName = (fullName: string) => {
              if (!fullName) return { first: "", last: "", middle: "" };
              const parts = fullName.trim().split(' ');
              if (parts.length === 1) return { first: parts[0], last: "", middle: "" };
              if (parts.length === 2) return { first: parts[0], last: parts[1], middle: "" };
              return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
            };

            const nameParts = splitName(sourceItem.full_name);

            const normalized = {
              ...sourceItem,
              first_name: sourceItem.first_name || nameParts.first,
              middle_name: sourceItem.middle_name || nameParts.middle,
              last_name: sourceItem.last_name || nameParts.last,
              registration_type: "Birthday Cash Incentive",
              incentive_tier: sourceItem.tier || sourceItem.incentive_tier || "",
              status: (sourceItem.status || "pending").toLowerCase(),
              reg_status: (sourceItem.status || "pending").toLowerCase(),
              disbursement_status: String(sourceItem.disbursement?.status || sourceItem.disbursement_status || "pending").toLowerCase(),
              birth_certificate_url: sourceItem.view_birth_cert || sourceItem.birth_certificate_url || ""
            };
            setFullApplication(normalized);
          }
        } else {
          const data = result.data || result;
          let normalized = { ...data };
          
          if (regType.includes("birthday")) {
            normalized = {
              ...normalized,
              registration_type: "Birthday Cash Incentive",
              incentive_tier: data.tier || data.incentive_tier || ""
            };
          } else if (regType.includes("social pension")) {
              normalized = {
                  ...normalized,
                  registration_type: "Social Pension (DSWD)"
              };
          } else {
              normalized = {
                  ...normalized,
                  registration_type: "Annual Cash Gift"
              };
          }
          setFullApplication(normalized);
        }
      }
    } catch (error) {
      console.error("Error fetching full details:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      setNewAttachments(prev => [...prev, ...fileList]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
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

  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ 
    url: string | null, 
    directUrl?: string,
    filename: string, 
    type: string, 
    jsonData?: any,
    isPdf?: boolean
  } | null>(null);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    id: fullApplication.id,
    citizen_id: fullApplication.citizen_id || "",
    scid_number: fullApplication.scid_number || "",
    firstName: fullApplication.first_name || "",
    middleName: fullApplication.middle_name || "",
    lastName: fullApplication.last_name || "",
    suffix: fullApplication.suffix || "",
    birthDate: fullApplication.birth_date || "",
    age: fullApplication.age || "",
    gender: fullApplication.sex || "",
    civilStatus: fullApplication.civil_status || "",
    citizenship: fullApplication.citizenship || "",
    birthPlace: fullApplication.birth_place || "",
    address: fullApplication.address || "",
    barangay: fullApplication.barangay || "",
    city: fullApplication.city_municipality || "",
    district: fullApplication.district || "",
    province: fullApplication.province || "",
    email: fullApplication.email || "",
    livingArrangement: fullApplication.living_arrangement || "",
    isPensioner: fullApplication.is_pensioner === 1,
    gsis: fullApplication.pension_source_gsis === 1,
    sss: fullApplication.pension_source_sss === 1,
    afpslai: fullApplication.pension_source_afpslai === 1,
    otherPension: fullApplication.pension_source_others || "",
    pensionAmount: fullApplication.pension_amount || "",
    hasIncome: fullApplication.has_permanent_income === 1,
    incomeSource: fullApplication.permanent_income_source || "",
    hasSupport: fullApplication.has_regular_support === 1,
    supportCash: fullApplication.support_type_cash === 1,
    supportCashAmount: fullApplication.support_cash_amount || "",
    supportCashFrequency: fullApplication.support_cash_frequency || "",
    supportInKind: fullApplication.support_type_inkind === 1,
    supportInKindDetails: fullApplication.support_inkind_details || "",
    hasIllness: fullApplication.has_illness === 1,
    illnessDetails: fullApplication.illness_details || "",
    hospitalized: fullApplication.hospitalized_last_6_months === 1,
    contactNumber: fullApplication.contact_number || "",
    registration_type: fullApplication.registration_type || "",
    reg_status: ((fullApplication as any).status || fullApplication.reg_status || "pending").toLowerCase(),
    incentive_tier: (fullApplication as any).incentive_tier || "",
    created_at: (fullApplication as any).created_at || (fullApplication as any).submitted_at || "",
    remarks: fullApplication.remarks || "",
    // Wedding specific
    husband_first_name: (fullApplication as any).husband_first_name || "",
    husband_middle_name: (fullApplication as any).husband_middle_name || "",
    husband_last_name: (fullApplication as any).husband_last_name || "",
    husband_birth_date: (fullApplication as any).husband_birth_date || "",
    husband_age: (fullApplication as any).husband_age || "",
    husband_contact_number: (fullApplication as any).husband_contact_number || "",
    wife_first_name: (fullApplication as any).wife_first_name || "",
    wife_middle_name: (fullApplication as any).wife_middle_name || "",
    wife_last_name: (fullApplication as any).wife_last_name || "",
    wife_birth_date: (fullApplication as any).wife_birth_date || "",
    wife_age: (fullApplication as any).wife_age || "",
    wife_contact_number: (fullApplication as any).wife_contact_number || "",
    marriage_date: (fullApplication as any).marriage_date || ""
  });

  useEffect(() => {
    if (fullApplication && !isEditing) {
      setFormData({
        id: fullApplication.id,
        citizen_id: fullApplication.citizen_id || "",
        scid_number: fullApplication.scid_number || "",
        firstName: fullApplication.first_name || "",
        middleName: fullApplication.middle_name || "",
        lastName: fullApplication.last_name || "",
        suffix: fullApplication.suffix || "",
        birthDate: fullApplication.birth_date || "",
        age: fullApplication.age || "",
        gender: fullApplication.sex || "",
        civilStatus: fullApplication.civil_status || "",
        citizenship: fullApplication.citizenship || "",
        birthPlace: fullApplication.birth_place || "",
        address: fullApplication.address || "",
        barangay: fullApplication.barangay || "",
        city: fullApplication.city_municipality || "",
        district: fullApplication.district || "",
        province: fullApplication.province || "",
        email: fullApplication.email || "",
        livingArrangement: fullApplication.living_arrangement || "",
        isPensioner: fullApplication.is_pensioner === 1,
        gsis: fullApplication.pension_source_gsis === 1,
        sss: fullApplication.pension_source_sss === 1,
        afpslai: fullApplication.pension_source_afpslai === 1,
        otherPension: fullApplication.pension_source_others || "",
        pensionAmount: fullApplication.pension_amount || "",
        hasIncome: fullApplication.has_permanent_income === 1,
        incomeSource: fullApplication.permanent_income_source || "",
        hasSupport: fullApplication.has_regular_support === 1,
        supportCash: fullApplication.support_type_cash === 1,
        supportCashAmount: fullApplication.support_cash_amount || "",
        supportCashFrequency: fullApplication.support_cash_frequency || "",
        supportInKind: fullApplication.support_type_inkind === 1,
        supportInKindDetails: fullApplication.support_inkind_details || "",
        hasIllness: fullApplication.has_illness === 1,
        illnessDetails: fullApplication.illness_details || "",
        hospitalized: fullApplication.hospitalized_last_6_months === 1,
        contactNumber: fullApplication.contact_number || "",
        registration_type: fullApplication.registration_type || "",
        reg_status: ((fullApplication as any).status || fullApplication.reg_status || "pending").toLowerCase(),
        incentive_tier: (fullApplication as any).incentive_tier || "",
        created_at: (fullApplication as any).created_at || (fullApplication as any).submitted_at || "",
        remarks: fullApplication.remarks || "" ,
        // Wedding specific
        husband_first_name: (fullApplication as any).husband_first_name || "",
        husband_middle_name: (fullApplication as any).husband_middle_name || "",
        husband_last_name: (fullApplication as any).husband_last_name || "",
        husband_birth_date: (fullApplication as any).husband_birth_date || "",
        husband_age: (fullApplication as any).husband_age || "",
        husband_contact_number: (fullApplication as any).husband_contact_number || "",
        wife_first_name: (fullApplication as any).wife_first_name || "",
        wife_middle_name: (fullApplication as any).wife_middle_name || "",
        wife_last_name: (fullApplication as any).wife_last_name || "",
        wife_birth_date: (fullApplication as any).wife_birth_date || "",
        wife_age: (fullApplication as any).wife_age || "",
        wife_contact_number: (fullApplication as any).wife_contact_number || "",
        marriage_date: (fullApplication as any).marriage_date || ""
      });
    }
  }, [fullApplication, isEditing]);

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

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (formData.contactNumber && formData.contactNumber.toString().trim() && formData.contactNumber.toString().length !== 11) {
      alert("Contact number must be 11 digits");
      return;
    }

    setIsSaving(true);
    try {
      const updatedApp: any = {
        ...application,
        id: formData.id!,
        citizen_id: formData.citizen_id,
        scid_number: formData.scid_number,
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
        incentive_tier: formData.incentive_tier,
        remarks: formData.remarks,
        // Wedding specific
        husband_first_name: formData.husband_first_name,
        husband_middle_name: formData.husband_middle_name,
        husband_last_name: formData.husband_last_name,
        husband_birth_date: formData.husband_birth_date,
        husband_age: Number(formData.husband_age),
        husband_contact_number: formData.husband_contact_number,
        wife_first_name: formData.wife_first_name,
        wife_middle_name: formData.wife_middle_name,
        wife_last_name: formData.wife_last_name,
        wife_birth_date: formData.wife_birth_date,
        wife_age: Number(formData.wife_age),
        wife_contact_number: formData.wife_contact_number,
        marriage_date: formData.marriage_date
      };

      const files: File[] = [...newAttachments];
      if (capturedPhoto) {
        const photoFile = base64ToFile(capturedPhoto, "captured_photo.jpg");
        if (photoFile) files.push(photoFile);
      }

      await onSave(updatedApp, files);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Save error:", error);
      alert(error.message || "An error occurred during save");
    } finally {
      setIsSaving(false);
    }
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
      if (field === 'husband_birth_date') {
        newData.husband_age = calculateAge(value);
      }
      if (field === 'wife_birth_date') {
        newData.wife_age = calculateAge(value);
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
    if (path.startsWith('data:')) {
      if (action === 'view') {
        const fileType = path.split(';')[0].split(':')[1];
        setViewingFile({ url: path, filename, type: fileType });
      } else {
        const link = document.createElement('a');
        link.href = path;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      return;
    }

    if (path.startsWith('http')) {
      if (action === 'view') {
        const isPdf = path.toLowerCase().endsWith('.pdf');
        setViewingFile({ 
          url: path, 
          directUrl: path,
          filename, 
          type: isPdf ? 'application/pdf' : 'image', 
          isPdf 
        });
      } else {
        const link = document.createElement('a');
        link.href = path;
        link.setAttribute('download', filename);
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      return;
    }

    setIsFetchingFile(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = `https://api-dbosca.phoenix.com.ph/api/files/view`;
      
      // Ensure name has an extension for the API to guess mime type correctly if not provided
      let finalName = filename;
      if (!finalName.includes('.')) {
        const ext = path.split('.').pop()?.toLowerCase();
        if (ext && ext.length <= 4 && /^[a-z0-9]+$/.test(ext)) {
          finalName = `${filename}.${ext}`;
        } else {
          // Default to common extension if we can't find one
          finalName = `${filename}.jpg`;
        }
      }

      const queryParams = `path=${encodeURIComponent(path)}&name=${encodeURIComponent(finalName)}&action=${action}`;
      const url = `${baseUrl}?${queryParams}`;
      
      // Debug: Log the file URL
      console.log(`[DEBUG] Fetching file: ${url}`);

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
        let fileType: string = blob.type || (filename.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? 'image' : 'document');
        let jsonData: any = null;
        let isPdf = filename.toLowerCase().endsWith('.pdf') || 
                   blob.type === 'application/pdf' || 
                   blob.type === 'application/x-pdf';

        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await blob.text();
            jsonData = JSON.parse(text);
          } catch (e) {
            console.warn('JSON parsing failed');
          }
        }

        if (isPdf || (!jsonData && (fileType.startsWith('image/') || filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)))) {
          // Requirement: Ensure correct blob type for PDF and use response()->file() style
          const finalBlob = isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob;
          fileUrl = window.URL.createObjectURL(finalBlob);
        }

        // Add token to direct URL for Google Viewer fallback if possible
        const directUrl = `${url}${token ? `&token=${token}` : ''}`;
        
        setPdfError(false);
        setUseGoogleViewer(false);
        setViewingFile({ url: fileUrl, directUrl, filename, type: fileType, jsonData, isPdf });
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
    if (viewingFile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingFile]);

  useEffect(() => {
    const currentUrl = viewingFile?.url;
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [viewingFile]);

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
                {formData.registration_type?.includes('Wedding') 
                  ? `${formData.husband_last_name}, ${formData.husband_first_name} & ${formData.wife_first_name}`
                  : `${formData.lastName}, ${formData.firstName} ${formData.middleName || ''}`
                }
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                  (String(formData.reg_status || "").toLowerCase() === 'approved') ? "bg-emerald-50 text-emerald-600" :
                  (String(formData.reg_status || "").toLowerCase() === 'pending') ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                )}>
                  {formData.reg_status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• ID: {formData.id || application.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              !readOnly && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )
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
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 h-12 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
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
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 no-scrollbar relative">
          <AnimatePresence>
            {isLoadingData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4"
              >
                <Loader2 className="w-12 h-12 text-[#ef4444] animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching Details...</p>
              </motion.div>
            )}
          </AnimatePresence>
          {(() => {
            const isSocialPension = formData.registration_type?.toLowerCase().includes('social pension');
            
            if (isSocialPension) {
              return (
                <div className="space-y-12">
                  <div className="space-y-8">
                    <SectionHeader icon={User} title="Personal Information" color="bg-indigo-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <Field label="SCID Number" value={formData.scid_number} field="scid_number" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="First Name" value={formData.firstName} field="firstName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Middle Name" value={formData.middleName} field="middleName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Last Name" value={formData.lastName} field="lastName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Birthdate" value={formData.birthDate} field="birthDate" type="date" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Age" value={formData.age} field="age" type="number" isEditing={isEditing} onChange={handleChange} disabled={true} />
                      <Field label="Contact Number" value={formData.contactNumber} field="contactNumber" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionHeader icon={MapPin} title="Location" color="bg-emerald-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <Field label="Barangay" value={formData.barangay} field="barangay" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="City / Municipality" value={formData.city} field="city" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Province" value={formData.province} field="province" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionHeader icon={ClipboardList} title="Status & Timestamps" color="bg-blue-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <Field 
                        label="Registration Status" 
                        value={formData.reg_status} 
                        field="reg_status" 
                        isEditing={isEditing} 
                        onChange={handleChange} 
                        type="select"
                        options={['pending', 'approved', 'disapproved']}
                      />
                      <Field 
                        label="Date Submitted" 
                        value={formatDate(formData.created_at)} 
                        field="created_at" 
                        isEditing={false} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  {/* REMARKS for Social Pension */}
                  <div className="space-y-8">
                    <SectionHeader icon={PenTool} title="Remarks" color="bg-slate-700" />
                    <div className="grid grid-cols-1 gap-8">
                      <Field 
                        label="Administrative Remarks" 
                        value={formData.remarks} 
                        field="remarks" 
                        isEditing={isEditing} 
                        onChange={handleChange} 
                        type="textarea"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <>
                {formData.registration_type?.includes('Wedding') ? (
                <div className="space-y-12">
              {/* Husband Information */}
              <div className="space-y-8">
                <SectionHeader icon={User} title="Husband Information" color="bg-blue-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Field label="First Name" value={formData.husband_first_name} field="husband_first_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Middle Name" value={formData.husband_middle_name} field="husband_middle_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Last Name" value={formData.husband_last_name} field="husband_last_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Birthdate" value={formData.husband_birth_date} field="husband_birth_date" type="date" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Age" value={formData.husband_age} field="husband_age" isEditing={false} onChange={handleChange} />
                  <Field label="Contact" value={formData.husband_contact_number} field="husband_contact_number" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>

              {/* Wife Information */}
              <div className="space-y-8">
                <SectionHeader icon={User} title="Wife Information" color="bg-rose-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Field label="First Name" value={formData.wife_first_name} field="wife_first_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Middle Name" value={formData.wife_middle_name} field="wife_middle_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Last Name" value={formData.wife_last_name} field="wife_last_name" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Birthdate" value={formData.wife_birth_date} field="wife_birth_date" type="date" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Age" value={formData.wife_age} field="wife_age" isEditing={false} onChange={handleChange} />
                  <Field label="Contact" value={formData.wife_contact_number} field="wife_contact_number" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>

              {/* Marriage Details */}
              <div className="space-y-8">
                <SectionHeader icon={Heart} title="Marriage Details" color="bg-red-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Field label="Marriage Date" value={formData.marriage_date} field="marriage_date" type="date" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>

              {/* Certificate */}
              <div className="space-y-8">
                <SectionHeader icon={FileText} title="Marriage Certificate" color="bg-slate-500" />
                <div className="w-full bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
                  {(() => {
                    const rawPath = getRawPath(app.marriage_certificate_url || app.marriage_details?.certificate_url || app.certificate_url);
                    
                    if (!rawPath) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <AlertCircle className="w-12 h-12 text-slate-200" />
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest tracking-tight">No certificate uploaded</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="relative bg-white min-h-[400px] flex items-center justify-center p-4">
                          <AuthenticatedPreview path={rawPath} label="Marriage Certificate" />
                        </div>
                        <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                          <button 
                            type="button"
                            onClick={() => handleFileAction(rawPath, "Marriage Certificate", 'view')}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 outline-none"
                          >
                            <Eye className="w-4 h-4" /> View Fullscreen
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleFileAction(rawPath, "Marriage Certificate.pdf", 'download')}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 outline-none"
                          >
                            <Download className="w-4 h-4" /> Download Certificate
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-8">
                <SectionHeader icon={MapPin} title="Location" color="bg-emerald-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Field label="Barangay" value={formData.barangay} field="barangay" isEditing={isEditing} onChange={handleChange} />
                  <Field label="City / Municipality" value={formData.city} field="city" isEditing={isEditing} onChange={handleChange} />
                  <Field label="Province" value={formData.province} field="province" isEditing={isEditing} onChange={handleChange} />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-8">
                <SectionHeader icon={PenTool} title="Remarks" color="bg-slate-700" />
                <div className="grid grid-cols-1 gap-8">
                  <Field 
                    label="Administrative Remarks" 
                    value={formData.remarks} 
                    field="remarks" 
                    isEditing={isEditing} 
                    onChange={handleChange} 
                    type="textarea"
                  />
                </div>
              </div>

              {/* Status & Timestamps */}
              <div className="space-y-8">
                <SectionHeader icon={ClipboardList} title="Status & Timestamps" color="bg-indigo-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Field 
                    label="Status" 
                    value={formData.reg_status} 
                    field="reg_status" 
                    isEditing={isEditing} 
                    onChange={handleChange} 
                    type="select"
                    options={['pending', 'approved', 'disapproved']}
                  />
                  <Field label="Submitted At" value={formatDate(app.submitted_at)} field="submitted_at" isEditing={false} onChange={handleChange} />
                  <Field label="Updated At" value={formatDate(app.updated_at)} field="updated_at" isEditing={false} onChange={handleChange} />
                </div>
              </div>
            </div>
          ) : (
                <>
                  {/* BIRTHDAY INCENTIVE SPECIFIC */}
                  {(formData.registration_type?.includes('Birthday')) && (
                    <div className="space-y-8">
                       <SectionHeader icon={Heart} title="Incentive Details" color="bg-amber-500" />
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          <Field 
                            label="Incentive Tier" 
                            value={formData.incentive_tier} 
                            field="incentive_tier" 
                            isEditing={isEditing} 
                            onChange={handleChange} 
                            type="select"
                            options={['70', '80', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100']}
                          />
                       </div>
                    </div>
                  )}

                  {/* PERSONAL INFO */}
                  <div className="space-y-8">
                    <SectionHeader icon={User} title="Personal Information" color="bg-indigo-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {!( (formData.registration_type?.toLowerCase() || '').includes('annual cash gift') || (formData.registration_type?.toLowerCase() || '').includes('social pension')) && <Field label="Citizen ID" value={formData.citizen_id} field="citizen_id" isEditing={isEditing} onChange={handleChange} disabled={true} />}
                      <Field label="SCID Number" value={formData.scid_number} field="scid_number" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="First Name" value={formData.firstName} field="firstName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Middle Name" value={formData.middleName} field="middleName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Last Name" value={formData.lastName} field="lastName" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Birthdate" value={formData.birthDate} field="birthDate" type="date" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Age" value={formData.age} field="age" type="number" isEditing={isEditing} onChange={handleChange} disabled={true} />
                      <Field label="Contact Number" value={formData.contactNumber} field="contactNumber" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div className="space-y-8">
                    <SectionHeader icon={MapPin} title="Location" color="bg-emerald-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <Field label="Barangay" value={formData.barangay} field="barangay" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="City / Municipality" value={formData.city} field="city" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                      <Field label="Province" value={formData.province} field="province" isEditing={isEditing} onChange={handleChange} disabled={isExisting} />
                    </div>
                  </div>

                  {/* STATUS */}
                  <div className="space-y-8">
                    <SectionHeader icon={ClipboardList} title="Status & Timestamps" color="bg-blue-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <Field 
                        label="Registration Status" 
                        value={formData.reg_status} 
                        field="reg_status" 
                        isEditing={isEditing} 
                        onChange={handleChange} 
                        type="select"
                        options={['pending', 'approved', 'disapproved']}
                      />
                      <Field 
                        label="Date Submitted" 
                        value={formatDate(formData.created_at)} 
                        field="created_at" 
                        isEditing={false} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  {/* REMARKS */}
                  <div className="space-y-8">
                    <SectionHeader icon={PenTool} title="Remarks" color="bg-slate-700" />
                    <div className="grid grid-cols-1 gap-8">
                      <Field 
                        label="Administrative Remarks" 
                        value={formData.remarks} 
                        field="remarks" 
                        isEditing={isEditing} 
                        onChange={handleChange} 
                        type="textarea"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ATTACHMENTS */}
              {formData.registration_type !== "Social Pension (DSWD)" && (
                <div className="space-y-8 pb-12">
                  <SectionHeader icon={FileText} title="Attachments" color="bg-slate-500" />
                  
                  {isEditing && !isExisting && (
                    <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Documents</p>
                          <div className="relative group">
                            <input 
                              type="file" 
                              multiple 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-rose-300 transition-all">
                              <Upload className="w-8 h-8 text-slate-300 group-hover:text-rose-400 transition-colors mb-2" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop files or click to upload</p>
                            </div>
                          </div>
  
                          {newAttachments.length > 0 && (
                            <div className="space-y-2">
                              {newAttachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[200px]">{file.name}</span>
                                  <button onClick={() => removeNewAttachment(idx)} className="text-rose-400 hover:text-rose-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
  
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photo Capture</p>
                          {isCapturing ? (
                            <div className="space-y-4">
                              <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-slate-200">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={capturePhoto} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Capture</button>
                                <button onClick={stopCamera} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Cancel</button>
                              </div>
                            </div>
                          ) : capturedPhoto ? (
                            <div className="space-y-4">
                              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 group">
                                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button onClick={startCamera} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition-transform"><RotateCcw className="w-5 h-5" /></button>
                                  <button onClick={() => setCapturedPhoto(null)} className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                                </div>
                              </div>
                              <p className="text-[9px] font-black text-emerald-500 uppercase text-center tracking-widest">New photo captured successfully!</p>
                            </div>
                          ) : (
                            <button 
                              onClick={startCamera}
                              className="w-full flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-300 transition-all group"
                            >
                              <Camera className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors mb-2" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Launch Camera</p>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      // Collect all potential attachment fields
                      const potentialFields = [
                        { value: (application as any).photo || (application as any).photo_url, label: 'Photo' },
                        { value: (application as any).indigency_certificate || (application as any).indigency_certificate_url, label: 'Indigency Certificate' },
                        { value: (application as any).document, label: 'Document' },
                        { value: (application as any).birth_certificate || (application as any).birth_certificate_url || (application as any).birthcertificate || (application as any).birth_cert_url, label: 'Birth Certificate' },
                        { value: (application as any).barangay_certificate || (application as any).barangay_certificate_url, label: 'Barangay Certificate' },
                        { value: (application as any).marriage_certificate_path || (application as any).marriage_certificate, label: 'Marriage Certificate' },
                        { value: (application as any).id_photo, label: 'ID Photo' },
                        { value: (application as any).id_file, label: 'ID Card / Document' }
                      ];
  
                      const validAttachments = potentialFields
                        .map(field => {
                          const path = getRawPath(field.value);
                          return { 
                            raw: path,
                            label: field.label
                          };
                        })
                        .filter(item => item.raw !== null && item.raw !== "");
  
                      if (validAttachments.length > 0) {
                        return validAttachments.map((item, idx) => {
                          return (
                            <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-4 hover:border-slate-300 transition-all shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{item.label}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requirement</p>
                                </div>
                              </div>
                              <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center relative">
                                 <AuthenticatedPreview path={item.raw!} label={item.label} />
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => handleFileAction(item.raw!, item.label, 'view')}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 outline-none"
                                >
                                  <Eye className="w-3 h-3" />VIEW
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleFileAction(item.raw!, `${item.label}${item.raw!.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg'}`, 'download')}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 outline-none"
                                >
                                  <Download className="w-3 h-3" />DOWNLOAD
                                </button>
                              </div>
                            </div>
                          );
                        });
                      }
                      return (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-100 rounded-[2rem]">
                          <AlertCircle className="w-12 h-12 text-slate-200" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No attachment available</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          );
        })()}
        </div>
      </motion.div>

      <AnimatePresence>
        {viewingFile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-10">
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
              className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {viewingFile.jsonData ? 'View Details' : 'View Document'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingFile.filename}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingFile(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50 p-6 no-scrollbar">
                {viewingFile.jsonData ? (
                  <div className="w-full bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(viewingFile.jsonData).map(([key, value]) => (
                          <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30 w-1/3">
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">
                              {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : viewingFile.isPdf ? (
                  <div className="w-full h-full flex flex-col gap-4">
                    {pdfError ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-slate-200">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">Unable to display document</p>
                        <button 
                          onClick={() => {
                            setPdfError(false);
                            setUseGoogleViewer(true);
                          }}
                          className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                          Try Google Viewer
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setUseGoogleViewer(!useGoogleViewer)}
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                          >
                            <RefreshCw className={cn("w-3 h-3", isFetchingFile && "animate-spin")} />
                            {useGoogleViewer ? 'Switch to Standard Viewer' : 'Switch to Google Viewer'}
                          </button>
                        </div>
                        <div className="w-full h-full min-h-[70vh] relative">
                          {useGoogleViewer ? (
                            <iframe 
                              id="pdfViewer-google"
                              src={`https://docs.google.com/gview?url=${encodeURIComponent(viewingFile.directUrl!)}&embedded=true`} 
                              className="w-full h-full min-h-[70vh] rounded-2xl border border-slate-200 shadow-inner bg-white"
                              title={viewingFile.filename}
                              onError={() => setPdfError(true)}
                            />
                          ) : (
                            <iframe 
                              id="pdf-viewer-frame"
                              src={viewingFile.url!} 
                              className="w-full h-full min-h-[70vh] rounded-2xl border border-slate-200 shadow-inner bg-white"
                              title={viewingFile.filename}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : viewingFile.url ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <img 
                      src={viewingFile.url} 
                      alt={viewingFile.filename} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">Unable to load file</p>
                    <p className="text-sm text-slate-400 font-medium tracking-tight">The file might be missing or in an unsupported format.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
