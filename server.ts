import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Debug Logger - See all incoming requests
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url} (original: ${req.originalUrl})`);
    next();
  });

  // API Proxy - Removed to avoid "Cookie check" issues with external target
  /*
  app.use(
    createProxyMiddleware({
      ...
    })
  );
  */

  // Proxy Leak Detector - Removed

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock database
  const applications: any[] = [];
  const users: any[] = [
    { id: 101, username: "juan123" },
    { id: 102, username: "maria123" },
    { id: 103, username: "ricardo123" }
  ];
  const masterlist: any[] = [
    { id: 1, citizen_id: 2000001, application_id: 1, user_id: 101, full_name: "JUAN DELA CRUZ", birth_date: "1955-05-20", age: 70, reg_status: 'approved' },
    { id: 2, citizen_id: 2000002, application_id: 2, user_id: 102, full_name: "MARIA SANTOS", birth_date: "1958-10-15", age: 67, reg_status: 'approved' },
    { id: 3, citizen_id: 2000003, application_id: 3, user_id: 103, full_name: "RICARDO REYES", birth_date: "1950-01-01", age: 76, reg_status: 'approved' }
  ];

  // Initialize applications with some data to match masterlist
  applications.push(
    { id: 1, first_name: "JUAN", last_name: "DELA CRUZ", reg_status: 'approved' },
    { id: 2, first_name: "MARIA", last_name: "SANTOS", reg_status: 'approved' },
    { id: 3, first_name: "RICARDO", last_name: "REYES", reg_status: 'approved' }
  );

  // Helper to process application data according to business logic
  const processApplicationData = (input: any) => {
    const data: any = { ...input };

    // Helper to convert string to boolean
    const toBool = (val: any) => {
      if (val === 'true' || val === '1' || val === 1 || val === true) return true;
      if (val === 'false' || val === '0' || val === 0 || val === false) return false;
      return false;
    };

    // Helper to handle "null" string or empty values
    const handleNull = (val: any) => {
      if (val === "null" || val === "" || val === undefined) return null;
      return val;
    };

    // 4. Ensure Boolean Casting
    data.is_pensioner = toBool(data.is_pensioner);
    data.has_permanent_income = toBool(data.has_permanent_income);
    data.has_regular_support = toBool(data.has_regular_support);
    data.has_illness = toBool(data.has_illness);
    data.hospitalized_last_6_months = toBool(data.hospitalized_last_6_months);

    // 3. Fix Null Values
    data.suffix = handleNull(data.suffix);

    // 2. Conditional Logic
    // Pension Logic
    if (!data.is_pensioner) {
      data.pension_source_gsis = false;
      data.pension_source_sss = false;
      data.pension_source_afpslai = false;
      data.pension_source_others = null;
      data.pension_amount = null;
    } else {
      data.pension_source_gsis = toBool(data.pension_source_gsis);
      data.pension_source_sss = toBool(data.pension_source_sss);
      data.pension_source_afpslai = toBool(data.pension_source_afpslai);
      data.pension_source_others = handleNull(data.pension_source_others);
      data.pension_amount = data.pension_amount ? Number(data.pension_amount) : null;
    }

    // Permanent Income
    if (data.has_permanent_income) {
      data.permanent_income_source = handleNull(data.permanent_income_source);
    } else {
      data.permanent_income_source = null;
    }

    // Regular Support
    if (data.has_regular_support) {
      data.support_type_cash = toBool(data.support_type_cash);
      data.support_type_inkind = toBool(data.support_type_inkind);
      data.support_cash_amount = data.support_cash_amount ? Number(data.support_cash_amount) : null;
      data.support_cash_frequency = handleNull(data.support_cash_frequency);
      data.kind_support_details = handleNull(data.kind_support_details);
    } else {
      data.support_type_cash = false;
      data.support_type_inkind = false;
      data.support_cash_amount = null;
      data.support_cash_frequency = null;
      data.kind_support_details = null;
    }

    // Illness
    if (data.has_illness) {
      data.illness_details = handleNull(data.illness_details);
    } else {
      data.illness_details = null;
    }

    // Age and other numbers
    if (data.age) data.age = Number(data.age);

    return data;
  };

  // Auth API
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    
    // Simple mock login
    if (username === "admin" && password === "admin123") {
      res.json({
        token: "mock-token-123",
        user: {
          id: 1,
          username: "admin",
          role: 1, // Admin
          name: "Administrator"
        }
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  });

  // Masterlist API
  app.get("/api/masterlist", (req, res) => {
    res.json(masterlist);
  });

  // Registration API
  app.post("/api/applications", upload.any(), (req, res) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!files || files.length === 0) {
      return res.status(422).json({
        message: "The given data was invalid.",
        errors: {
          document: ["The document field is required."]
        }
      });
    }

    // Handle multiple files validation (mimes and size)
    const allowedMimes = [
      'image/jpeg', 
      'image/png', 
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validationErrors: Record<string, string[]> = {};
    
    // Filter files that belong to the document array
    const documentFiles = files.filter(f => f.fieldname === 'document' || f.fieldname === 'document[]');

    if (documentFiles.length === 0) {
      return res.status(422).json({
        message: "The given data was invalid.",
        errors: {
          document: ["The document field is required."]
        }
      });
    }

    documentFiles.forEach((file, index) => {
      if (!allowedMimes.includes(file.mimetype)) {
        validationErrors[`document.${index}`] = ["The document must be a file of type: pdf, jpg, jpeg, png, docx."];
      }
      if (file.size > maxSize) {
        validationErrors[`document.${index}`] = ["The document must not be greater than 5120 kilobytes."];
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      return res.status(422).json({
        message: "The given data was invalid.",
        errors: validationErrors
      });
    }

    // Mock processing of files
    const document = files.map(file => ({
      file_name: file.originalname,
      file_path: `/uploads/${file.originalname}`, // Mock path
      file_type: file.mimetype
    }));

    // Backend Storage
    // Process data according to business logic
    const processedData = processApplicationData(data);

    // Directly save JSON (simulated)
    const newApplication = {
      id: applications.length + 1,
      ...processedData,
      // Store document as JSON string as requested
      document: JSON.stringify(document),
      created_at: new Date().toISOString()
    };

    applications.push(newApplication);

    console.log("[Backend] New application saved:", newApplication.id);

    res.status(201).json({
      message: "Registration successful",
      application: {
        ...newApplication,
        document: document // Return as object for the frontend
      }
    });
  });

  // Get applications API (for the table)
  app.get("/api/applications", (req, res) => {
    res.json(applications.map(app => ({
      ...app,
      // Parse back for the frontend if needed, but the frontend expects the object
      document: app.document ? (typeof app.document === 'string' ? JSON.parse(app.document) : app.document) : []
    })));
  });

  // Update application API (Handle both PUT and POST for flexibility)
  const updateHandler = (req: any, res: any) => {
    const { id } = req.params;
    const data = req.body;
    const index = applications.findIndex(app => app.id === parseInt(id));
    
    if (index !== -1) {
      const processedData = processApplicationData(data);
      applications[index] = {
        ...applications[index],
        ...processedData,
        updated_at: new Date().toISOString()
      };
      res.json({ message: "Application updated", application: applications[index] });
    } else {
      res.status(404).json({ message: "Application not found" });
    }
  };

  app.put("/api/applications/:id", updateHandler);
  app.patch("/api/applications/:id", updateHandler);
  app.post("/api/applications/:id", updateHandler);

  // Masterlist Update API (includes moveToPending logic)
  app.post("/api/masterlist/move-to-pending/:citizen_id", (req, res) => {
    const { citizen_id } = req.params;
    try {
      const citizenId = parseInt(citizen_id);
      
      // 1. Find the masterlist record using citizen_id
      const masterIndex = masterlist.findIndex(m => m.citizen_id === citizenId);
      
      if (masterIndex === -1) {
        return res.status(404).json({ message: "Masterlist record not found" });
      }

      const record = masterlist[masterIndex];
      const applicationId = record.application_id;
      const userId = record.user_id;

      // 2. Update the Registration Module (applications table)
      const appIndex = applications.findIndex(a => a.id === applicationId);
      if (appIndex !== -1) {
        applications[appIndex].reg_status = 'pending';
      }

      // 4. Handle user deletion safely
      if (userId) {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users.splice(userIndex, 1);
        }
      }

      // 3. Delete the masterlist record
      masterlist.splice(masterIndex, 1);

      // 6. Return success response
      return res.json({ 
        success: true,
        message: "Successfully moved to pending." 
      });
    } catch (error) {
      // 6. Return error response if exception occurs
      console.error("moveToPending Error:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while moving the record to pending" 
      });
    }
  });

  app.put("/api/masterlist/:id", (req, res) => {
    const { id } = req.params;
    const { reg_status } = req.body;

    // Implementation of moveToPending logic
    if (reg_status === 'pending') {
      try {
        const citizenId = parseInt(id);
        
        // 1. Find the masterlist record using citizen_id
        const masterIndex = masterlist.findIndex(m => m.citizen_id === citizenId || m.id === citizenId);
        
        if (masterIndex === -1) {
          return res.status(404).json({ message: "Masterlist record not found" });
        }

        const record = masterlist[masterIndex];
        const applicationId = record.application_id;
        const userId = record.user_id;

        // 2. Update the Registration Module (applications table)
        const appIndex = applications.findIndex(a => a.id === applicationId);
        if (appIndex !== -1) {
          applications[appIndex].reg_status = 'pending';
        }

        // 4. Handle user deletion safely
        if (userId) {
          const userIndex = users.findIndex(u => u.id === userId);
          if (userIndex !== -1) {
            users.splice(userIndex, 1);
          }
        }

        // 3. Delete the masterlist record
        masterlist.splice(masterIndex, 1);

        // 6. Return success response
        return res.json({ 
          success: true,
          message: "Record successfully moved back to pending status" 
        });
      } catch (error) {
        // 6. Return error response if exception occurs
        console.error("moveToPending Error:", error);
        return res.status(500).json({ 
          success: false,
          message: "An error occurred while moving the record to pending" 
        });
      }
    }

    // Default update logic for masterlist
    const masterId = parseInt(id);
    const index = masterlist.findIndex(m => m.id === masterId || m.citizen_id === masterId);
    if (index !== -1) {
      masterlist[index] = { ...masterlist[index], ...req.body };
      return res.json({ message: "Masterlist record updated", data: masterlist[index] });
    }

    return res.status(404).json({ message: "Masterlist record not found" });
  });

  // Delete application API
  app.delete("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const index = applications.findIndex(app => app.id === parseInt(id));
    
    if (index !== -1) {
      applications.splice(index, 1);
      res.json({ message: "Application deleted" });
    } else {
      res.status(404).json({ message: "Application not found" });
    }
  });

  // File View/Download API
  app.get("/api/files/view", (req, res) => {
    const { path: filePath, name, action, token } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    // In a real app, we would verify the token (either from header or query param)
    const authToken = token || req.headers.authorization?.split(' ')[1];
    if (!authToken || authToken !== "mock-token-123") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Mocking file existence - in a real app you'd use path.join(__dirname, filePath as string)
    // For now, we'll just return a 404 if it's not a known mock path, 
    // or serve a sample PDF for demonstration if it's a PDF request.
    
    const isPdf = (name as string)?.toLowerCase().endsWith('.pdf') || (filePath as string)?.toLowerCase().endsWith('.pdf');
    const isImage = (name as string)?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || 
                    (filePath as string)?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

    if (action === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${name || 'file'}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${name || 'file'}"`);
    }

    if (isPdf) {
      res.contentType('application/pdf');
      const minPdf = Buffer.from(
        '%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 20 >>\nstream\nBT /F1 12 Tf 0 0 Td ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n0\n%%EOF'
      );
      return res.send(minPdf);
    }

    if (isImage) {
      res.contentType('image/png');
      return res.redirect(`https://picsum.photos/seed/${name || filePath}/800/600`);
    }

    // Default for any other file type in mock
    res.contentType('text/plain');
    return res.send(`Mock content for file: ${filePath}`);
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
