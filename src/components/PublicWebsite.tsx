import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Store, Search, ShoppingBag, MapPin, Clock, Phone, Mail, 
  ChevronRight, BadgePercent, ArrowRight, UserCheck, Trash2, 
  Info, MessageSquare, Send, CheckCircle2, ShieldAlert,
  HelpCircle, UserPlus, Lock, Shield, Sparkles, BookOpen, User
} from "lucide-react";
import { Product, Category, Settings, User as UserType } from "../types";
const tabBackgrounds: Record<string, string> = {
  home: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop",
  about: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop",
  contact: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1920&auto=format&fit=crop",
  help: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop",
  register: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1920&auto=format&fit=crop",
  login: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1920&auto=format&fit=crop"
};

interface PublicWebsiteProps {
  products: Product[];
  categories: Category[];
  settings: Settings;
  onEnterPortal: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export default function PublicWebsite({ 
  products, 
  categories, 
  settings, 
  onEnterPortal,
  onLoginSuccess 
}: PublicWebsiteProps) {
  
  const [activeTab, setActiveTab] = useState<"home" | "about" | "contact" | "help" | "register" | "login">("home");
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Trip planner shopping list
  const [shoppingList, setShoppingList] = useState<{ product: Product; qty: number }[]>([]);
  
  // Feedback Contact form state
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRole, setRegRole] = useState<"Admin" | "Manager" | "Cashier">("Cashier");
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState("");
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Filter products for catalog
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Trip planner calculations
  const totalItemsCount = shoppingList.reduce((acc, item) => acc + item.qty, 0);
  const planSubtotal = shoppingList.reduce((acc, item) => acc + (item.product.sellingPrice * item.qty), 0);
  const planGst = shoppingList.reduce((acc, item) => {
    const gstValue = (item.product.sellingPrice * (item.product.gstRate / 100)) * item.qty;
    return acc + gstValue;
  }, 0);
  const planGrandTotal = planSubtotal + planGst;

