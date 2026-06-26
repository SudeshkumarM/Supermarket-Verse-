import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, ShoppingCart, Package, Tags, Truck, Users, 
  Receipt, UserSquare2, Settings as SettingsIcon, LogOut, Bell, 
  Plus, Edit3, Trash2, Search, ArrowLeft, RefreshCw, BarChart2, 
  FileText, ShieldAlert, CheckCircle, Smartphone, Camera, Check, HelpCircle, Boxes 
} from "lucide-react";
import { User, Product, Category, Supplier, Customer, Bill, Notification, Log, Settings } from "../types";
import { apiFetch } from "../clientDb";

interface AdminPortalProps {
  currentUser: User;
  onLogout: () => void;
  appSettings: Settings;
}

const adminTabBackgrounds: Record<string, string> = {
  dashboard: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop",
  my_account: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1920&auto=format&fit=crop",
  pos: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?q=80&w=1920&auto=format&fit=crop",
  products: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1920&auto=format&fit=crop",
  purchase: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1920&auto=format&fit=crop",
  stock: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1920&auto=format&fit=crop",
  categories: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1920&auto=format&fit=crop",
  suppliers: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1920&auto=format&fit=crop",
  customers: "https://images.unsplash.com/photo-1556745753-b2904692b3cd?q=80&w=1920&auto=format&fit=crop",
  bills: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1920&auto=format&fit=crop",
  users: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1920&auto=format&fit=crop",
  settings: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"
};

