import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function exportToCSV(data: any[], headers: string[], fileName: string) {
  if (data.length === 0) return;

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header.toLowerCase().replace(/ /g, '_')] || row[header] || '';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function normalizeCashGiftResponse(data: any): any[] {
  // 1. Detect if response.data is array or single object
  let rawData = data;
  if (data?.data?.data) {
    rawData = data.data.data;
  } else if (data?.data) {
    rawData = data.data;
  }

  const arrayData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

  // 2. Map and normalize each record
  return arrayData.map(item => {
    // Preserve existing fields while normalization rules apply
    const firstName = item.first_name || "";
    const lastName = item.last_name || "";
    const middleName = item.middle_name || "";
    
    // Construct full name if missing
    const fullName = item.full_name || `${lastName}, ${firstName} ${middleName}`.replace(/^[,\s]+|[,\s]+$/g, '').trim() || "N/A";

    const photoUrl = item.photo || item.photo_url || "";
    const birthCertUrl = item.birth_certificate || item.birth_certificate_url || "";
    const barangayCertUrl = item.barangay_certificate || item.barangay_certificate_url || "";

    return {
      ...item, // Keep original data for components that might rely on sub-fields
      id: item.id,
      citizen_id: item.citizen_id || "",
      full_name: fullName,
      birth_date: item.birth_date || "",
      age: Number(item.age) || 0,
      contact_number: item.contact_number || item.phone || item.mobile || "",
      barangay: item.barangay || "",
      city_municipality: item.city_municipality || "",
      province: item.province || "",
      scid_number: item.scid_number || "",
      reg_status: (item.reg_status || item.status || "pending").toLowerCase(),
      disbursement: (item.disbursement || "pending").toLowerCase(),
      disbursement_status: (item.disbursement || "pending").toLowerCase(),
      remarks: item.remarks || "",
      // Specific attachment fields
      photo: photoUrl,
      birth_certificate: birthCertUrl,
      barangay_certificate: barangayCertUrl,
      // Grouped attachment URLs as requested
      attachment_urls: [photoUrl, birthCertUrl, barangayCertUrl].filter(Boolean),
      created_at: item.created_at || item.registration_date || "",
      updated_at: item.updated_at || ""
    };
  });
}

export function normalizeWeddingIncentiveResponse(data: any): any[] {
  let rawData = data;
  if (data?.data?.data) {
    rawData = data.data.data;
  } else if (data?.data) {
    rawData = data.data;
  }

  const arrayData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

  return arrayData.map(item => {
    const husband = item.husband || {};
    const wife = item.wife || {};
    const details = item.marriage_details || {};
    const location = item.location || {};

    return {
      ...item,
      // Husband
      husband_first_name: husband.first_name || item.husband_first_name || "",
      husband_middle_name: husband.middle_name || item.husband_middle_name || "",
      husband_last_name: husband.last_name || item.husband_last_name || "",
      husband_birth_date: husband.birth_date || item.husband_birth_date || "",
      husband_age: Number(husband.age || item.husband_age || 0),
      husband_contact_number: husband.contact_number || item.husband_contact_number || "",
      
      // Wife
      wife_first_name: wife.first_name || item.wife_first_name || "",
      wife_middle_name: wife.middle_name || item.wife_middle_name || "",
      wife_last_name: wife.last_name || item.wife_last_name || "",
      wife_birth_date: wife.birth_date || item.wife_birth_date || "",
      wife_age: Number(wife.age || item.wife_age || 0),
      wife_contact_number: wife.contact_number || item.wife_contact_number || "",
      
      // Marriage Details
      marriage_date: details.marriage_date || item.marriage_date || "",
      marriage_certificate_url: details.certificate_url || item.marriage_certificate_url || "",
      
      // Location
      barangay: location.barangay || item.barangay || "",
      city_municipality: location.city_municipality || item.city_municipality || "",
      province: location.province || item.province || "",
      
      // Status
      reg_status: (item.status || item.reg_status || "pending").toLowerCase(),
      status: (item.status || item.reg_status || "pending").toLowerCase(),
      disbursement_status: String(item.disbursement?.status || item.disbursement_status || "---").toLowerCase(),
      registration_type: "50th Wedding Anniversary Incentive",
      
      // Names for UI
      husband_full_name: husband.full_name || `${husband.last_name}, ${husband.first_name}`.trim() || "",
      wife_full_name: wife.full_name || `${wife.last_name}, ${wife.first_name}`.trim() || "",
      
      attachment_urls: [details.certificate_url].filter(Boolean)
    };
  });
}

export function normalizeBirthdayIncentiveResponse(data: any): any[] {
  let rawData = data;
  if (data?.data?.data) {
    rawData = data.data.data;
  } else if (data?.data) {
    rawData = data.data;
  }

  const arrayData = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

  return arrayData.map(item => {
    return {
      ...item,
      id: item.id,
      full_name: item.full_name || `${item.last_name || ''}, ${item.first_name || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').trim() || "N/A",
      tier: item.tier || item.incentive_tier || "N/A",
      status: (item.status || item.reg_status || "pending").toLowerCase(),
      disbursement_status: String(item.disbursement?.status || item.disbursement_status || "pending").toLowerCase(),
      birth_cert_url: item.view_birth_cert || item.birth_certificate || item.birth_certificate_url || "",
      applied_date: item.created_at || item.registration_date || null
    };
  });
}