  const handleAddToList = (product: Product) => {
    if (product.stockQty <= 0) return;
    setShoppingList(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stockQty) return prev; // cap stock limit
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const handleRemoveFromList = (productId: string) => {
    setShoppingList(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateQty = (productId: string, newQty: number, maxQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromList(productId);
      return;
    }
    if (newQty > maxQty) return;
    setShoppingList(prev => prev.map(item => item.product.id === productId ? { ...item, qty: newQty } : item));
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName || !feedbackMsg) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackMsg("");
    }, 4000);
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setRegError("Please fill in all required fields.");
      return;
    }
    setRegError("");
    setIsRegSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          phone: regPhone || "N/A"
        })
      });

      if (res.ok) {
        setRegSuccess(true);
        // Reset fields
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegPhone("");
        // Automatically switch to login screen after 2 seconds
        setTimeout(() => {
          setRegSuccess(false);
          setActiveTab("login");
          setLoginEmail(regEmail);
        }, 2200);
      } else {
        const errData = await res.json();
        setRegError(errData.error || "Failed to register profile. User might already exist.");
      }
    } catch (err) {
      setRegError("Network error: Cannot reach the registration server.");
    } finally {
      setIsRegSubmitting(false);
    }
  };

  // Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoginError("");
    setIsLoginSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        onLoginSuccess(result.user);
      } else {
        setLoginError(result.message || "Invalid work email address or key credential.");
      }
    } catch (err) {
      setLoginError("Unable to establish communication with authorization portal.");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleQuickPrefill = (emailVal: string, passVal: string) => {
    setLoginEmail(emailVal);
    setLoginPassword(passVal);
  };

  const currentBg = tabBackgrounds[activeTab] || tabBackgrounds.home;

  return (
    <div 
      className="min-h-screen flex flex-col relative text-slate-100 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
      style={{ backgroundImage: `url(${currentBg})` }}
      id="public_root"
    >
      {/* Dark overlay for ambient background to keep text highly legible (high contrast) */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs pointer-events-none z-0"></div>

      {/* Dynamic Announcement Ticker */}
      <div className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-semibold py-2 px-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <BadgePercent className="w-4 h-4 animate-bounce text-yellow-300 shrink-0" />
          <span>⚡ Live Smart Billing Enabled: Customers can browse stock, estimate rates and scan codes at terminal counters.</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] opacity-95">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-300" /> Everyday 8:00 AM - 10:00 PM</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-300" /> Guindy, Chennai</span>
        </div>
      </div>

      {/* Navigation Top Menu Bar */}
      <header className="relative z-10 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-600/30 text-white flex items-center justify-center">
              <Store className="w-6 h-6" id="public_logo_icon" />
            </div>
            <div>
              <h1 className="font-display font-black text-lg sm:text-xl tracking-tight text-white">
                {settings.storeName || "SK Smart SuperMarket"}
              </h1>
              <p className="text-[9px] font-mono font-bold text-emerald-400 tracking-widest uppercase">
                Enterprise Retail Portal
              </p>
            </div>
          </div>

          {/* Menu Buttons */}
          <nav className="hidden md:flex items-center gap-1.5">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About" },
              { id: "contact", label: "Contact" },
              { id: "help", label: "Help Guide" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons: Register & Login */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Join Staff</span>
            </button>

            <button
              onClick={() => setActiveTab("login")}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                activeTab === "login"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Staff Login</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <AnimatePresence mode="wait">
          
          {/* TAB: HOME */}
          {activeTab === "home" && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero Banner Grid */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-8 sm:p-12 rounded-3xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="max-w-3xl space-y-5 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                    <span>Guindy, Chennai's Smart Retail Hub</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    Fresh Provisions. Great Values.<br />
                    <span className="text-emerald-400">Automated Counter Lane.</span>
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                    Welcome to {settings.storeName || "SK Smart SuperMarket"}. Employees can register and log in to operate checkout registers, track warehouse purchases, monitor live stock levels, and coordinate with local Chennai distributors.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab("help")}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Read System Manual</span>
                    </button>
                    <button
                      onClick={() => {
                        const detailsElem = document.getElementById("details_section");
                        if (detailsElem) detailsElem.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Explore Store Details ↓
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Layout (Detailed Store Description, Departments & Policies) */}
              <div className="space-y-8" id="details_section">
                
                {/* Section Title */}
                <div className="text-center max-w-xl mx-auto space-y-2 pt-4">
                  <h3 className="font-display font-black text-2xl text-white tracking-tight">
                    Store Capabilities & Operations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Discover how our enterprise-grade smart billing and warehouse management systems elevate the physical shopping experience.
                  </p>
                </div>

                {/* Grid of Key Features & Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1: Smart POS Billing */}
                  <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md hover:border-emerald-500/30 transition-all space-y-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">Smart POS Checkout Lanes</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Cashiers use our integrated laser barcode scanners to instantly lookup products, compute multi-tier taxes (CGST/SGST), and apply customer loyalty membership discount structures.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Warehouse Inventory */}
                  <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md hover:border-emerald-500/30 transition-all space-y-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit">
                      <Store className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">Live Central Inventory</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Say goodbye to empty shelves. Our system records active inventory levels, triggers real-time visual alerts for low-stock provisions, and auto-deducts stock immediately upon billing.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: B2B Procurement */}
                  <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md hover:border-emerald-500/30 transition-all space-y-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">Supplier Partnerships</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Coordinated procurement ensures we bring the freshest regional produce from Guindy, Chennai farms directly to our customers, managed under professional supplier catalogs.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Loyalty Program */}
                  <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md hover:border-emerald-500/30 transition-all space-y-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-white">Loyalty & Rewards</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Earn and track loyalty cashback points with every invoice. Customers qualify for automated tier upgrades including Regular, Wholesale, VIP, and elite Premier classes.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Secondary Row: Store Operation Hours & Location info (Full width) */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-8 rounded-2xl backdrop-blur-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    
                    {/* Location */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">Store Location</h4>
                      </div>
                      <div className="text-xs text-slate-300">
                        <p className="font-bold text-white">Corporate Facility Address</p>
                        <p className="mt-1 text-slate-400 leading-relaxed">
                          Corporate Yard, 12, GST Road,<br />
                          Guindy, Chennai - 600032
                        </p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">Operating Hours</h4>
                      </div>
                      <div className="text-xs text-slate-300">
                        <p className="font-bold text-white">Timings</p>
                        <p className="mt-1 text-slate-400">
                          Everyday: 08:00 AM to 10:00 PM<br />
                          (Open on National Holidays)
                        </p>
                      </div>
                    </div>

                    {/* Support Helpline */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                        <Info className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">Support & Registration</h4>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1.5">
                        <div>
                          <p className="font-bold text-white">GSTIN</p>
                          <p className="font-mono text-slate-400">{settings.gstNumber || "33AABCS1234F1Z1"}</p>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          Helpline: <strong className="text-emerald-400">+91 44 2235 1234</strong><br />
                          Email: <strong className="text-emerald-400">support@skmarket.com</strong>
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === "about" && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-md space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                    About {settings.storeName || "SK Smart SuperMarket"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Premium Smart Retail & Supermarket Enterprise</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  Established in Chennai in 2026, <strong>{settings.storeName || "SK Smart SuperMarket"}</strong> represents the state-of-the-art in modern brick-and-mortar grocery and warehouse retail. We combine physical counters with automated real-time databases so that our inventory ledger, cashier lanes, and customer accounts remain flawlessly synchronized.
                </p>
                <p>
                  Our mission is to streamline supermarket billing and supplier operations. With full role-based clearance, our store managers and checkout clerks can scan product barcodes to process client invoices, restock items automatically upon purchasing, and review visual reports of sales trends directly from our unified control console.
                </p>
                <p>
                  Our retail facilities utilize high-speed barcoding, strict low-stock warning configurations, and smart customer profiles (Regular, Wholesale, VIP, and Premier classes) with auto-credited loyalty rewards points.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <p className="font-black text-emerald-400 text-lg sm:text-xl">100% Automatic</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Stock Deductions</p>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <p className="font-black text-emerald-400 text-lg sm:text-xl">Barcode Scan</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Simulated POS Lane</p>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                    <p className="font-black text-emerald-400 text-lg sm:text-xl">Chennai Group</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Guindy Corporate Yard</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === "contact" && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              {/* Contact Card Details */}
              <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
                <div>
                  <h3 className="font-display font-black text-lg text-white">Contact Desk</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Get in touch with Rajesh & Sudesh</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-300">Staff & Corporate Inquiry</p>
                      <p className="text-slate-400 font-mono mt-0.5">sudeshkumar2007sudesh@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-300">Guindy Store Hotline</p>
                      <p className="text-slate-400 font-mono mt-0.5">+91 98765 43210</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-300">Physical Store Address</p>
                      <p className="text-slate-400 leading-relaxed mt-0.5">Guindy Corporate Yard, GST Road, Guindy, Chennai, Tamil Nadu - 600032</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                  <p>In-store corporate registration handles tax codes (GSTIN) and registers staff credentials through automated admin desk validation.</p>
                </div>
              </div>

              {/* Message Form */}
              <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-4">
                <h3 className="font-display font-bold text-white text-base">Write Message to Administration</h3>
                
                {feedbackSent ? (
                  <div className="bg-emerald-950/50 border border-emerald-500/20 p-6 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-emerald-300">Your Inquiry Has Been Dispatched!</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Thank you. The management staff will reply to your registered work mail within 24 operational hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendFeedback} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Your Name</label>
                        <input
                          type="text"
                          required
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          placeholder="e.g. Sudesh Kumar"
                          className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Your Email</label>
                        <input
                          type="email"
                          required
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Message Details</label>
                      <textarea
                        required
                        rows={4}
                        value={feedbackMsg}
                        onChange={(e) => setFeedbackMsg(e.target.value)}
                        placeholder="Inquire about custom wholesale accounts, supplier deliveries, or technical cashier lane settings..."
                        className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none placeholder:text-slate-700"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 uppercase tracking-wider"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Dispatch</span>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB: HELP GUIDE */}
          {activeTab === "help" && (
            <motion.div 
              key="help"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-md space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">System Manual & Operational Help</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Full guides for customers and staff operators</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
                
                {/* Customers guide */}
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>Customer Guide</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>
                      <strong>Explore Departments:</strong> Check out our signature departments including Fresh Produce, Organic Dairy, and Pantry Grains directly on our Home screen.
                    </li>
                    <li>
                      <strong>Billing Inquiries:</strong> Consult our staff checkout counter operators for instant billing estimates and barcode scans.
                    </li>
                    <li>
                      <strong>Loyalty Cards:</strong> Give your phone number or email to the checkout clerk to accumulate membership points on purchases.
                    </li>
                  </ul>
                </div>

                {/* Staff guide */}
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Staff Operator Guide</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>
                      <strong>Self-Registration:</strong> If you are a new worker, click the "Join Staff" tab to register your account. Managers, Cashiers, or Administrators are immediately added to the database.
                    </li>
                    <li>
                      <strong>Barcode Scanning:</strong> When checking out bills or adding new warehouse products, click the <strong>"Simulate Barcode Scan"</strong> option. The system will auto-populate key UPC/EAN values and trigger an audio beep.
                    </li>
                    <li>
                      <strong>Auto Stock Update:</strong> Billing transactions automatically subtract stock. Warehouse purchases automatically increment stock!
                    </li>
                  </ul>
                </div>

              </div>

              {/* Roles Description Alert */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                <p className="font-bold mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Clearence Privilege Rules</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Super Administrator:</strong> Full clearance. Can add, edit, or delete products, suppliers, customers, and invoice billing records. <br />
                  <strong>Other Roles (Manager / Cashier):</strong> Limited clearance. Managers can add or edit products, customers, and purchase history to handle daily operations, but they do NOT have full delete permissions. Cashiers have read-only or invoice billing access only.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB: REGISTER */}
          {activeTab === "register" && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="bg-emerald-600 inline-flex p-3 rounded-2xl text-white justify-center items-center shadow-md">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-xl text-white">Join Staff Register</h3>
                <p className="text-xs text-slate-400">Register new personnel clearance</p>
              </div>

              {regSuccess ? (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-center text-xs space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-bold">Staff Account Registered Successfully!</p>
                  <p className="text-[10px] text-slate-400">Loading authorized login session credentials...</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {regError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl text-center">
                      {regError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Sudesh Kumar"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Work Email Address</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. sudesh@supermarket.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Key / Password</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mobile Number</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg"
                  >
                    {isRegSubmitting ? "Registering Clearance..." : "Join Lane Operators"}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* TAB: LOGIN */}
          {activeTab === "login" && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="bg-emerald-600 inline-flex p-3 rounded-2xl text-white justify-center items-center shadow-md">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-xl text-white">{settings.storeName || "SK Smart Supermarket"} Portal</h3>
                <p className="text-xs text-slate-400">Terminal Access Authentication</p>
              </div>

              {loginError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Work Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. admin@supermarket.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Session Password / Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer shadow-lg"
                >
                  {isLoginSubmitting ? "Authenticating session..." : "Verify Lane Security Clearance"}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Corporate Professional Footer */}
      <footer className="relative z-10 bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-extrabold text-slate-100 tracking-tight text-sm">
                {settings.storeName || "SK Smart SuperMarket"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">© 2026 Chennai Smart Retail Group Ltd. All rights reserved.</p>
            </div>
          </div>
          
          <div className="flex gap-6 text-[11px]">
            <span className="text-slate-500">Corporate Email: sudeshkumar2007sudesh@gmail.com</span>
            <span className="text-slate-500">VAT/GST Registered Terminal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