export default function AdminPortal({ currentUser, onLogout, appSettings }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [dbState, setDbState] = useState<{
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    customers: Customer[];
    users: User[];
    bills: Bill[];
    logs: Log[];
    notifications: Notification[];
    settings: Settings;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dynamic Modals state
  const [activeModal, setActiveModal] = useState<{
    type: "product" | "category" | "supplier" | "customer" | "user" | "bill_detail";
    action: "add" | "edit" | "view";
    data?: any;
  } | null>(null);

  // Custom Delete Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string;
    id: string;
  } | null>(null);

  // POS Checkout Lane States
  const [posCart, setPosCart] = useState<{ product: Product; qty: number }[]>([]);
  const [posSearchQuery, setPosCartSearchQuery] = useState("");
  const [posSelectedCustomer, setPosSelectedCustomer] = useState<string>("walkin");
  const [posPaymentMode, setPosPaymentMode] = useState<"Cash" | "Card" | "UPI">("Cash");
  const [posReceivedAmount, setPosReceivedAmount] = useState<number>(0);
  const [simulatedBarcode, setSimulatedBarcode] = useState<string>("");
  const [posMessage, setPosMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Product Lookup Barcode Scanner States
  const [productLookupBarcode, setProductLookupBarcode] = useState<string>("");
  const [scannedProductResult, setScannedProductResult] = useState<Product | null>(null);
  const [productScanError, setProductScanError] = useState<string>("");

  // Product CRUD Modal Barcode and QR Code States
  const [productBarcodeVal, setProductBarcodeVal] = useState("");
  const [productQrCodeVal, setProductQrCodeVal] = useState("");
  const [isProductBarcodeCameraActive, setIsProductBarcodeCameraActive] = useState(false);
  const [isProductQrCameraActive, setIsProductQrCameraActive] = useState(false);

  // Live Camera Barcode/QR Scanning States and Effects
  const [isPosCameraActive, setIsPosCameraActive] = useState(false);
  const [isLookupCameraActive, setIsLookupCameraActive] = useState(false);

  // POS Check-out lane camera scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isPosCameraActive) {
      const containerId = "pos-camera-viewport";
      html5QrCode = new Html5Qrcode(containerId);
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const minDim = Math.min(width, height);
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          // Play a friendly scanner beep
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {}
          
          handleSimulateBarcodeScan(decodedText);
          setIsPosCameraActive(false); // Stop after successful scan
        },
        () => {}
      ).catch(err => {
        console.error("Failed to start POS camera scanner:", err);
      });
    }

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping POS scanner:", err));
        }
      }
    };
  }, [isPosCameraActive]);

  // Inventory lookup camera scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isLookupCameraActive) {
      const containerId = "lookup-camera-viewport";
      html5QrCode = new Html5Qrcode(containerId);
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const minDim = Math.min(width, height);
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
          } catch (e) {}

          setProductLookupBarcode(decodedText);
          handleProductBarcodeLookup(decodedText);
          setIsLookupCameraActive(false); // Stop after successful scan
        },
        () => {}
      ).catch(err => {
        console.error("Failed to start lookup camera scanner:", err);
      });
    }

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping lookup scanner:", err));
        }
      }
    };
  }, [isLookupCameraActive]);

  // Synchronize product modal state when activeModal changes
  useEffect(() => {
    if (activeModal && activeModal.type === "product") {
      setProductBarcodeVal(activeModal.data?.barcode || "");
      setProductQrCodeVal(activeModal.data?.qrCode || "");
    } else {
      setProductBarcodeVal("");
      setProductQrCodeVal("");
      setIsProductBarcodeCameraActive(false);
      setIsProductQrCameraActive(false);
    }
  }, [activeModal]);

  // Product Modal Barcode camera scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isProductBarcodeCameraActive) {
      const containerId = "product-barcode-camera-viewport";
      html5QrCode = new Html5Qrcode(containerId);
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const minDim = Math.min(width, height);
            const size = Math.floor(minDim * 0.75);
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {}
          
          setProductBarcodeVal(decodedText);
          setIsProductBarcodeCameraActive(false); // Stop after successful scan
        },
        () => {}
      ).catch(err => {
        console.error("Failed to start Product Barcode camera scanner:", err);
      });
    }

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping Product Barcode scanner:", err));
        }
      }
    };
  }, [isProductBarcodeCameraActive]);

  // Product Modal QR code camera scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isProductQrCameraActive) {
      const containerId = "product-qr-camera-viewport";
      html5QrCode = new Html5Qrcode(containerId);
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const minDim = Math.min(width, height);
            const size = Math.floor(minDim * 0.75);
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {}
          
          setProductQrCodeVal(decodedText);
          setIsProductQrCameraActive(false); // Stop after successful scan
        },
        () => {}
      ).catch(err => {
        console.error("Failed to start Product QR camera scanner:", err);
      });
    }

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping Product QR scanner:", err));
        }
      }
    };
  }, [isProductQrCameraActive]);

  // Auto-Save Settings States & Handler
  const [settingsSavingStatus, setSettingsSavingStatus] = useState<"Saved" | "Saving..." | "Error saving">("Saved");

  const handleAutoSaveSettings = async (field: string, value: any) => {
    setSettingsSavingStatus("Saving...");
    try {
      const payload = {
        ...settings,
        [field]: value
      };

      const res = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSettingsSavingStatus("Saved");
        setDbState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            settings: payload as any
          };
        });
      } else {
        setSettingsSavingStatus("Error saving");
      }
    } catch (e) {
      setSettingsSavingStatus("Error saving");
    }
  };

  // Load database state
  const fetchDB = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setDbState(data);
      }
    } catch (e) {
      console.error("Error fetching db state:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDB();
    // Auto checkout to pos if user is a Cashier
    if (currentUser.role === "Cashier") {
      setActiveTab("pos");
    }

    // Set up real-time multi-user synchronization (auto-poll every 5 seconds)
    const interval = setInterval(() => {
      fetchDB();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!dbState) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="font-display font-bold text-lg tracking-wider">SK Smart SuperMarket Database Syncing...</p>
      </div>
    );
  }

  const { products, categories, suppliers, customers, users, bills, logs, notifications, settings } = dbState;

  // Notification Mark Read Handler
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setDbState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
          };
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // CRUD Handler - Delete Entity
  const handleDeleteEntity = (type: string, id: string) => {
    setDeleteConfirm({ type, id });
  };

  const executeDeleteEntity = async (type: string, id: string) => {
    try {
      const res = await apiFetch(`/api/${type}/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDB();
        // Log action
        await triggerAuditLog(`Deleted ${type} record ID: ${id}`);
      }
    } catch (e) {
      alert("Error deleting record");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // CRUD Handler - Create or Update Entity
  const handleSaveEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const { type, action, data } = activeModal;
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload: any = {};
    formData.forEach((value, key) => {
      // Parse numbers if applicable
      if (["purchasePrice", "sellingPrice", "gstRate", "stockQty", "lowStockThreshold", "phone"].includes(key)) {
        payload[key] = Number(value);
      } else {
        payload[key] = value;
      }
    });

    try {
      const pluralizeType = (t: string) => {
        if (t === "category") return "categories";
        return t + "s";
      };
      const url = action === "add" ? `/api/${pluralizeType(type)}` : `/api/${pluralizeType(type)}/${data.id}`;
      const method = action === "add" ? "POST" : "PUT";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchDB();
        setActiveModal(null);
        await triggerAuditLog(`${action === "add" ? "Created" : "Modified"} ${type}: ${payload.name || payload.fullname || (data ? data.id : "")}`);
      } else {
        alert("Failed to save changes. Please review values.");
      }
    } catch (err) {
      alert("Network saving error");
    }
  };

  // Create Activity Audit Logs
  const triggerAuditLog = async (action: string) => {
    // Audit logs are stored directly via express during state changes, but we refresh local view
    fetchDB();
  };

  // Product Barcode lookup simulator for Central Inventory
  const handleProductBarcodeLookup = (codeToScan?: string) => {
    const code = codeToScan || productLookupBarcode;
    if (!code) {
      setProductScanError("Please enter or select a barcode to scan.");
      setScannedProductResult(null);
      return;
    }
    const match = dbState?.products.find(p => p.barcode === code || p.id === code);
    if (match) {
      setScannedProductResult(match);
      setProductScanError("");
    } else {
      setScannedProductResult(null);
      setProductScanError(`No product found in catalog with barcode: "${code}"`);
    }
  };

  // Triggering simulated Camera QR/Barcode Scan
  const handleSimulateBarcodeScan = (codeToScan?: string) => {
    const code = codeToScan || simulatedBarcode;
    if (!code) return;
    
    // Find matching product
    const match = products.find(p => p.barcode === code || p.qrCode === code || p.id === code);
    if (match) {
      if (match.stockQty <= 0) {
        setPosMessage({ text: `"${match.name}" is completely out of stock!`, type: "error" });
        return;
      }
      setPosCart(prev => {
        const existing = prev.find(item => item.product.id === match.id);
        if (existing) {
          if (existing.qty >= match.stockQty) {
            setPosMessage({ text: `Cannot exceed live counter stock of ${match.stockQty} for ${match.name}`, type: "error" });
            return prev;
          }
          return prev.map(item => item.product.id === match.id ? { ...item, qty: item.qty + 1 } : item);
        }
        return [...prev, { product: match, qty: 1 }];
      });
      setPosMessage({ text: `Successfully scanned: ${match.name}`, type: "success" });
      setSimulatedBarcode("");
    } else {
      setPosMessage({ text: "No product matches this Barcode/QR Code.", type: "error" });
    }
    setTimeout(() => setPosMessage(null), 3500);
  };

  // POS Checkout Submission
  const handlePOSCheckout = async () => {
    if (posCart.length === 0) return;
    
    const subtotal = posCart.reduce((sum, item) => sum + (item.product.sellingPrice * item.qty), 0);
    const totalGst = posCart.reduce((sum, item) => {
      const itemGst = (item.product.sellingPrice * (item.product.gstRate / 100)) * item.qty;
      return sum + itemGst;
    }, 0);
    
    // Calculate customer discount if premium or VIP
    const customerObj = customers.find(c => c.id === posSelectedCustomer);
    let discount = 0;
    if (customerObj) {
      if (customerObj.type === "VIP") discount = (subtotal + totalGst) * 0.10; // 10% VIP Disc
      else if (customerObj.type === "Premium") discount = (subtotal + totalGst) * 0.05; // 5% Prem Disc
    }

    const grandTotal = Math.max(0, subtotal + totalGst - discount);
    
    if (posPaymentMode === "Cash" && posReceivedAmount < grandTotal) {
      alert(`Insufficient cash received. Need at least ₹${grandTotal.toFixed(2)}`);
      return;
    }

    const changeAmount = posPaymentMode === "Cash" ? Math.max(0, posReceivedAmount - grandTotal) : 0;

    const billItems = posCart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      barcode: item.product.barcode,
      qty: item.qty,
      sellingPrice: item.product.sellingPrice,
      purchasePrice: item.product.purchasePrice,
      gstRate: item.product.gstRate,
      gstAmount: (item.product.sellingPrice * (item.product.gstRate / 100)) * item.qty,
      total: (item.product.sellingPrice * item.qty)
    }));

    const billData = {
      items: billItems,
      cashierId: currentUser.id,
      cashierName: currentUser.fullname,
      cashierEmail: currentUser.email,
      customerId: customerObj ? customerObj.id : undefined,
      customerName: customerObj ? customerObj.name : "Walk-in Customer",
      subtotal,
      totalGst,
      discount,
      grandTotal,
      paymentMode: posPaymentMode,
      receivedAmount: posPaymentMode === "Cash" ? posReceivedAmount : grandTotal,
      changeAmount
    };

    try {
      const res = await apiFetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billData })
      });

      if (res.ok) {
        const createdBill = await res.json();
        // Clear POS
        setPosCart([]);
        setPosReceivedAmount(0);
        // Show bill receipt view
        setActiveModal({
          type: "bill_detail",
          action: "view",
          data: createdBill
        });
        fetchDB();
      } else {
        alert("Billing checkout failed.");
      }
    } catch (e) {
      alert("Network checkout error");
    }
  };

  // Dashboard Stats calculations
  const totalSalesVal = bills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalInvoicesCount = bills.length;
  const lowStockCount = products.filter(p => p.stockQty <= p.lowStockThreshold).length;
  const activeCustomersCount = customers.length;
  const activeStaffCount = users.length;

  // Dynamic theme configurations mapping (Classic Slate Style)
  const themeStyles = (() => {
    switch (settings?.theme) {
      case "telegram":
        return {
          bgClass: "bg-slate-900/90 text-slate-100",
          overlayClass: "bg-gradient-to-br from-[#182533]/98 via-[#0f1721]/98 to-[#1e344e]/98 backdrop-blur-md",
          panelClass: "bg-[#17212b]/90 border-[#202b36] text-[#f5f5f5] shadow-xl shadow-slate-950/20",
          sidebarClass: "bg-[#17212b] border-[#202b36] text-[#f5f5f5]",
          accentColor: "text-[#4ca2ff]",
          accentBg: "bg-[#2b5278] hover:bg-[#36638f] text-white shadow-lg shadow-blue-500/10",
          accentBorder: "border-[#2b5278]/40",
          activeBtnClass: "bg-[#2b5278] text-white shadow-lg shadow-blue-500/15 border-l-4 border-[#4ca2ff]",
          hoverBtnClass: "hover:bg-[#202b36] hover:text-white text-slate-400"
        };
      case "midnight":
        return {
          bgClass: "bg-black/90 text-slate-100",
          overlayClass: "bg-gradient-to-br from-[#010103]/98 via-[#040612]/98 to-[#0a0a1a]/98 backdrop-blur-md",
          panelClass: "bg-[#0b0c16]/90 border-blue-950/80 text-white shadow-xl shadow-black",
          sidebarClass: "bg-[#03040b] border-blue-950 text-white",
          accentColor: "text-cyan-400",
          accentBg: "bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 shadow-lg shadow-cyan-500/10",
          accentBorder: "border-blue-950",
          activeBtnClass: "bg-cyan-500/15 text-cyan-300 border-l-4 border-cyan-400",
          hoverBtnClass: "hover:bg-slate-900/80 hover:text-white text-slate-400"
        };
      case "emerald":
        return {
          bgClass: "bg-slate-950/90 text-slate-100",
          overlayClass: "bg-gradient-to-b from-[#04100b]/98 to-[#091e14]/98 backdrop-blur-md",
          panelClass: "bg-[#081e14]/90 border-emerald-900/40 text-[#ecfdf5] shadow-xl shadow-black/20",
          sidebarClass: "bg-[#05130d] border-emerald-950 text-[#ecfdf5]",
          accentColor: "text-emerald-400",
          accentBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10",
          accentBorder: "border-emerald-800/40",
          activeBtnClass: "bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-500",
          hoverBtnClass: "hover:bg-[#071911] hover:text-[#ecfdf5] text-slate-400"
        };
      case "amber":
        return {
          bgClass: "bg-slate-950/90 text-slate-100",
          overlayClass: "bg-gradient-to-b from-[#120a02]/98 to-[#241504]/98 backdrop-blur-md",
          panelClass: "bg-[#1d1206]/90 border-amber-900/40 text-[#fef3c7] shadow-xl shadow-black/20",
          sidebarClass: "bg-[#110a03] border-amber-950 text-[#fef3c7]",
          accentColor: "text-amber-400",
          accentBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/10",
          accentBorder: "border-amber-800/40",
          activeBtnClass: "bg-amber-500/15 text-amber-300 border-l-4 border-amber-500",
          hoverBtnClass: "hover:bg-[#150d04] hover:text-[#fef3c7] text-slate-400"
        };
      case "retro":
        return {
          bgClass: "bg-slate-950 text-slate-100",
          overlayClass: "bg-gradient-to-br from-[#0c051d]/98 via-[#02010d]/98 to-[#1b0016]/98 backdrop-blur-md",
          panelClass: "bg-[#15092a]/80 border-pink-500/30 text-slate-200 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
          sidebarClass: "bg-[#0a0318]/95 border-purple-500/20 text-slate-200",
          accentColor: "text-pink-400",
          accentBg: "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]",
          accentBorder: "border-pink-500/20",
          activeBtnClass: "bg-purple-900/40 text-pink-400 border-l-4 border-pink-500",
          hoverBtnClass: "hover:bg-purple-950/50 hover:text-white text-slate-400"
        };
      case "light":
        return {
          bgClass: "bg-slate-50 text-slate-800",
          overlayClass: "bg-slate-100/60 backdrop-blur-sm",
          panelClass: "bg-white border-slate-200 text-slate-800 shadow-sm",
          sidebarClass: "bg-slate-100 border-slate-200 text-slate-800",
          accentColor: "text-emerald-600",
          accentBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
          accentBorder: "border-slate-200",
          activeBtnClass: "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600 shadow-sm",
          hoverBtnClass: "hover:bg-slate-200/50 hover:text-slate-700 text-slate-500"
        };
      case "dark":
      default:
        return {
          bgClass: "bg-slate-950/90 text-slate-100",
          overlayClass: "bg-slate-950/85 backdrop-blur-sm",
          panelClass: "bg-slate-950/60 border-slate-800/80 text-slate-100",
          sidebarClass: "bg-slate-950 border-slate-800 text-slate-100",
          accentColor: "text-emerald-400",
          accentBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10",
          accentBorder: "border-slate-800/80",
          activeBtnClass: "bg-slate-900 text-emerald-400 border-l-4 border-emerald-500",
          hoverBtnClass: "hover:bg-slate-900 hover:text-white text-slate-400"
        };
    }
  })();

  const fontFamilyClass = (() => {
    switch (settings?.fontFamily) {
      case "display": return "font-display";
      case "mono": return "font-mono";
      case "serif": return "font-serif";
      case "sans":
      default: return "font-sans";
    }
  })();

  const fontSizeClass = (() => {
    switch (settings?.fontSize) {
      case "small": return "text-xs";
      case "large": return "text-base";
      case "xlarge": return "text-lg";
      case "medium":
      default: return "text-sm";
    }
  })();

  const currentAdminBg = adminTabBackgrounds[activeTab] || adminTabBackgrounds.dashboard;

  return (
    <div 
      className={`min-h-screen ${fontFamilyClass} ${fontSizeClass} bg-cover bg-center bg-no-repeat flex flex-col md:flex-row relative overflow-x-hidden transition-all duration-700 ease-in-out ${themeStyles.bgClass}`} 
      id="admin_portal_root"
      style={{ backgroundImage: `url(${currentAdminBg})` }}
    >
      {/* Dynamic Ambient Background Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-0 ${themeStyles.overlayClass}`}></div>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full md:w-64 border-r flex flex-col justify-between shrink-0 relative z-10 backdrop-blur-md ${themeStyles.sidebarClass}`}>
        <div>
          {/* Internal Title Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/10">
              <LayoutDashboard className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-sm text-white truncate max-w-40">{settings.storeName}</h2>
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                Desk Role: {currentUser.role}
              </span>
            </div>
          </div>

          {/* Quick Staff Info */}
          <div className="px-6 py-4 bg-slate-900/40 border-b border-slate-800/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-500/20 text-white font-bold flex items-center justify-center text-xs shadow-inner">
              {currentUser.fullname.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{currentUser.fullname}</p>
              <p className="text-[9px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>          {/* NAVIGATION LINKS */}
          <nav className="p-4 space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "dashboard"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("my_account")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "my_account"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <UserSquare2 className="w-4 h-4" />
              <span>My Account</span>
            </button>

            <button
              onClick={() => setActiveTab("pos")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "pos"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Billing (POS Lane)</span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "products"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab("purchase")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "purchase"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Supplier Purchases</span>
            </button>

            <button
              onClick={() => setActiveTab("stock")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "stock"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Warehouse Stock</span>
            </button>

            <button
              onClick={() => setActiveTab("categories")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "categories"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Tags className="w-4 h-4" />
              <span>Stock Categories</span>
            </button>

            <button
              onClick={() => setActiveTab("suppliers")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "suppliers"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>B2B Suppliers</span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "customers"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Database</span>
            </button>

            <button
              onClick={() => setActiveTab("bills")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === "bills"
                  ? themeStyles.activeBtnClass
                  : themeStyles.hoverBtnClass
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoice History</span>
            </button>

            {currentUser.role === "Admin" && (
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "users"
                    ? themeStyles.activeBtnClass
                    : themeStyles.hoverBtnClass
                }`}
              >
                <UserSquare2 className="w-4 h-4" />
                <span>Staff Registry</span>
              </button>
            )}

            {currentUser.role === "Admin" && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === "settings"
                    ? themeStyles.activeBtnClass
                    : themeStyles.hoverBtnClass
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Website Settings</span>
              </button>
            )}
          </nav>
        </div>

        {/* LOGOUT FOOTER */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <button
            onClick={onLogout}
            id="btn_logout_desk"
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Close Desk Session</span>
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE CONTENT AREA */}
      <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto max-h-screen relative z-10">
        
        {/* OVERVIEW DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-white">SK SuperMarket Insights</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time terminal statistics, B2B inventory tracking and billing performance.</p>
              </div>

              {/* Database Refresh Ticker */}
              <button
                onClick={fetchDB}
                className="flex items-center gap-1.5 self-start text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync Server DB</span>
              </button>
            </div>

            {/* BENTO STATS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Gross Billing</p>
                  <p className="text-2xl font-extrabold text-white mt-1">₹{totalSalesVal.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">All processed lanes</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                  <BarChart2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Invoices Issued</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{totalInvoicesCount}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Audit compliant</p>
                </div>
                <div className="bg-sky-500/10 p-3 rounded-xl text-sky-500">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
                  <p className="text-2xl font-extrabold text-amber-500 mt-1">{lowStockCount}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Threshold limit reached</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Active Customers</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{activeCustomersCount}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Loyalty points enabled</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl text-purple-500">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Custom SVG Interactive Bar Chart (8 cols) */}
              <div className="lg:col-span-8 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
                <h4 className="font-display font-bold text-slate-200 text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Lanes Billing Volume (₹ Revenue per invoice)</span>
                </h4>
                
                {/* SVG Visualizer */}
                <div className="h-56 w-full flex items-end justify-between gap-1 pt-4 border-b border-slate-800">
                  {bills.length > 0 ? (
                    // Show last 10 bills as columns
                    bills.slice(0, 10).reverse().map((b, i) => {
                      const maxTotal = Math.max(...bills.map(item => item.grandTotal), 100);
                      const heightPercent = (b.grandTotal / maxTotal) * 100;
                      return (
                        <div key={b.id} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                          {/* Tooltip popover */}
                          <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-emerald-600 text-white font-mono text-[10px] font-bold py-1 px-2 rounded shadow-xl transition-all z-20 whitespace-nowrap">
                            ₹{b.grandTotal.toFixed(1)} ({b.billNo})
                          </div>
                          <div 
                            style={{ height: `${Math.max(10, heightPercent)}%` }}
                            className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t-lg transition-all shadow-inner"
                          ></div>
                          <span className="text-[9px] font-mono text-slate-500 mt-2 truncate max-w-10">{b.billNo}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      No invoices currently recorded. Create one in POS checkout!
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>← Older checkouts</span>
                  <span>Most recent checkout →</span>
                </div>
              </div>

              {/* Near Expiry / Alert Notifications Drawer (4 cols) */}
              <div className="lg:col-span-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-bold text-slate-200 text-sm flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span>Security & Stock Alerts</span>
                    </span>
                    <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.filter(n => !n.read).length} Urgent
                    </span>
                  </h4>

                  <div className="space-y-3 mt-4 max-h-56 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-xl border text-xs flex gap-2 justify-between transition-all ${
                            n.read 
                              ? "bg-slate-900/30 border-slate-800/50 opacity-60" 
                              : "bg-red-500/10 border-red-500/20"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${n.read ? "bg-slate-600" : "bg-red-500 animate-ping"}`}></span>
                              {n.title}
                            </p>
                            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-slate-600 font-mono block mt-1">
                              {new Date(n.date).toLocaleString()}
                            </span>
                          </div>

                          {!n.read && (
                            <button
                              onClick={() => handleMarkNotificationRead(n.id)}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold self-start cursor-pointer hover:bg-slate-800 p-1 rounded shrink-0"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">No warnings currently generated.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Latest Staff Audit Trail logs */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <h4 className="font-display font-bold text-slate-200 text-sm flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Audit Trail & Activity Logs</span>
                </span>
              </h4>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 font-mono text-xs">
                {logs.map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400 hover:text-slate-200 transition-all">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                        {log.role}
                      </span>
                      <span className="font-semibold text-slate-300">{log.fullname}</span>
                      <span>({log.userEmail})</span>
                      <span className="text-slate-100 font-semibold">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-600">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POS CHECKOUT TERMINAL LANES */}
        {activeTab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT BAR: Live Catalog Selection & Scan (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-display font-bold text-base flex items-center gap-2 text-white">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                    <span>Lanes Check-Out Desk</span>
                  </h3>
                  <span className="text-xs bg-slate-800 font-bold px-2 py-1 rounded text-emerald-400">
                    Live Session Active
                  </span>
                </div>

                {/* Real Camera Barcode/QR Scanner & Simulator Controls */}
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-4">
                  <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">Integrated Retail Barcode Scanner</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPosCameraActive(!isPosCameraActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPosCameraActive 
                          ? "bg-rose-600 hover:bg-rose-500 text-white" 
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isPosCameraActive ? "Stop Camera" : "Start Live Camera Scan"}</span>
                    </button>
                  </div>

                  {/* Live Camera Feed Viewport */}
                  {isPosCameraActive ? (
                    <div className="space-y-2">
                      <div className="relative w-full aspect-[4/3] max-w-md mx-auto bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner">
                        <div id="pos-camera-viewport" className="w-full h-full" />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-lg opacity-60 animate-pulse relative">
                            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-500/80 animate-[bounce_2s_infinite]" />
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-[10px] text-slate-500 font-mono">
                        Align any product Barcode or QR Code within the central guideline box to scan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={simulatedBarcode}
                          onChange={(e) => setSimulatedBarcode(e.target.value)}
                          placeholder="Type barcode or select one to simulate scan..."
                          className="flex-grow bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSimulateBarcodeScan()}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 rounded-lg cursor-pointer"
                        >
                          Scan Barcode
                        </button>
                      </div>
                      
                      {/* Shortcut barcodes generator */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Sample scan barcodes:</span>
                        {products.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleSimulateBarcodeScan(p.barcode)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-emerald-400 px-2 py-1 rounded font-mono hover:text-white transition-all cursor-pointer"
                          >
                            [ {p.brand}: {p.barcode} ]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Item Quick Selector Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => setPosCartSearchQuery(e.target.value)}
                    placeholder="Quick search and click to add to transaction..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 pl-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Status Alert Popups inside checkout */}
              {posMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  posMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {posMessage.text}
                </div>
              )}

              {/* Products Quick Grid list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {products
                  .filter(p => p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) || p.brand.toLowerCase().includes(posSearchQuery.toLowerCase()))
                  .map(p => {
                    const isOutOfStock = p.stockQty <= 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && handleSimulateBarcodeScan(p.barcode)}
                        className={`bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer flex justify-between items-center gap-3 transition-all ${
                          isOutOfStock ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Brand: {p.brand} | Barcode: {p.barcode}</p>
                          <p className="text-xs font-extrabold text-emerald-400 mt-2">₹{p.sellingPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock ? "bg-rose-500/10 text-rose-400" : p.stockQty <= p.lowStockThreshold ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
                          }`}>
                            {isOutOfStock ? "Out of Stock" : `Qty: ${p.stockQty}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* RIGHT BAR: Current active POS Cart invoice calculations (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-display font-bold text-sm text-slate-200">Lane Transaction Basket</h4>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Invoice #{bills.length + 1001}
                  </span>
                </div>

                {/* Cart Lists */}
                {posCart.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {posCart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center gap-2 text-xs border-b border-slate-800/60 pb-2.5">
                        <div className="min-w-0 flex-grow">
                          <p className="font-bold text-white truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-500">₹{item.product.sellingPrice.toFixed(2)} each</p>
                        </div>

                        {/* Cart Modifier controls */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                          <button
                            onClick={() => {
                              if (item.qty <= 1) {
                                setPosCart(prev => prev.filter(p => p.product.id !== item.product.id));
                              } else {
                                setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, qty: item.qty - 1 } : p));
                              }
                            }}
                            className="w-5 h-5 bg-slate-800 rounded font-bold hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-4 text-center">{item.qty}</span>
                          <button
                            onClick={() => {
                              if (item.qty >= item.product.stockQty) {
                                alert(`Only ${item.product.stockQty} units exist in counter stock.`);
                                return;
                              }
                              setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, qty: item.qty + 1 } : p));
                            }}
                            className="w-5 h-5 bg-slate-800 rounded font-bold hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-extrabold text-white w-16 text-right">
                          ₹{(item.product.sellingPrice * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600 space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto stroke-1" />
                    <p className="text-xs">Counter cart is currently empty.</p>
                  </div>
                )}
              </div>

              {/* POS Billing configuration details */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                
                {/* Select Customer / Loyalty Integration */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Customer Loyalty Association</label>
                  <select
                    value={posSelectedCustomer}
                    onChange={(e) => setPosSelectedCustomer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="walkin">Walk-In Customer (No discounts)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type} - Points: {c.loyaltyPoints})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Calculations Panel */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  {(() => {
                    const subtotal = posCart.reduce((sum, item) => sum + (item.product.sellingPrice * item.qty), 0);
                    const totalGst = posCart.reduce((sum, item) => {
                      const itemGst = (item.product.sellingPrice * (item.product.gstRate / 100)) * item.qty;
                      return sum + itemGst;
                    }, 0);
                    const customerObj = customers.find(c => c.id === posSelectedCustomer);
                    let discount = 0;
                    if (customerObj) {
                      if (customerObj.type === "VIP") discount = (subtotal + totalGst) * 0.10;
                      else if (customerObj.type === "Premium") discount = (subtotal + totalGst) * 0.05;
                    }
                    const grandTotal = Math.max(0, subtotal + totalGst - discount);

                    return (
                      <>
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>CGST + SGST</span>
                          <span>₹{totalGst.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-500 font-bold">
                            <span>Loyalty Disc ({customerObj?.type})</span>
                            <span>-₹{discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-800/80">
                          <span>Grand Total</span>
                          <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                        </div>

                        {/* Payment Mode Selector */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
                          {["Cash", "Card", "UPI"].map(mode => (
                            <button
                              key={mode}
                              onClick={() => setPosPaymentMode(mode as any)}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                posPaymentMode === mode 
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                                  : "bg-slate-800 hover:bg-slate-750 text-slate-400"
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>

                        {/* Cash Drawer Changer */}
                        {posPaymentMode === "Cash" && (
                          <div className="space-y-1.5 pt-3">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Cash Received (₹)</span>
                              {posReceivedAmount >= grandTotal && (
                                <span className="text-emerald-500 font-bold">Change Change: ₹{(posReceivedAmount - grandTotal).toFixed(2)}</span>
                              )}
                            </div>
                            <input
                              type="number"
                              min={grandTotal}
                              value={posReceivedAmount || ""}
                              onChange={(e) => setPosReceivedAmount(Number(e.target.value))}
                              placeholder="Input cashier drawer cash received..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* POS Billing Submit Button */}
                <button
                  onClick={handlePOSCheckout}
                  disabled={posCart.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-600 py-3 rounded-xl text-xs font-extrabold tracking-wider shadow-lg hover:shadow-emerald-600/15 cursor-pointer transition-all uppercase"
                >
                  Complete Checkout Lane
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS INVENTORY PANEL */}
        {activeTab === "products" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Central Inventory</h3>
                <p className="text-xs text-slate-400">Master product catalog logs, scanning barcodes, price rates, B2B updates, and stock replenishment.</p>
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setActiveModal({ type: "product", action: "add" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 self-start cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Integrated Products Barcode Lookup Scanner */}
            <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400 font-display">Integrated Product Barcode Scanner Lookup</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLookupCameraActive(!isLookupCameraActive)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isLookupCameraActive 
                      ? "bg-rose-600 hover:bg-rose-500 text-white" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isLookupCameraActive ? "Stop Camera" : "Start Live Camera Scan"}</span>
                </button>
              </div>

              {isLookupCameraActive ? (
                <div className="space-y-2">
                  <div className="relative w-full aspect-[4/3] max-w-md mx-auto bg-slate-950 rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner">
                    <div id="lookup-camera-viewport" className="w-full h-full" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-lg opacity-60 animate-pulse relative">
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-500/80 animate-[bounce_2s_infinite]" />
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-500 font-mono">
                    Align any product Barcode or QR Code within the central guideline box to scan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={productLookupBarcode}
                        onChange={(e) => setProductLookupBarcode(e.target.value)}
                        placeholder="Enter/Scan product barcode number (e.g. 8901408130124)..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => handleProductBarcodeLookup()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-6 rounded-xl cursor-pointer shadow-md hover:shadow-emerald-600/10 transition-all"
                    >
                      Lookup Barcode
                    </button>
                  </div>

                  {/* Quick Sample shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Sample product barcodes:</span>
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProductLookupBarcode(p.barcode);
                          handleProductBarcodeLookup(p.barcode);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-emerald-400 px-2.5 py-1.5 rounded-lg font-mono transition-all cursor-pointer"
                      >
                        {p.brand}: {p.barcode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scanned product result card */}
              {scannedProductResult && (
                <div className="p-4 bg-slate-900/60 border border-emerald-500/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">{scannedProductResult.brand}</span>
                      <h4 className="text-sm font-bold text-white">{scannedProductResult.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-slate-400 text-[11px] mt-1">
                      <p>Barcode: <span className="font-mono text-white">{scannedProductResult.barcode}</span></p>
                      <p>Stock Qty: <span className={`font-bold ${scannedProductResult.stockQty <= scannedProductResult.lowStockThreshold ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}`}>{scannedProductResult.stockQty} units</span></p>
                      <p>Selling Price: <span className="font-bold text-white font-mono">₹{scannedProductResult.sellingPrice.toFixed(2)}</span></p>
                      <p>Expiry: <span className="text-white font-mono">{scannedProductResult.expiryDate || "N/A"}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal({ type: "product", action: "edit", data: scannedProductResult })}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Product</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("purchase");
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Supplier Purchases</span>
                    </button>
                  </div>
                </div>
              )}

              {productScanError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{productScanError}</span>
                  <button
                    onClick={() => {
                      setActiveModal({ 
                        type: "product", 
                        action: "add"
                      });
                    }}
                    className="ml-auto text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold py-1 px-2.5 rounded transition-all"
                  >
                    Add Product
                  </button>
                </div>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter inventory by name, brand, or barcode ID..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 pl-9 text-xs focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl p-2 focus:outline-none shrink-0"
              >
                <option value="all">All stock categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Product Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono">
                    <th className="py-3 px-4">Brand & Name</th>
                    <th className="py-3 px-4">Barcode / QR</th>
                    <th className="py-3 px-4">Stock Qty</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4">Category GST</th>
                    <th className="py-3 px-4 text-center">Desk Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {products
                    .filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            p.barcode.includes(searchQuery) || 
                                            p.brand.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
                      return matchesSearch && matchesCategory;
                    })
                    .map(p => {
                      const catName = categories.find(c => c.id === p.categoryId)?.name || "Other";
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/30 text-slate-300">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-200">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.brand} • <span className="text-emerald-500 font-semibold">{catName}</span></p>
                          </td>
                          <td className="py-3 px-4 font-mono">{p.barcode} <span className="text-[10px] text-slate-500">({p.qrCode})</span></td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                              p.stockQty <= 0 
                                ? "bg-rose-500/10 text-rose-400" 
                                : p.stockQty <= p.lowStockThreshold 
                                  ? "bg-amber-500/10 text-amber-400" 
                                  : "bg-slate-800 text-slate-300"
                            }`}>
                              {p.stockQty} (Min: {p.lowStockThreshold})
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">₹{p.purchasePrice.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-100">₹{p.sellingPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono">{p.gstRate}%</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Option */}
                              <button
                                onClick={() => setActiveModal({ type: "product", action: "edit", data: p })}
                                className="p-1.5 hover:bg-slate-800 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Option */}
                              <button
                                onClick={() => handleDeleteEntity("products", p.id)}
                                className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WAREHOUSE STOCK PANEL */}
        {activeTab === "stock" && (
          <div className="space-y-6">
            {/* Real-time Logistics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Aggregated Stock Items</p>
                  <p className="text-2xl font-bold font-mono text-white mt-0.5">
                    {products.reduce((acc, p) => acc + p.stockQty, 0)}
                  </p>
                  <p className="text-[10px] text-slate-400">Units on shelves</p>
                </div>
              </div>

              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase font-display">Active SKU Catalog</p>
                  <p className="text-2xl font-bold font-mono text-white mt-0.5">{products.length}</p>
                  <p className="text-[10px] text-slate-400">Unique product lines</p>
                </div>
              </div>

              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase font-display">Critical Low Stock</p>
                  <p className="text-2xl font-bold font-mono text-rose-400 mt-0.5">
                    {products.filter(p => p.stockQty <= p.lowStockThreshold).length}
                  </p>
                  <p className="text-[10px] text-slate-400">Requires restock</p>
                </div>
              </div>

              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase">Inventory Value</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    ₹{products.reduce((acc, p) => acc + (p.stockQty * p.purchasePrice), 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400">At corporate cost price</p>
                </div>
              </div>
            </div>

            {/* Main Warehouse stock management sheet */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Warehouse Logistics Directory</h3>
                  <p className="text-xs text-slate-400">Inspect real-time stock levels, warning limits, wholesale barcodes, and track supply levels.</p>
                </div>
                <button
                  onClick={() => setActiveTab("purchase")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Purchase Order</span>
                </button>
              </div>

              {/* Warehouse Search/Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, brand, or barcode ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 pl-9 text-xs focus:outline-none"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs rounded-xl p-2 focus:outline-none shrink-0"
                >
                  <option value="all">All stock categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Warehouse List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-mono">
                      <th className="py-3 px-4">SKU / Item Brand & Name</th>
                      <th className="py-3 px-4">Barcode / Serial</th>
                      <th className="py-3 px-4">In-Stock Quantity</th>
                      <th className="py-3 px-4">Replenish Point</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {products
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              p.barcode.includes(searchQuery) || 
                                              p.brand.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
                        return matchesSearch && matchesCategory;
                      })
                      .map(p => {
                        const isLow = p.stockQty <= p.lowStockThreshold;
                        const isOut = p.stockQty === 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/30 text-slate-300">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-200">{p.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{p.brand} | {categories.find(c => c.id === p.categoryId)?.name || "General"}</p>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold">{p.barcode}</td>
                            <td className="py-3 px-4">
                              <span className={`font-mono font-bold text-sm ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-400'}`}>
                                {p.stockQty} units
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">{p.lowStockThreshold} units</td>
                            <td className="py-3 px-4">
                              {isOut ? (
                                <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">OUT OF STOCK</span>
                              ) : isLow ? (
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase animate-pulse">LOW STOCK</span>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">ADEQUATE</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setActiveTab("purchase");
                                }}
                                className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                              >
                                Restock Item
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES MANAGEMENT PANEL */}
        {activeTab === "categories" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Stock Categories</h3>
                <p className="text-xs text-slate-400">Classify product inventories for systematic lanes and custom billing tax policies.</p>
              </div>
              <button
                onClick={() => setActiveModal({ type: "category", action: "add" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => {
                const associatedCount = products.filter(p => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex justify-between items-center hover:border-emerald-500/30 transition-all">
                    <div>
                      <p className="font-bold text-white">{c.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{associatedCount} Products associated</p>
                    </div>
                    <div className="flex gap-1.5">
                      {/* Edit Option */}
                      <button
                        onClick={() => setActiveModal({ type: "category", action: "edit", data: c })}
                        className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Option */}
                      <button
                        onClick={() => handleDeleteEntity("categories", c.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUPPLIERS MANAGEMENT PANEL */}
        {activeTab === "suppliers" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">B2B Suppliers Desk</h3>
                <p className="text-xs text-slate-400">Coordinate and verify supplier credentials, GST registration keys, and contact details.</p>
              </div>
              <button
                onClick={() => setActiveModal({ type: "supplier", action: "add" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Supplier</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map(s => {
                const productCount = products.filter(p => p.supplierId === s.id).length;
                return (
                  <div key={s.id} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-white">{s.name}</p>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">GSTIN: {s.gstNo}</span>
                      </div>
                      <p className="text-xs text-slate-400">Phone: {s.phone} | Email: {s.email}</p>
                      <p className="text-xs text-slate-500">Address: {s.address}</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/60 text-xs">
                      <span className="text-emerald-500 font-semibold">{productCount} active products supplied</span>
                      <div className="flex gap-2">
                        {/* Edit Option */}
                        <button
                          onClick={() => setActiveModal({ type: "supplier", action: "edit", data: s })}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {/* Delete Option */}
                        <button
                          onClick={() => handleDeleteEntity("suppliers", s.id)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REGISTERED CLIENTS PANEL */}
        {activeTab === "customers" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Loyalty Customer Directory</h3>
                <p className="text-xs text-slate-400">Manage store VIPs and customer tiers to credit automatically calculated discount rules.</p>
              </div>
              <button
                onClick={() => setActiveModal({ type: "customer", action: "add" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Client Tier</th>
                    <th className="py-3 px-4 font-mono">Accumulated Points</th>
                    <th className="py-3 px-4 text-center font-mono">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/30 text-slate-300">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.email}</p>
                        {c.address && (
                          <p className="text-[10px] text-slate-400 italic font-sans mt-0.5">
                            📍 {c.address}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{c.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] ${
                          c.type === "VIP" 
                            ? "bg-purple-500/10 text-purple-400" 
                            : c.type === "Premium" 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : c.type === "Wholesale"
                                ? "bg-cyan-500/10 text-cyan-400"
                                : c.type === "Premier"
                                  ? "bg-indigo-500/10 text-indigo-400"
                                  : "bg-slate-800 text-slate-400"
                        }`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-white">{c.loyaltyPoints} points</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Option */}
                          <button
                            onClick={() => setActiveModal({ type: "customer", action: "edit", data: c })}
                            className="p-1.5 hover:bg-slate-800 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Option */}
                          <button
                            onClick={() => handleDeleteEntity("customers", c.id)}
                            className="p-1.5 hover:bg-slate-800 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVOICES HISTORY & BILLS LIST PANEL */}
        {activeTab === "bills" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Lanes Invoices Repository</h3>
                <p className="text-xs text-slate-400">Review corporate thermal invoice receipts, tax metrics, and print duplicates.</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search generated invoices by Invoice #, client name, or cashier..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 pl-9 text-xs focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Bill Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cashier Desk</th>
                    <th className="py-3 px-4 font-mono">Grand Total</th>
                    <th className="py-3 px-4 text-center">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {bills
                    .filter(b => {
                      const lowerQuery = searchQuery.toLowerCase();
                      return b.billNo.toLowerCase().includes(lowerQuery) || 
                             b.customerName?.toLowerCase().includes(lowerQuery) || 
                             b.cashierName.toLowerCase().includes(lowerQuery);
                    })
                    .map(b => (
                      <tr key={b.id} className="hover:bg-slate-900/30 text-slate-300">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{b.billNo}</td>
                        <td className="py-3 px-4 font-mono">{new Date(b.date).toLocaleString()}</td>
                        <td className="py-3 px-4">{b.customerName || "Walk-In Client"}</td>
                        <td className="py-3 px-4">{b.cashierName}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-white">₹{b.grandTotal.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveModal({ type: "bill_detail", action: "view", data: b })}
                              className="px-2 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded font-bold cursor-pointer"
                            >
                              Receipt View
                            </button>
                            
                            {/* Delete Option for Invoice - Admin ONLY */}
                            {currentUser.role === "Admin" && (
                              <button
                                onClick={() => handleDeleteEntity("bills", b.id)}
                                className="p-1 hover:bg-rose-600 hover:text-white text-rose-400 rounded cursor-pointer"
                                title="Void/Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF REGISTRATIONS PANEL (Admin Only) */}
        {activeTab === "users" && (
          <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Desk Personnel Directory</h3>
                <p className="text-xs text-slate-400">Add, edit, or delete cashier/manager accounts. Setup credentials safely.</p>
              </div>
              <button
                onClick={() => setActiveModal({ type: "user", action: "add" })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register Staff</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => (
                <div key={u.id} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{u.fullname}</p>
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">{u.role}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Email: {u.email} | Phone: {u.phone}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Password: {u.password}</p>
                  </div>

                  <div className="flex gap-2">
                    {/* Edit Option */}
                    <button
                      onClick={() => setActiveModal({ type: "user", action: "edit", data: u })}
                      className="p-2 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Option */}
                    {/* Admin should NOT be allowed to delete themselves to avoid lockout */}
                    {u.id !== currentUser.id ? (
                      <button
                        onClick={() => handleDeleteEntity("users", u.id)}
                        className="p-2 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600 bg-slate-900/50 p-1.5 rounded cursor-not-allowed">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CORPORATE STORE & PREMIUM VISUAL SETTINGS (Admin Only) */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Profile Header Card & Chat Settings Preview */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Slate-style User Profile Card */}
              <div className={`p-6 rounded-2xl border ${themeStyles.panelClass} overflow-hidden relative`}>
                {/* Background Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none"></div>
                
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Big Initials Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-display font-black text-2xl flex items-center justify-center shadow-lg border-2 border-slate-700/50">
                      {currentUser.fullname.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Active Online Indicator */}
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-white">{currentUser.fullname}</h3>
                    <p className="text-[11px] font-mono text-blue-400 mt-0.5">{currentUser.email}</p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Role: {currentUser.role}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800/60 pt-4 space-y-3 text-[11px] text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Account status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Workspace host</span>
                    <span className="font-mono text-slate-400">Local DB Session</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Security key</span>
                    <span className="font-mono text-slate-400">SHA-256 (Locked)</span>
                  </div>
                </div>
              </div>

              {/* Chat settings preview */}
              <div className={`p-6 rounded-2xl border ${themeStyles.panelClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Live Chat Preview</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">Appearance</span>
                </div>

                {/* Message preview block */}
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/50 font-sans">
                  <div className="flex gap-2 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">S</div>
                    <div className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-md">
                      <p className="font-semibold text-[10px] text-emerald-400">{currentUser.fullname}</p>
                      <p className={`${fontSizeClass} ${fontFamilyClass} mt-0.5 leading-relaxed`}>
                        Selected theme: <span className="font-mono text-blue-300">"{settings.theme || "dark"}"</span>. Font family is <span className="font-mono text-blue-300">"{settings.fontFamily || "sans"}"</span>.
                      </p>
                      <span className="text-[8px] text-slate-500 block text-right mt-1">09:41 AM</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start justify-end">
                    <div className="bg-blue-600/90 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-md">
                      <p className={`${fontSizeClass} ${fontFamilyClass} leading-relaxed`}>
                        This looks incredibly clean and modern! Absolute perfection. 🚀
                      </p>
                      <span className="text-[8px] text-blue-200 block text-right mt-1">09:42 AM</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">M</div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  The billing layouts, invoice logs, sidebars, and tables dynamically morph according to this visual preset!
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: Settings Sections (Appearance & Corporate Details) */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* APPEARANCE CUSTOMIZER (Modern Slate Style) */}
              <div className={`p-6 rounded-2xl border ${themeStyles.panelClass} space-y-6`}>
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">Appearance Settings</h3>
                    <p className="text-xs text-slate-400">Personalize themes, custom displays, text size scaling, and element curvatures.</p>
                  </div>
                  
                  {/* Save Status Indicator */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-medium">
                    {settingsSavingStatus === "Saving..." && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-400 font-mono">Syncing...</span>
                      </>
                    )}
                    {settingsSavingStatus === "Saved" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 font-mono">Synced</span>
                      </>
                    )}
                    {settingsSavingStatus === "Error saving" && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="text-rose-400 font-mono">Sync Error</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Theme Selector Grid */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Theme Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    {/* Classic Slate Theme */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "telegram")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "telegram"
                          ? "bg-blue-600/10 border-blue-500 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#2b5278] border border-blue-400 flex items-center justify-center text-white">
                        {settings.theme === "telegram" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Teal Slate</span>
                    </button>

                    {/* Midnight Black */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "midnight")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "midnight"
                          ? "bg-cyan-500/10 border-cyan-500 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-black border border-cyan-500 flex items-center justify-center text-cyan-400">
                        {settings.theme === "midnight" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Midnight Neon</span>
                    </button>

                    {/* Emerald Forest */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "emerald")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "emerald"
                          ? "bg-emerald-600/10 border-emerald-500 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#05130d] border border-emerald-500 flex items-center justify-center text-emerald-400">
                        {settings.theme === "emerald" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Emerald Moss</span>
                    </button>

                    {/* Golden Amber */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "amber")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "amber"
                          ? "bg-amber-600/10 border-amber-500 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#140c04] border border-amber-500 flex items-center justify-center text-amber-400">
                        {settings.theme === "amber" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Golden Amber</span>
                    </button>

                    {/* Retro Vaporwave */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "retro")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "retro"
                          ? "bg-pink-600/10 border-pink-500 text-white"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#12072b] border border-pink-500 flex items-center justify-center text-pink-400">
                        {settings.theme === "retro" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Retro Cyber</span>
                    </button>

                    {/* Light Day */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "light")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "light"
                          ? "bg-slate-100 border-slate-400 text-slate-800 shadow-inner"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700">
                        {settings.theme === "light" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Light Day</span>
                    </button>

                    {/* Slate Dark */}
                    <button
                      onClick={() => handleAutoSaveSettings("theme", "dark")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center cursor-pointer ${
                        settings.theme === "dark" || !settings.theme
                          ? "bg-slate-800/60 border-slate-500 text-white shadow-inner"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-600 flex items-center justify-center text-slate-300">
                        {(settings.theme === "dark" || !settings.theme) && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-semibold">Slate Dark</span>
                    </button>
                    
                  </div>
                </div>

                {/* Font Family Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Font Family</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    <button
                      onClick={() => handleAutoSaveSettings("fontFamily", "sans")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.fontFamily === "sans" || !settings.fontFamily
                          ? "bg-blue-600/10 border-blue-500 text-white font-sans"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 font-sans"
                      }`}
                    >
                      <p className="text-sm font-bold">Inter</p>
                      <span className="text-[9px] text-slate-500">Corporate Sans</span>
                    </button>

                    <button
                      onClick={() => handleAutoSaveSettings("fontFamily", "display")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.fontFamily === "display"
                          ? "bg-blue-600/10 border-blue-500 text-white font-display"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 font-display"
                      }`}
                    >
                      <p className="text-sm font-bold">Outfit</p>
                      <span className="text-[9px] text-slate-500">Display Bold</span>
                    </button>

                    <button
                      onClick={() => handleAutoSaveSettings("fontFamily", "mono")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.fontFamily === "mono"
                          ? "bg-blue-600/10 border-blue-500 text-white font-mono"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 font-mono"
                      }`}
                    >
                      <p className="text-sm font-bold">JetBrains</p>
                      <span className="text-[9px] text-slate-500">Tech Mono</span>
                    </button>

                    <button
                      onClick={() => handleAutoSaveSettings("fontFamily", "serif")}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        settings.fontFamily === "serif"
                          ? "bg-blue-600/10 border-blue-500 text-white font-serif"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 font-serif"
                      }`}
                    >
                      <p className="text-sm font-bold font-serif">Georgia</p>
                      <span className="text-[9px] text-slate-500">Classic Serif</span>
                    </button>

                  </div>
                </div>

                {/* Font Size Selector */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <span>Text Size Scaling</span>
                    <span className="text-blue-400 lowercase font-sans font-bold capitalize">
                      {settings.fontSize || "medium"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["small", "medium", "large", "xlarge"].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handleAutoSaveSettings("fontSize", sz)}
                        className={`py-2 px-3 rounded-lg border text-[11px] font-medium capitalize transition-all cursor-pointer ${
                          (settings.fontSize === sz || (!settings.fontSize && sz === "medium"))
                            ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Roundness Selector */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <span>Corner Roundness</span>
                    <span className="text-blue-400 font-sans font-bold capitalize">
                      {settings.borderRadius || "large"}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {["none", "small", "medium", "large", "full"].map((rd) => (
                      <button
                        key={rd}
                        onClick={() => handleAutoSaveSettings("borderRadius", rd)}
                        className={`py-2 px-2 rounded-lg border text-[10px] font-medium capitalize transition-all cursor-pointer ${
                          (settings.borderRadius === rd || (!settings.borderRadius && rd === "large"))
                            ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        {rd}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* CORPORATE DETAILS SETTINGS CARD */}
              <div className={`p-6 rounded-2xl border ${themeStyles.panelClass} space-y-6`}>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Supermarket Corporate Credentials</h3>
                  <p className="text-xs text-slate-400">Update localized company settings for billing, receipt footers, and official invoice records.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Supermarket Trade Name</label>
                    <input
                      type="text"
                      name="storeName"
                      required
                      defaultValue={settings.storeName}
                      onChange={(e) => handleAutoSaveSettings("storeName", e.target.value)}
                      placeholder="e.g. SK Supermarket"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Official GST Registration ID</label>
                    <input
                      type="text"
                      name="gstNumber"
                      required
                      defaultValue={settings.gstNumber}
                      onChange={(e) => handleAutoSaveSettings("gstNumber", e.target.value)}
                      placeholder="e.g. 33AAAAA1111A1Z1"
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Official Business Address</label>
                    <textarea
                      name="storeAddress"
                      required
                      rows={3}
                      defaultValue={settings.storeAddress}
                      onChange={(e) => handleAutoSaveSettings("storeAddress", e.target.value)}
                      placeholder="Complete physical address for receipts..."
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MY ACCOUNT PROFILE PANEL */}
        {activeTab === "my_account" && (
          <MyAccountSection 
            currentUser={currentUser} 
            logs={logs} 
            onUpdateSuccess={fetchDB} 
          />
        )}

        {/* SUPPLIER PURCHASES RESTOCK PANEL */}
        {activeTab === "purchase" && (
          <PurchasesSection 
            products={products} 
            suppliers={suppliers} 
            purchases={dbState.purchases || []} 
            currentUser={currentUser}
            onPurchaseSuccess={fetchDB}
            handleDeleteEntity={handleDeleteEntity}
          />
        )}

      </main>

      {/* GLOBAL MODALS POPUP COMPONENT (ADD, EDIT, RECEIPT) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-white capitalize">
                  {activeModal.action} {activeModal.type} record
                </h4>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
                >
                  Close
                </button>
              </div>

              <div className="p-6 max-h-[500px] overflow-y-auto text-xs space-y-4">
                
                {/* BILL DETAIL / THERMAL RECEIPT VIEW */}
                {activeModal.type === "bill_detail" && (
                  <div className="bg-white text-slate-900 p-6 rounded-lg font-mono leading-relaxed max-w-sm mx-auto shadow-inner border border-slate-200">
                    <div className="text-center space-y-1">
                      <p className="font-bold text-sm">{settings.storeName}</p>
                      <p className="text-[10px] text-slate-500">{settings.storeAddress}</p>
                      <p className="text-[10px] font-bold">GSTIN: {settings.gstNumber}</p>
                      <p className="text-slate-400 text-[10px]">--------------------------------</p>
                    </div>

                    <div className="space-y-0.5 text-[10px] mt-2">
                      <p><strong>INVOICE:</strong> {activeModal.data.billNo}</p>
                      <p><strong>DATE:</strong> {new Date(activeModal.data.date).toLocaleString()}</p>
                      <p><strong>CASHIER:</strong> {activeModal.data.cashierName}</p>
                      <p><strong>CLIENT:</strong> {activeModal.data.customerName || "Walk-In Customer"}</p>
                      <p className="text-slate-400">--------------------------------</p>
                    </div>

                    <div className="text-[10px] space-y-1.5 my-3">
                      <div className="grid grid-cols-12 font-bold border-b border-slate-300 pb-1.5">
                        <span className="col-span-6">Item Description</span>
                        <span className="col-span-2 text-center">Qty</span>
                        <span className="col-span-4 text-right">Price</span>
                      </div>
                      {activeModal.data.items.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12">
                          <span className="col-span-6 truncate">{item.name}</span>
                          <span className="col-span-2 text-center">{item.qty}</span>
                          <span className="col-span-4 text-right">₹{item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      <p className="text-slate-400">--------------------------------</p>
                    </div>

                    <div className="text-[10px] space-y-1 text-right">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span>₹{activeModal.data.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lanes SGST+CGST:</span>
                        <span>₹{activeModal.data.totalGst.toFixed(2)}</span>
                      </div>
                      {activeModal.data.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Loyalty Discount:</span>
                          <span>-₹{activeModal.data.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-extrabold text-xs pt-1.5 border-t border-slate-300">
                        <span>GRAND TOTAL:</span>
                        <span>₹{activeModal.data.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-[10px] mt-4 pt-3 border-t border-dashed border-slate-300 text-center space-y-1">
                      <p className="font-bold">Payment Method: {activeModal.data.paymentMode}</p>
                      {activeModal.data.paymentMode === "Cash" && (
                        <>
                          <p>Cash Tendered: ₹{activeModal.data.receivedAmount.toFixed(2)}</p>
                          <p>Drawer Change: ₹{activeModal.data.changeAmount.toFixed(2)}</p>
                        </>
                      )}
                      <p className="text-[9px] text-slate-500 mt-2 font-sans italic">Thank you for shopping with us!</p>
                    </div>

                    {/* Window Native Print Trigger */}
                    <button
                      onClick={() => window.print()}
                      className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs py-2 rounded-lg cursor-pointer"
                    >
                      Print Receipt Duplicate
                    </button>
                  </div>
                )}

                {/* PRODUCT MASTER CRUD FORM (EDIT / ADD OPTION) */}
                {activeModal.type === "product" && (
                  <form onSubmit={handleSaveEntity} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Product Name</label>
                        <input
                          type="text"
                          name="name"
                          required
                          defaultValue={activeModal.data?.name || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Brand</label>
                        <input
                          type="text"
                          name="brand"
                          required
                          defaultValue={activeModal.data?.brand || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between">
                          <span>Barcode ID</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProductBarcodeCameraActive(!isProductBarcodeCameraActive);
                              setIsProductQrCameraActive(false);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isProductBarcodeCameraActive ? "bg-rose-600 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            <Camera className="w-2.5 h-2.5" />
                            <span>{isProductBarcodeCameraActive ? "Stop" : "Scan Camera"}</span>
                          </button>
                        </label>
                        <input
                          type="text"
                          name="barcode"
                          required
                          value={productBarcodeVal}
                          onChange={(e) => setProductBarcodeVal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                        />
                        {isProductBarcodeCameraActive && (
                          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-emerald-500/30 mt-1 shadow-inner">
                            <div id="product-barcode-camera-viewport" className="w-full h-full" />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-24 h-24 border border-dashed border-emerald-400 rounded-lg opacity-60 animate-pulse relative">
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/80 animate-[bounce_2s_infinite]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between">
                          <span>QR Code Key</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProductQrCameraActive(!isProductQrCameraActive);
                              setIsProductBarcodeCameraActive(false);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isProductQrCameraActive ? "bg-rose-600 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            <Camera className="w-2.5 h-2.5" />
                            <span>{isProductQrCameraActive ? "Stop" : "Scan Camera"}</span>
                          </button>
                        </label>
                        <input
                          type="text"
                          name="qrCode"
                          required
                          value={productQrCodeVal}
                          onChange={(e) => setProductQrCodeVal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                        />
                        {isProductQrCameraActive && (
                          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-emerald-500/30 mt-1 shadow-inner">
                            <div id="product-qr-camera-viewport" className="w-full h-full" />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-24 h-24 border border-dashed border-emerald-400 rounded-lg opacity-60 animate-pulse relative">
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/80 animate-[bounce_2s_infinite]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Stock Category</label>
                        <select
                          name="categoryId"
                          required
                          defaultValue={activeModal.data?.categoryId || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        >
                          <option value="" disabled>-- Choose Category --</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">B2B Supplier</label>
                        <select
                          name="supplierId"
                          required
                          defaultValue={activeModal.data?.supplierId || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        >
                          <option value="" disabled>-- Choose Supplier --</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Purchase Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="purchasePrice"
                          required
                          defaultValue={activeModal.data?.purchasePrice || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Selling Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="sellingPrice"
                          required
                          defaultValue={activeModal.data?.sellingPrice || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">GST Rate (%)</label>
                        <select
                          name="gstRate"
                          defaultValue={activeModal.data?.gstRate ?? 18}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        >
                          {[0, 5, 12, 18, 28].map(rate => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">In-stock Qty</label>
                        <input
                          type="number"
                          name="stockQty"
                          required
                          defaultValue={activeModal.data?.stockQty ?? ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Min Stock Limit</label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          required
                          defaultValue={activeModal.data?.lowStockThreshold ?? 10}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Expiry Date</label>
                        <input
                          type="date"
                          name="expiryDate"
                          required
                          defaultValue={activeModal.data?.expiryDate || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
                    >
                      Save Product Record
                    </button>
                  </form>
                )}

                {/* CATEGORIES MASTER CRUD FORM */}
                {activeModal.type === "category" && (
                  <form onSubmit={handleSaveEntity} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Category Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={activeModal.data?.name || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        placeholder="e.g. Dairy & Bakery"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
                    >
                      Save Category
                    </button>
                  </form>
                )}

                {/* SUPPLIER MASTER CRUD FORM */}
                {activeModal.type === "supplier" && (
                  <form onSubmit={handleSaveEntity} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Supplier Company Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={activeModal.data?.name || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Phone</label>
                        <input
                          type="text"
                          name="phone"
                          required
                          defaultValue={activeModal.data?.phone || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Email</label>
                        <input
                          type="email"
                          name="email"
                          required
                          defaultValue={activeModal.data?.email || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Company Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        defaultValue={activeModal.data?.address || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Company GSTIN Number</label>
                      <input
                        type="text"
                        name="gstNo"
                        required
                        defaultValue={activeModal.data?.gstNo || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
                    >
                      Save Supplier Record
                    </button>
                  </form>
                )}

                {/* CUSTOMERS MASTER CRUD FORM */}
                {activeModal.type === "customer" && (
                  <form onSubmit={handleSaveEntity} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Customer Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={activeModal.data?.name || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          required
                          defaultValue={activeModal.data?.phone || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Client Tier</label>
                        <select
                          name="type"
                          defaultValue={activeModal.data?.type || "Regular"}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        >
                          <option value="Regular">Regular (Standard)</option>
                          <option value="Wholesale">Wholesale (Bulk Rates)</option>
                          <option value="VIP">VIP (10% Off POS)</option>
                          <option value="Premier">Premier Member (Prestige)</option>
                          <option value="Premium">Premium (5% Off POS)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        defaultValue={activeModal.data?.email || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Customer Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        defaultValue={activeModal.data?.address || ""}
                        placeholder="e.g. 12, Gandhi Nagar, Chennai, Tamil Nadu"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
                    >
                      Save Customer Profile
                    </button>
                  </form>
                )}

                {/* STAFF USER MASTER CRUD FORM */}
                {activeModal.type === "user" && (
                  <form onSubmit={handleSaveEntity} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Employee Full Name</label>
                      <input
                        type="text"
                        name="fullname"
                        required
                        defaultValue={activeModal.data?.fullname || ""}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Internal Role</label>
                        <select
                          name="role"
                          defaultValue={activeModal.data?.role || "Cashier"}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        >
                          <option value="Cashier">Cashier (POS counter access)</option>
                          <option value="Manager">Manager (Inventory views)</option>
                          <option value="Admin">Admin (Full administrative clearance)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Login Password</label>
                        <input
                          type="text"
                          name="password"
                          required
                          defaultValue={activeModal.data?.password || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Official Email</label>
                        <input
                          type="email"
                          name="email"
                          required
                          defaultValue={activeModal.data?.email || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Mobile Phone</label>
                        <input
                          type="text"
                          name="phone"
                          required
                          defaultValue={activeModal.data?.phone || ""}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl cursor-pointer"
                    >
                      Save Staff Registration
                    </button>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-base text-white">Confirm Deletion</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you absolutely sure you want to delete this <span className="font-bold text-rose-400 capitalize">{deleteConfirm.type}</span> record? This action is permanent and cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeDeleteEntity(deleteConfirm.type, deleteConfirm.id)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs shadow-lg shadow-rose-600/15"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ==========================================
// MY ACCOUNT PROFILE SECTION
// ==========================================
interface MyAccountProps {
  currentUser: User;
  logs: Log[];
  onUpdateSuccess: () => void;
}

function MyAccountSection({ currentUser, logs, onUpdateSuccess }: MyAccountProps) {
  const [name, setName] = useState(currentUser.fullname);
  const [phone, setPhone] = useState(currentUser.phone || "N/A");
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState(currentUser.password || "admin");
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter logs for this specific user
  const myLogs = logs.filter(l => l.userId === currentUser.id || l.userEmail === currentUser.email);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage("");

    try {
      const res = await apiFetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: name,
          phone,
          email,
          password
        })
      });

      if (res.ok) {
        setMessage("Your account profile was updated successfully!");
        onUpdateSuccess();
      } else {
        setMessage("Failed to update profile settings.");
      }
    } catch (err) {
      setMessage("Network error: Unable to contact server.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
          <UserSquare2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-black text-xl text-white">My Account Profile</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage your operator credentials, lane roles, and session logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile edit card */}
        <div className="lg:col-span-7 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800/50">
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500/40 text-white font-black text-lg flex items-center justify-center shadow-lg">
              {currentUser.fullname.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm text-white">{currentUser.fullname}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold rounded-full uppercase tracking-wider">
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">ID: {currentUser.id}</span>
              </div>
            </div>
          </div>

          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">My Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Mobile</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Session Password / Key</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-all uppercase tracking-wider text-[10px]"
            >
              {isUpdating ? "Saving changes..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* User audit log history */}
        <div className="lg:col-span-5 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div>
            <h4 className="font-bold text-xs text-white">My Counter Sessions Activity Log</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time audit history of your logged actions</p>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {myLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-600 text-xs">
                No session logs recorded for this operator yet.
              </div>
            ) : (
              myLogs.map(l => (
                <div key={l.id} className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
                  <p className="text-slate-200 font-medium leading-relaxed">{l.action}</p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    {new Date(l.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUPPLIER PURCHASES (RESTOCKING INVENTORY)
// ==========================================
interface PurchasesProps {
  products: Product[];
  suppliers: Supplier[];
  purchases: any[];
  currentUser: User;
  onPurchaseSuccess: () => void;
  handleDeleteEntity: (type: string, id: string) => any;
}

function PurchasesSection({ 
  products, 
  suppliers, 
  purchases, 
  currentUser,
  onPurchaseSuccess,
  handleDeleteEntity 
}: PurchasesProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [qty, setQty] = useState(10);
  const [price, setPrice] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Play synthetic scan sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 120);
    } catch (e) {
      console.warn(e);
    }
  };

  // Pre-fill default price when product is selected
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setPrice(prod.purchasePrice);
    }
  };

  // Generate random Restock invoice details and simulate barcode trigger
  const handleSimulateBarcodeScan = () => {
    if (products.length === 0) return;
    const randomProd = products[Math.floor(Math.random() * products.length)];
    handleProductChange(randomProd.id);
    
    if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[Math.floor(Math.random() * suppliers.length)].id);
    }
    
    setQty(Math.floor(Math.random() * 80) + 20); // 20 - 100 units
    setInvoiceNo("PO-" + (Date.now() % 10000));
    playBeep();
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedSupplierId || qty <= 0 || price <= 0 || !invoiceNo) {
      setErrorMsg("Please provide all required purchase fields.");
      return;
    }

    setErrorMsg("");
    setIsSaving(true);

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    try {
      const res = await apiFetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          productName: selectedProduct?.name || "N/A",
          supplierId: selectedSupplierId,
          supplierName: selectedSupplier?.name || "N/A",
          qty,
          purchasePrice: price,
          invoiceNo
        })
      });

      if (res.ok) {
        setIsOpen(false);
        // Reset fields
        setSelectedProductId("");
        setSelectedSupplierId("");
        setQty(10);
        setPrice(0);
        setInvoiceNo("");
        onPurchaseSuccess();
        playBeep();
      } else {
        setErrorMsg("Failed to store the purchase order on the database.");
      }
    } catch (err) {
      setErrorMsg("Unable to communicate with purchases service.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-white">Supplier Purchases RESTOCK</h3>
            <p className="text-xs text-slate-400 mt-0.5">Log inbound supplies from B2B distributors to increment inventory levels</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOpen(true);
            if (products.length > 0) handleProductChange(products[0].id);
            if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id);
          }}
          className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Restock Supplies (New PO)</span>
        </button>
      </div>

      {/* PURCHASES LIST TABLE */}
      <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-slate-800/60">
          <h4 className="font-bold text-xs text-slate-200">Purchase Inbound Log Ledger</h4>
        </div>

        <div className="overflow-x-auto">
          {purchases.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No incoming supplier restocks logged yet. Click "Restock Supplies" above to import stocks.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-3.5 px-5">Invoice PO</th>
                  <th className="py-3.5 px-5">Supplier</th>
                  <th className="py-3.5 px-5">Product Details</th>
                  <th className="py-3.5 px-5 text-right">Unit cost</th>
                  <th className="py-3.5 px-5 text-center">QTY Supplied</th>
                  <th className="py-3.5 px-5 text-right">Total Cost</th>
                  <th className="py-3.5 px-5">Log Date</th>
                  <th className="py-3.5 px-5 text-center">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchases.map((p: any) => {
                  const totalCost = Number(p.qty) * Number(p.purchasePrice);
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/30 text-slate-300">
                      <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold">{p.invoiceNo}</td>
                      <td className="py-3.5 px-5 font-bold text-white">{p.supplierName}</td>
                      <td className="py-3.5 px-5">{p.productName}</td>
                      <td className="py-3.5 px-5 text-right font-mono">₹{Number(p.purchasePrice).toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-200 bg-slate-900/20">{p.qty} units</td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-400">₹{totalCost.toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono text-[10px]">
                        {new Date(p.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {currentUser.role === "Admin" ? (
                          <button
                            onClick={() => handleDeleteEntity("purchases", p.id)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-650 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Delete supply log and subtract product stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] bg-slate-900/60 text-slate-600 px-2 py-1 rounded border border-slate-800/40 cursor-not-allowed">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* NEW PURCHASE RESTOCK MODAL POPUP */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-white">Create Supplier Inbound (PO)</h4>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 text-xs">
              
              {errorMsg && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-center font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* BARCODE SCAN SIMULATOR OPTION FOR ADDING PURCHASE */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-[10px] text-emerald-400 uppercase tracking-wide">Supply Scanner Simulator</h5>
                  <p className="text-[9px] text-slate-500 mt-0.5">Quick restock: auto-assign supply barcodes with chimes</p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateBarcodeScan}
                  className="bg-slate-900 hover:bg-emerald-650 border border-slate-800 text-slate-200 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  ⚡ Simulate Scan
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Select product from stock</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.brand} - {p.name} (Barcode: {p.barcode})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Select Wholesale Supplier</label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white cursor-pointer focus:outline-none"
                >
                  <option value="">-- Choose distributor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Import Qty (units)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Purchase Price Per Unit (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0.01}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Inbound PO Invoice Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-1002"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl cursor-pointer uppercase transition-all tracking-wider text-[10px] shadow-lg mt-2"
              >
                {isSaving ? "Filing Supply Records..." : "Process Restock Supply (PO)"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
