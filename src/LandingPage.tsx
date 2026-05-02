import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Heart, 
  IdCard, 
  Wallet, 
  Percent, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  User,
  ShieldCheck,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function LandingPage({ 
  onStartRegistration, 
  onLoginSuccess 
}: { 
  onStartRegistration: () => void, 
  onLoginSuccess: (user: any) => void 
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Mock login for development/demo purposes
      if (username === 'admin' && password === 'admin123') {
        const mockAdmin = {
          user: { id: 1, username: 'admin', role: 1, first_name: 'Admin', last_name: 'User' },
          token: 'mock-token-admin'
        };
        localStorage.setItem("user", JSON.stringify(mockAdmin.user));
        localStorage.setItem("token", mockAdmin.token);
        onLoginSuccess(mockAdmin.user);
        setIsLoginModalOpen(false);
        setIsLoading(false);
        return;
      }

      if (username === 'citizen' && password === 'citizen123') {
        const mockCitizen = {
          user: { id: 5, username: 'citizen', role: 5, first_name: 'Juan', last_name: 'Dela Cruz' },
          token: 'mock-token-citizen'
        };
        localStorage.setItem("user", JSON.stringify(mockCitizen.user));
        localStorage.setItem("token", mockCitizen.token);
        onLoginSuccess(mockCitizen.user);
        setIsLoginModalOpen(false);
        setIsLoading(false);
        return;
      }

      const res = await fetch("https://api-dbosca.phoenix.com.ph/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response:", text);
        // If server returns non-JSON but we have mock credentials, we already handled them.
        // Otherwise, show error.
        setError("Server error. Please try demo credentials (admin/admin123 or citizen/citizen123)");
        setIsLoading(false);
        return;
      }

      console.log("LOGIN RESPONSE:", data);

      if (res.ok && data.user) {
        // Store user and token FIRST
        const token = data.token || data.access_token;
        const u = data.user;
        const userToStore = u.data && u.id === undefined ? u.data : u;
        localStorage.setItem("user", JSON.stringify(userToStore));
        if (token) {
          localStorage.setItem("token", token);
        }
        
        onLoginSuccess(userToStore);
        setIsLoginModalOpen(false);
      } else {
        setError(data?.message || "Invalid username or password");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Fallback message for "Failed to fetch"
      if (err.message === 'Failed to fetch') {
        setError("Network error. Please use demo credentials: admin/admin123 or citizen/citizen123");
      } else {
        setError(err.message || "Invalid username or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Register', href: '#register' },
    { label: 'Services', href: '#services' },
    { label: 'Contact Us', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins text-slate-900 selection:bg-red-100 selection:text-red-900">
      {/* Navigation */}
      <nav className="fixed top-8 left-0 right-0 z-50 px-6">
        <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-xl backdrop-saturate-150 rounded-[32px] px-8 py-3 border border-white/40 shadow-2xl flex justify-between items-center relative">
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.label === 'Register' ? (
                <button 
                  key={link.label}
                  onClick={onStartRegistration}
                  className="text-base font-semibold tracking-tight text-slate-600 hover:text-red-600 transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <a 
                  key={link.label} 
                  href={link.href}
                  className="text-base font-semibold tracking-tight text-slate-600 hover:text-red-600 transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>


          <div className="absolute left-1/2 -translate-x-1/2">
            <img 
              src="https://www.phoenix.com.ph/wp-content/uploads/2026/04/Seal_of_San_Juan_Metro_Manila-1.png" 
              alt="San Juan Seal" 
              className="w-16 h-16 object-contain" 
              referrerPolicy="no-referrer" 
            />
          </div>

          <div className="flex items-center">
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-[#EF4444] text-white rounded-2xl px-8 py-3 shadow-lg shadow-red-200 flex items-center gap-2 text-base font-semibold tracking-tight hover:bg-red-700 transition-all group"
            >
              Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://www.phoenix.com.ph/wp-content/uploads/2026/03/image-16.png" 
            alt="San Juan City Hall Background" 
            className="w-full h-full object-cover opacity-30 scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#EF4444] leading-[1.1] mb-8">
              Senior Citizen Management <br /> System
            </h1>
            
            <div className="max-w-2xl mx-auto mb-12 space-y-2">
              <p className="text-lg md:text-xl text-slate-700 font-normal leading-relaxed">
                A centralized platform for the welfare and services of senior citizens in San Juan City.
              </p>
              <p className="text-lg md:text-xl text-slate-700 font-normal leading-relaxed">
                Streamlining applications, ID issuance, and assistance delivery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onStartRegistration}
                className="w-full sm:w-auto px-12 py-5 bg-[#EF4444] text-white rounded-2xl font-semibold text-base tracking-wide shadow-xl shadow-red-100 hover:bg-red-700 hover:scale-105 transition-all"
              >
                Get Started
              </button>
              <button className="w-full sm:w-auto px-12 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-semibold text-base tracking-wide shadow-sm hover:bg-slate-50 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 px-6 bg-[#f2f2f2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative flex items-center justify-center">
              <img 
                src="https://www.phoenix.com.ph/wp-content/uploads/2026/04/Group-59.png" 
                alt="Senior Citizen Services Illustration" 
                className="w-full h-auto max-w-[540px] mix-blend-multiply" 
                referrerPolicy="no-referrer" 
              />
            </div>

            <div className="space-y-12">
              <div>
                <h2 className="text-5xl font-semibold tracking-tight text-[#EF4444] mb-6">Senior Citizen Services</h2>
                <p className="text-xl text-slate-600 font-normal leading-relaxed">
                  Our system ensures that senior citizens can access welfare services quickly, safely, and transparently. From registration to ID issuance and cash grants, seniors can manage their benefits online.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { icon: Heart, title: 'Healthcare Privileges Access', desc: 'Seamless access to medical assistance and health programs.' },
                  { icon: IdCard, title: 'Senior Citizen ID Issuance', desc: 'Digital application and tracking for official identification cards.' },
                  { icon: Wallet, title: 'Cash Grant Eligibility', desc: 'Automated verification for social pension and local grants.' },
                  { icon: Percent, title: 'Discounts in Partner Merchants', desc: 'Easy verification for senior discounts in establishments.' },
                ].map((service, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-md border border-slate-50 flex items-center justify-center text-[#EF4444] group-hover:bg-[#EF4444] group-hover:text-white transition-all">
                      <service.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-slate-900 mb-1">{service.title}</h4>
                      <p className="text-base text-slate-500 font-normal leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-semibold tracking-tight text-[#EF4444] mb-4">Contact Us</h2>
            <p className="text-lg text-slate-600 font-normal max-w-2xl mx-auto">
              We're here to assist you with any questions or support needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: User, label: 'OSCA Head', value: 'Ms. Elena Cruz', sub: 'Office of Senior Citizens Affairs' },
              { icon: Phone, label: 'Support Hotline', value: '(02) 8888-9900', sub: 'System & Registration Help' },
              { icon: Mail, label: 'Official Email', value: 'osca@sanjuancity.gov.ph', sub: 'General Inquiries' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#EF4444]">
                    <card.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">{card.label}</h4>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900 mb-1">{card.value}</p>
                  <p className="text-base text-slate-500">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900">Visit Our Office</h4>
                  <p className="text-base text-slate-500">Pinaglabanan St. cor. Dr. P.A. Narciso St., San Juan, Metro Manila</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-2xl text-base font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                <ArrowRight className="w-4 h-4 rotate-[-45deg]" />
                Get Directions
              </button>
            </div>
            
            <div className="aspect-[21/9] w-full bg-slate-100 rounded-[32px] overflow-hidden relative border border-slate-100 shadow-inner">
              <iframe 
                src="https://maps.google.com/maps?q=Pinaglabanan%20St%20cor.%20Dr.%20P.A.%20Narciso%20St%2C%20San%20Juan%2C%20Metro%20Manila&t=&z=17&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location Map"
                className="grayscale-0 contrast-100 hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative pt-12 pb-0 overflow-hidden bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <img 
                src="https://www.phoenix.com.ph/wp-content/uploads/2026/04/Seal_of_San_Juan_Metro_Manila-1.png" 
                alt="San Juan Seal" 
                className="w-12 h-12 object-contain" 
                referrerPolicy="no-referrer" 
              />
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Dakilang Lungsod ng San Juan</h3>
                <p className="text-sm text-[#94A3B8] font-medium italic leading-tight">Kalakhang Maynila</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <MapPin className="w-4 h-4" />
                <p className="text-xs font-semibold text-slate-600 underline decoration-slate-200 underline-offset-4">Pinaglabanan, San Juan City, Metro Manila</p>
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <Mail className="w-4 h-4" />
                <p className="text-xs font-semibold text-slate-600 underline decoration-slate-200 underline-offset-4">publicinfo@sanjuancity.gov.ph</p>
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <Phone className="w-4 h-4" />
                <p className="text-xs font-semibold text-slate-600 underline decoration-slate-200 underline-offset-4">(02) 7729 0005</p>
              </div>
            </div>
          </div>
        </div>

        {/* City Line Art Pattern */}
        <div className="w-full overflow-hidden h-24 relative">
          <div 
            className="absolute inset-0 w-full opacity-100"
            style={{ 
              backgroundImage: 'url("https://www.phoenix.com.ph/wp-content/uploads/2025/12/subfooter.png")', 
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              backgroundSize: '100% auto'
            }} 
          />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 shadow-[0_-8px_10px_rgba(239,68,68,0.1)]" />
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-12">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-semibold tracking-tight">Login</h3>
                  <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-slate-400 tracking-wider ml-4">Username</label>
                    <input 
                      type="text"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-lg focus:outline-none focus:border-[#EF4444] transition-all"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-semibold text-slate-400 tracking-wider ml-4">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-lg focus:outline-none focus:border-[#EF4444] transition-all pr-14"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <p className="text-xs text-[#EF4444] font-semibold text-center">{error}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-5 bg-[#EF4444] text-white rounded-2xl font-semibold tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Logging in...' : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-sm font-semibold text-slate-400 tracking-widest">
                  Secure access provided by San Juan LGU
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
