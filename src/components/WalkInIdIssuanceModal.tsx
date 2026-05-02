import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  Camera, 
  Upload, 
  Shield, 
  Check, 
  AlertCircle,
  Loader2,
  Trash2,
  RotateCcw,
  FileCheck,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Application } from '../App';

interface WalkInIdIssuanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizen: Application | null;
  initialTab: 'New ID' | 'Renewal' | 'Replacement';
  onSuccess?: () => void;
  modality?: 'Walk-in' | 'Online';
}

type FormTab = 'Personal' | 'Address' | 'Emergency' | 'Requirements' | 'Photo' | 'Signature';

export default function WalkInIdIssuanceModal({ 
  isOpen, 
  onClose, 
  citizen, 
  initialTab,
  onSuccess,
  modality = 'Walk-in'
}: WalkInIdIssuanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idRequestType, setIdRequestType] = useState<string>('New');
  const [activeTab, setActiveTab] = useState<FormTab>('Personal');
  
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    birth_date: '',
    sex: '',
    civil_status: '',
    citizenship: '',
    birth_place: '',
    address: '',
    barangay: '',
    city_municipality: '',
    district: '',
    province: '',
    scid_number: '',
    citizen_id: ''
  });

  const [emergencyContact, setEmergencyContact] = useState({
    person: '',
    number: ''
  });

  const [attachments, setAttachments] = useState({
    req1_url: '',
    req2_url: '',
    photo_url: '',
    signature_url: ''
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (citizen) {
      setFormData({
        first_name: citizen.first_name || '',
        middle_name: citizen.middle_name || '',
        last_name: citizen.last_name || '',
        suffix: citizen.suffix || '',
        birth_date: citizen.birth_date || '',
        sex: citizen.sex || '',
        civil_status: citizen.civil_status || '',
        citizenship: citizen.citizenship || '',
        birth_place: citizen.birth_place || '',
        address: citizen.address || '',
        barangay: citizen.barangay || '',
        city_municipality: citizen.city_municipality || '',
        district: citizen.district || '',
        province: citizen.province || '',
        scid_number: citizen.scid_number || '',
        citizen_id: String(citizen.citizen_id || citizen.id || '')
      });

      if (initialTab === 'New ID') setIdRequestType('New');
      else if (initialTab === 'Renewal') setIdRequestType('Renewal');
      else if (initialTab === 'Replacement') setIdRequestType('Replacement'); 
    } else {
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        birth_date: '',
        sex: '',
        civil_status: '',
        citizenship: '',
        birth_place: '',
        address: '',
        barangay: '',
        city_municipality: '',
        district: '',
        province: '',
        scid_number: '',
        citizen_id: ''
      });
      setIdRequestType('New');
      setEmergencyContact({ person: '', number: '' });
      setAttachments({ req1_url: '', req2_url: '', photo_url: '', signature_url: '' });
    }
    setActiveTab('Personal');
  }, [citizen, initialTab, isOpen]);

  const base64ToFile = (base64: string, filename: string) => {
    if (!base64 || !base64.includes(',')) return null;
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
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

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.type.includes('touch') ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.type.includes('touch') ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.type.includes('touch') ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (signatureRef.current) {
      setAttachments(prev => ({ ...prev, signature_url: signatureRef.current!.toDataURL('image/png') }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setAttachments(prev => ({ ...prev, signature_url: '' }));
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
      setError("Camera access failed. Please allow camera permission.");
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
        setAttachments(prev => ({ ...prev, photo_url: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'req1_url' | 'req2_url' | 'photo_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let enumType = "";
      if (idRequestType === 'New') enumType = "New ID";
      else if (idRequestType === 'Renewal') enumType = "Renewal";
      else if (idRequestType === 'Replacement') enumType = "Replacement";

      const enumModality = modality;

      const fd = new FormData();
      fd.append("scid_number", formData.scid_number || "");
      fd.append("citizen_id", String(formData.citizen_id || ""));
      fd.append("id_request_type", enumType);
      fd.append("id_modality", enumModality);
      fd.append("application_date", new Date().toISOString().split('T')[0]);

      fd.append("first_name", formData.first_name || "");
      fd.append("middle_name", formData.middle_name || "");
      fd.append("last_name", formData.last_name || "");
      fd.append("suffix", formData.suffix || "");
      
      fd.append("birthdate", formData.birth_date || "");
      fd.append("sex", formData.sex || "");
      fd.append("civil_status", formData.civil_status || "");
      fd.append("citizenship", formData.citizenship || "");
      fd.append("birth_place", formData.birth_place || "");
      fd.append("address", formData.address || "");
      fd.append("barangay", formData.barangay || "");
      fd.append("city_municipality", formData.city_municipality || "");
      fd.append("district", formData.district || "");
      fd.append("province", formData.province || "");

      fd.append("emergency_contact_person", emergencyContact.person || "");
      fd.append("emergency_contact_number", emergencyContact.number || "");
      
      // 1. Prepare Base64 to File Helper (internal copy for clarity if needed, but using existing one)
      
      // 2. Clear Append logic for attachments as Files
      if (attachments.photo_url && attachments.photo_url.startsWith('data:')) {
        const photoFile = base64ToFile(attachments.photo_url, "photo.jpg");
        if (photoFile) fd.append("photo", photoFile);
      }
      
      if (attachments.req1_url && attachments.req1_url.startsWith('data:')) {
        const req1File = base64ToFile(attachments.req1_url, "req1.jpg");
        if (req1File) fd.append("req1", req1File);
      }
      
      if (attachments.req2_url && attachments.req2_url.startsWith('data:')) {
        const req2File = base64ToFile(attachments.req2_url, "req2.jpg");
        if (req2File) fd.append("req2", req2File);
      }

      if (attachments.signature_url && attachments.signature_url.startsWith('data:')) {
        const signatureFile = base64ToFile(attachments.signature_url, "signature.png");
        if (signatureFile) fd.append("signature", signatureFile);
      }

      // 3. Debug Before Submit (MUST show: signature → File)
      console.log("--- ID Issuance Submission Payload (FormData) ---");
      for (let [key, value] of (fd as any).entries()) {
        console.log(key, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }

      // 4. Send directly as root (DO NOT wrap in { data: fd })
      const response = await fetch("https://api-dbosca.phoenix.com.ph/api/id-issuances", {
        method: "POST",
        headers,
        body: fd
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to submit ID issuance request");
      }

      // Always extract source data from: response.data (if object), response.data.data (if wrapped)
      const extractedData = responseData.data?.data || responseData.data || responseData;
      console.log("Submission success:", extractedData);

      onSuccess?.();
      if (modality === 'Walk-in') {
        onClose();
      }
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err);
      setError(err.message || "An error occurred while submitting.");
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch (idRequestType) {
      case 'New': return "New Registration";
      case 'Replacement': return "Replacement ID";
      case 'Renewal': return "Renewal";
      default: return "ID Issuance";
    }
  };

  if (!isOpen) return null;

  const tabs: { id: FormTab; label: string; icon: any }[] = [
    { id: 'Personal', label: 'Personal Info', icon: User },
    { id: 'Address', label: 'Address', icon: MapPin },
    { id: 'Emergency', label: 'Emergency', icon: Phone },
    { id: 'Requirements', label: 'Requirements', icon: FileCheck },
    { id: 'Photo', label: 'Photo Capture', icon: Camera },
    { id: 'Signature', label: 'Signature Pad', icon: PenTool },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div>
              <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
                <Shield className="w-8 h-8 text-rose-500" />
                {getHeaderTitle()}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{modality} ID Issuance Process</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Optional: Show SCID if Replacement in Header area or first tab */}
              {idRequestType === 'Replacement' && (
                <div className="hidden sm:block px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-rose-400 uppercase tracking-[0.2em] mb-0.5">SCID Number</span>
                  <span className="text-xs font-black text-rose-600 font-mono tracking-wider">{formData.scid_number || '---'}</span>
                </div>
              )}
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all text-slate-400 hover:text-rose-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Removal of sub-toggle for Replacement */}

          {/* Form Tabs Nav */}
          <div className="px-8 pt-6 border-b border-slate-50 shrink-0 bg-white">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 pb-4 border-b-2 transition-all whitespace-nowrap px-1",
                      isActive 
                        ? "border-rose-500 text-rose-500" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "animate-pulse" : "")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Tab 1: Personal Information */}
                {activeTab === 'Personal' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input 
                          type="text" 
                          value={formData.first_name}
                          readOnly
                          placeholder="John"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                        <input 
                          type="text" 
                          value={formData.middle_name}
                          readOnly
                          placeholder="Doe"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input 
                          type="text" 
                          value={formData.last_name}
                          readOnly
                          placeholder="Smith"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Suffix</label>
                        <input 
                          type="text" 
                          value={formData.suffix}
                          readOnly
                          placeholder="Jr./III"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                        <input 
                          type="date" 
                          value={formData.birth_date}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sex</label>
                        <input 
                          type="text"
                          value={formData.sex}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Civil Status</label>
                        <input 
                          type="text"
                          value={formData.civil_status}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Citizenship</label>
                        <input 
                          type="text" 
                          value={formData.citizenship}
                          readOnly
                          placeholder="Filipino"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Place</label>
                        <input 
                          type="text" 
                          value={formData.birth_place}
                          readOnly
                          placeholder="City, Province"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                    </div>

                    {(idRequestType === 'Lost' || idRequestType === 'Damaged') && (
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className="w-5 h-5 text-rose-500" />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">ID Information (Read-only)</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SCID Number</label>
                          <input 
                            type="text" 
                            value={formData.scid_number}
                            disabled
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Address Information */}
                {activeTab === 'Address' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                        <input 
                          type="text" 
                          value={formData.address}
                          readOnly
                          placeholder="Street, Phase, Building"
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Barangay</label>
                        <input 
                          type="text" 
                          value={formData.barangay}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City/Municipality</label>
                        <input 
                          type="text" 
                          value={formData.city_municipality}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                        <input 
                          type="text" 
                          value={formData.district}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Province</label>
                        <input 
                          type="text" 
                          value={formData.province}
                          readOnly
                          className="w-full px-6 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Emergency Contact */}
                {activeTab === 'Emergency' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                        <input 
                          type="text" 
                          placeholder="Full name of contact person"
                          value={emergencyContact.person}
                          onChange={(e) => setEmergencyContact(prev => ({ ...prev, person: e.target.value }))}
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#0F172A] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                        <input 
                          type="tel" 
                          placeholder="Phone number"
                          value={emergencyContact.number}
                          onChange={(e) => setEmergencyContact(prev => ({ ...prev, number: e.target.value }))}
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#0F172A] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Requirements */}
                {activeTab === 'Requirements' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Req 1 */}
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 uppercase">Requirement 1</span>
                        <span className="text-[9px] font-bold text-slate-400">Birth Certificate / Passport / National ID</span>
                      </div>
                      <div className={cn(
                        "relative group h-64 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center overflow-hidden",
                        attachments.req1_url ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-rose-500 hover:bg-slate-50"
                      )}>
                        {attachments.req1_url ? (
                          <div className="relative w-full h-full">
                            <img src={attachments.req1_url} alt="Requirement 1" className="w-full h-full object-contain" />
                            <button 
                              type="button" 
                              onClick={() => setAttachments(prev => ({ ...prev, req1_url: '' }))}
                              className="absolute top-2 right-2 p-3 bg-white/80 backdrop-blur-md rounded-2xl text-rose-500 hover:bg-white shadow-sm transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-slate-300 group-hover:text-rose-500 mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload doc</p>
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'req1_url')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Req 2 */}
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 uppercase">Requirement 2</span>
                        <span className="text-[9px] font-bold text-slate-400">Voter's / Driver's / TIN / PhilHealth ID</span>
                      </div>
                      <div className={cn(
                        "relative group h-64 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center overflow-hidden",
                        attachments.req2_url ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-rose-500 hover:bg-slate-50"
                      )}>
                        {attachments.req2_url ? (
                          <div className="relative w-full h-full">
                            <img src={attachments.req2_url} alt="Requirement 2" className="w-full h-full object-contain" />
                            <button 
                              type="button" 
                              onClick={() => setAttachments(prev => ({ ...prev, req2_url: '' }))}
                              className="absolute top-2 right-2 p-3 bg-white/80 backdrop-blur-md rounded-2xl text-rose-500 hover:bg-white shadow-sm transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-slate-300 group-hover:text-rose-500 mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload doc</p>
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(e, 'req2_url')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Photo Capture */}
                {activeTab === 'Photo' && (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className={cn(
                      "relative w-72 h-80 rounded-[3rem] border-4 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all",
                      attachments.photo_url ? "border-emerald-500 bg-emerald-50/30 shadow-2xl shadow-emerald-200" : "border-slate-200 bg-slate-50"
                    )}>
                      {isCapturing ? (
                        <div className="relative w-full h-full bg-slate-900">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                            <button 
                              type="button" 
                              onClick={capturePhoto}
                              className="p-5 bg-rose-500 text-white rounded-full shadow-2xl shadow-rose-200 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Camera className="w-8 h-8" />
                            </button>
                            <button 
                              type="button" 
                              onClick={stopCamera}
                              className="p-5 bg-slate-800 text-white rounded-full shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all"
                            >
                              <X className="w-8 h-8" />
                            </button>
                          </div>
                        </div>
                      ) : attachments.photo_url ? (
                        <div className="relative w-full h-full">
                          <img src={attachments.photo_url} alt="Captured" className="w-full h-full object-cover" />
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button 
                              type="button" 
                              onClick={() => setAttachments(prev => ({ ...prev, photo_url: '' }))}
                              className="p-3 bg-white shadow-xl rounded-2xl text-rose-500 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={startCamera}
                              className="p-3 bg-white shadow-xl rounded-2xl text-blue-500 hover:bg-blue-50 transition-all"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-6 p-8">
                          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-slate-200 transition-transform group-hover:scale-110">
                            <User className="w-12 h-12 text-slate-200" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">No photo captured</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload or capture via camera</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!attachments.photo_url && !isCapturing && (
                      <div className="flex flex-wrap gap-4 justify-center w-full max-w-md">
                        <button 
                          type="button" 
                          onClick={startCamera}
                          className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-5 bg-rose-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-200"
                        >
                          <Camera className="w-5 h-5" />
                          Use Camera
                        </button>
                        <div className="flex-1 relative group">
                          <button 
                            type="button" 
                            className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-slate-100 text-slate-700 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                            Upload File
                          </button>
                          <input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'photo_url')}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 6: Signature Pad */}
                {activeTab === 'Signature' && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-full max-w-2xl bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 uppercase">Draw your signature</span>
                            <span className="text-[11px] font-bold text-slate-400">Use your mouse or touch screen to sign below</span>
                          </div>
                          <button 
                            type="button"
                            onClick={clearSignature}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                          >
                            Clear Pad
                          </button>
                       </div>
                       <div className="relative h-64 bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden">
                         <canvas
                            ref={signatureRef}
                            width={800}
                            height={300}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={endDrawing}
                            className="w-full h-full cursor-crosshair touch-none"
                         />
                         {!attachments.signature_url && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                             <PenTool className="w-20 h-20 text-slate-300" />
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {tabs.map((tab, idx) => (
                  <div 
                    key={tab.id}
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-white transition-all",
                      activeTab === tab.id ? "bg-rose-500 scale-125 z-10" : 
                      idx < tabs.findIndex(t => t.id === activeTab) ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {tabs.findIndex(t => t.id === activeTab) + 1} of 6</span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {activeTab !== 'Personal' && (
                <button 
                  type="button" 
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    setActiveTab(tabs[idx - 1].id);
                  }}
                  className="flex-1 sm:flex-none px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Back
                </button>
              )}
              
              {activeTab === 'Signature' ? (
                <button 
                  onClick={handleSubmit as any}
                  disabled={isLoading || !attachments.signature_url}
                  className="flex-3 sm:flex-none px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      SUBMIT ISSUANCE
                    </>
                  )}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    setActiveTab(tabs[idx + 1].id);
                  }}
                  className="flex-3 sm:flex-none px-12 py-4 bg-[#0F172A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Next Section
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="absolute bottom-24 left-8 right-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-4">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <p className="text-[11px] font-black text-rose-600 uppercase tracking-tight">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1.5 hover:bg-rose-100 rounded-lg text-rose-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
