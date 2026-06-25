import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Seed data based on initial supermarket database
const defaultDb = {
  users: [
    {
      id: "usr_admin",
      email: "admin@supermarket.com",
      fullname: "Rajesh Kumar (Admin)",
      phone: "9840123456",
      role: "Admin",
      profilePhoto: "",
      createdAt: "2026-06-23T12:54:24.785Z",
      activityLogs: ["Account initialized"],
      password: "admin"
    },
    {
      id: "usr_sudesh",
      email: "sudeshkumar2007sudesh@gmail.com",
      fullname: "Sudesh Kumar (Admin)",
      phone: "9840778899",
      role: "Admin",
      profilePhoto: "",
      createdAt: "2026-06-23T12:54:24.786Z",
      activityLogs: ["System Administrator initialized"],
      password: "admin"
    },
    {
      id: "usr_manager",
      email: "manager@supermarket.com",
      fullname: "Sriya Sharma (Manager)",
      phone: "9840654321",
      role: "Manager",
      profilePhoto: "",
      createdAt: "2026-06-23T12:54:24.786Z",
      activityLogs: ["Manager access seeded"],
      password: "admin"
    },
    {
      id: "usr_cashier",
      email: "cashier@supermarket.com",
      fullname: "Ganesh Pillai (Cashier)",
      phone: "9840223344",
      role: "Cashier",
      profilePhoto: "",
      createdAt: "2026-06-23T12:54:24.786Z",
      activityLogs: ["Cashier Terminal enabled"],
      password: "admin"
    }
  ],
  categories: [
    { id: "cat_groceries", name: "Groceries" },
    { id: "cat_beverages", name: "Beverages" },
    { id: "cat_dairy", name: "Dairy & Bakery" },
    { id: "cat_snacks", name: "Snacks & Branded" },
    { id: "cat_personal", name: "Personal Care" },
    { id: "cat_household", name: "Household" }
  ],
  suppliers: [
    {
      id: "sup_national",
      name: "National Distributors",
      phone: "044-24567890",
      email: "sales@nationaldist.com",
      address: "12, Industrial Estate, Guindy, Chennai",
      gstNo: "33AAACN2312D1ZX"
    },
    {
      id: "sup_fresh_farms",
      name: "Fresh Farms Co-op",
      phone: "9123456781",
      email: "orders@freshfarmsco.in",
      address: "Koyambedu Wholesale Market, Chennai",
      gstNo: "33AABCF9012J2ZY"
    },
    {
      id: "sup_united",
      name: "United FMCG Agency",
      "phone": "9841098765",
      "email": "unitedfmcg@gmail.com",
      "address": "77, Broadway Street, Parry's, Chennai",
      "gstNo": "33AAAFU4561M1ZD"
    }
  ],
  products: [
    {
      id: "prod_milk",
      barcode: "222222222222",
      qrCode: "PROD_MILK",
      name: "Aavin Green Magic Milk 500ml",
      categoryId: "cat_dairy",
      brand: "Aavin",
      supplierId: "sup_fresh_farms",
      purchasePrice: 20,
      sellingPrice: 24,
      gstRate: 0,
      expiryDate: "2026-06-25",
      stockQty: 4,
      lowStockThreshold: 10
    },
    {
      id: "prod_chips",
      barcode: "8901408130124",
      qrCode: "PROD_LAY_CHIPS",
      name: "Lay's Magic Masala 50g",
      categoryId: "cat_snacks",
      brand: "Lay's",
      supplierId: "sup_united",
      purchasePrice: 15,
      sellingPrice: 20,
      gstRate: 18,
      expiryDate: "2026-11-20",
      stockQty: 120,
      lowStockThreshold: 15
    },
    {
      id: "prod_coke",
      barcode: "5449000000996",
      qrCode: "PROD_COCA_COLA",
      name: "Coca Cola 2 Litre",
      categoryId: "cat_beverages",
      brand: "Coca Cola",
      supplierId: "sup_united",
      purchasePrice: 65,
      sellingPrice: 85,
      gstRate: 28,
      expiryDate: "2026-08-15",
      stockQty: 60,
      lowStockThreshold: 12
    },
    {
      id: "prod_soap",
      barcode: "8901030753517",
      qrCode: "PROD_DOVE_SOAP",
      name: "Dove Cream Bar Soap 100g",
      categoryId: "cat_personal",
      brand: "Dove",
      supplierId: "sup_national",
      purchasePrice: 48,
      sellingPrice: 62,
      gstRate: 18,
      expiryDate: "2028-03-10",
      stockQty: 8,
      lowStockThreshold: 15
    }
  ],
  customers: [
    {
      id: "cust_vip_ramesh",
      name: "Ramesh Sundaram",
      phone: "9840001122",
      email: "ramesh.sundar@gmail.com",
      type: "VIP",
      loyaltyPoints: 340,
      purchaseHistory: []
    },
    {
      id: "cust_prem_anita",
      name: "Anita Deshmukh",
      phone: "9940123544",
      email: "anita.d@yahoo.com",
      type: "Premium",
      loyaltyPoints: 120,
      purchaseHistory: []
    },
    {
      id: "cust_reg_subbu",
      name: "Subramanian Swamy",
      phone: "8754124567",
      email: "subbu.swamy@outlook.com",
      type: "Regular",
      loyaltyPoints: 35,
      purchaseHistory: []
    }
  ],
  purchases: [],
  bills: [],
  notifications: [
    {
      id: "alert_stock_prod_milk_1782219265004",
      type: "warning",
      title: "Low Stock Alert",
      message: "Product: \"Aavin Green Magic Milk 500ml\" has only 4 unit(s) remaining (threshold: 10).",
      date: "2026-06-23T12:54:25.004Z",
      read: false
    },
    {
      id: "alert_exp_prod_milk_1782219265004",
      type: "alert",
      title: "Near Expiry Warning",
      message: "Product: \"Aavin Green Magic Milk 500ml\" is expiring soon on 2026-06-25 (under 30 days left).",
      date: "2026-06-23T12:54:25.004Z",
      read: false
    },
    {
      id: "alert_stock_prod_soap_1782219265004",
      type: "warning",
      title: "Low Stock Alert",
      message: "Product: \"Dove Cream Bar Soap 100g\" has only 8 unit(s) remaining (threshold: 15).",
      date: "2026-06-23T12:54:25.004Z",
      read: false
    },
    {
      id: "notif_init",
      type: "info",
      title: "Welcome to Supermarket POS",
      message: "System loaded successfully. Default administrator account seeded.",
      date: "2026-06-23T12:54:24.786Z",
      read: false
    }
  ],
  logs: [
    {
      id: "log_1782220923900_vsi70",
      userId: "usr_sudesh",
      userEmail: "sudeshkumar2007sudesh@gmail.com",
      fullname: "Sudesh Kumar (Admin)",
      role: "Admin",
      action: "Logged in successfully as fixed Admin",
      timestamp: "2026-06-23T13:22:03.900Z"
    },
    {
      id: "log_seed",
      userId: "usr_admin",
      userEmail: "admin@supermarket.com",
      fullname: "Rajesh Kumar (Admin)",
      role: "Admin",
      action: "System Database Seeded with default roles and items",
      timestamp: "2026-06-23T12:54:24.786Z"
    }
  ],
  settings: {
    storeName: "SK Smart SuperMarket",
    storeAddress: "45/1, G.S.T. Road, Guindy, Chennai, Tamil Nadu - 600032",
    gstNumber: "33AAAAA1111A1Z1",
    logoUrl: "",
    theme: "light",
    language: "en"
  }
};

// Ensure db.json file exists and is populated
function loadDB(): typeof defaultDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
  } catch (error) {
    console.error("Error reading DB file, using fallback state:", error);
    return defaultDb;
  }
}

function saveDB(data: typeof defaultDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving DB file:", error);
  }
}

// REST API Endpoints
app.get("/api/db", (req, res) => {
  const db = loadDB();
  res.json(db);
});

// LOGIN Endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  
  // Find user by email and password
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (user) {
    // Log the successful login
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    const newLog = {
      id: logId,
      userId: user.id,
      userEmail: user.email,
      fullname: user.fullname,
      role: user.role,
      action: `Logged in successfully as ${user.role}`,
      timestamp: new Date().toISOString()
    };
    db.logs.unshift(newLog);
    saveDB(db);

    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid email or password." });
  }
});

// GET endpoints for all models
app.get("/api/products", (req, res) => {
  res.json(loadDB().products);
});
app.get("/api/categories", (req, res) => {
  res.json(loadDB().categories);
});
app.get("/api/suppliers", (req, res) => {
  res.json(loadDB().suppliers);
});
app.get("/api/customers", (req, res) => {
  res.json(loadDB().customers);
});
app.get("/api/users", (req, res) => {
  res.json(loadDB().users);
});
app.get("/api/bills", (req, res) => {
  res.json(loadDB().bills);
});
app.get("/api/logs", (req, res) => {
  res.json(loadDB().logs);
});
app.get("/api/settings", (req, res) => {
  res.json(loadDB().settings);
});
app.get("/api/notifications", (req, res) => {
  res.json(loadDB().notifications);
});

// PUT Settings
app.put("/api/settings", (req, res) => {
  const db = loadDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// CRUD Operations: PRODUCTS
app.post("/api/products", (req, res) => {
  const db = loadDB();
  const newProduct = {
    id: "prod_" + Date.now(),
    ...req.body
  };
  db.products.push(newProduct);

  // Auto-generate low stock notification if seeded below limit
  if (Number(newProduct.stockQty) <= Number(newProduct.lowStockThreshold)) {
    db.notifications.unshift({
      id: "alert_stock_" + newProduct.id + "_" + Date.now(),
      type: "warning",
      title: "Low Stock Alert",
      message: `Product: "${newProduct.name}" has only ${newProduct.stockQty} unit(s) remaining (threshold: ${newProduct.lowStockThreshold}).`,
      date: new Date().toISOString(),
      read: false
    });
  }

  saveDB(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);
  if (index !== -1) {
    db.products[index] = { ...db.products[index], ...req.body };
    
    // Check if stock status triggers low stock
    const prod = db.products[index];
    if (Number(prod.stockQty) <= Number(prod.lowStockThreshold)) {
      const alreadyNotified = db.notifications.some(
        n => n.id.startsWith("alert_stock_" + prod.id) && !n.read
      );
      if (!alreadyNotified) {
        db.notifications.unshift({
          id: "alert_stock_" + prod.id + "_" + Date.now(),
          type: "warning",
          title: "Low Stock Alert",
          message: `Product: "${prod.name}" has only ${prod.stockQty} unit(s) remaining (threshold: ${prod.lowStockThreshold}).`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }
    
    saveDB(db);
    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.products = db.products.filter((p) => p.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Product deleted successfully" });
});

// CRUD Operations: CATEGORIES
app.post("/api/categories", (req, res) => {
  const db = loadDB();
  const newCat = {
    id: "cat_" + Date.now(),
    ...req.body
  };
  db.categories.push(newCat);
  saveDB(db);
  res.status(201).json(newCat);
});

app.put("/api/categories/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...req.body };
    saveDB(db);
    res.json(db.categories[index]);
  } else {
    res.status(404).json({ error: "Category not found" });
  }
});

app.delete("/api/categories/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.categories = db.categories.filter((c) => c.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Category deleted" });
});

// CRUD Operations: SUPPLIERS
app.post("/api/suppliers", (req, res) => {
  const db = loadDB();
  const newSup = {
    id: "sup_" + Date.now(),
    ...req.body
  };
  db.suppliers.push(newSup);
  saveDB(db);
  res.status(201).json(newSup);
});

app.put("/api/suppliers/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.suppliers.findIndex((s) => s.id === id);
  if (index !== -1) {
    db.suppliers[index] = { ...db.suppliers[index], ...req.body };
    saveDB(db);
    res.json(db.suppliers[index]);
  } else {
    res.status(404).json({ error: "Supplier not found" });
  }
});

app.delete("/api/suppliers/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Supplier deleted" });
});

// CRUD Operations: CUSTOMERS
app.post("/api/customers", (req, res) => {
  const db = loadDB();
  const newCust = {
    id: "cust_" + Date.now(),
    loyaltyPoints: 0,
    purchaseHistory: [],
    ...req.body
  };
  db.customers.push(newCust);
  saveDB(db);
  res.status(201).json(newCust);
});

app.put("/api/customers/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.customers[index] = { ...db.customers[index], ...req.body };
    saveDB(db);
    res.json(db.customers[index]);
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.customers = db.customers.filter((c) => c.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Customer deleted" });
});

// CRUD Operations: PURCHASES
app.post("/api/purchases", (req, res) => {
  const db = loadDB();
  const newPurchase = {
    id: "purch_" + Date.now(),
    date: new Date().toISOString(),
    ...req.body
  };
  db.purchases = db.purchases || [];
  db.purchases.unshift(newPurchase);

  // Automatically update stock quantity!
  const prodIndex = db.products.findIndex(p => p.id === newPurchase.productId);
  if (prodIndex !== -1) {
    db.products[prodIndex].stockQty = Number(db.products[prodIndex].stockQty) + Number(newPurchase.qty);
  }

  saveDB(db);
  res.status(201).json(newPurchase);
});

app.delete("/api/purchases/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const pIndex = db.purchases.findIndex(p => p.id === id);
  if (pIndex !== -1) {
    const purchase = db.purchases[pIndex];
    const prodIndex = db.products.findIndex(p => p.id === purchase.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].stockQty = Math.max(0, Number(db.products[prodIndex].stockQty) - Number(purchase.qty));
    }
    db.purchases.splice(pIndex, 1);
    saveDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Purchase not found" });
  }
});

// CRUD Operations: USERS / STAFF
app.post("/api/users", (req, res) => {
  const db = loadDB();
  const newUser = {
    id: "usr_" + Date.now(),
    createdAt: new Date().toISOString(),
    activityLogs: ["Account registered"],
    ...req.body
  };
  db.users.push(newUser);
  saveDB(db);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    saveDB(db);
    res.json(db.users[index]);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.users = db.users.filter((u) => u.id !== id);
  saveDB(db);
  res.json({ success: true, message: "User deleted" });
});

// CRUD Operations: BILLS / checkout
app.post("/api/bills", (req, res) => {
  const db = loadDB();
  const { billData, logs: checkoutLogs } = req.body;
  
  const newBill = {
    id: "bill_" + Date.now(),
    billNo: "INV-" + (db.bills.length + 1001),
    date: new Date().toISOString(),
    ...billData
  };

  db.bills.unshift(newBill);

  // Decrement Stock quantities of checked-out products
  newBill.items.forEach((item: any) => {
    const prodIndex = db.products.findIndex(p => p.id === item.productId || p.barcode === item.barcode);
    if (prodIndex !== -1) {
      db.products[prodIndex].stockQty = Math.max(0, db.products[prodIndex].stockQty - item.qty);
      
      // Notify if low stock threshold crossed
      const prod = db.products[prodIndex];
      if (prod.stockQty <= prod.lowStockThreshold) {
        db.notifications.unshift({
          id: "alert_stock_" + prod.id + "_" + Date.now(),
          type: "warning",
          title: "Low Stock Alert",
          message: `Product: "${prod.name}" has only ${prod.stockQty} unit(s) remaining (threshold: ${prod.lowStockThreshold}).`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }
  });

  // Credit Customer loyalty points
  if (newBill.customerId) {
    const custIndex = db.customers.findIndex(c => c.id === newBill.customerId);
    if (custIndex !== -1) {
      // 1 point per 100 Rupees spent
      const earned = Math.floor(newBill.grandTotal / 100);
      db.customers[custIndex].loyaltyPoints += earned;
      db.customers[custIndex].purchaseHistory = db.customers[custIndex].purchaseHistory || [];
      db.customers[custIndex].purchaseHistory.push(newBill.id);
    }
  }

  // Create audit activity log
  const logId = "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const auditLog = {
    id: logId,
    userId: newBill.cashierId || "system",
    userEmail: newBill.cashierEmail || "cashier@supermarket.com",
    fullname: newBill.cashierName || "System Cashier",
    role: "Cashier",
    action: `Created Invoice ${newBill.billNo} for total ₹${newBill.grandTotal.toFixed(2)}`,
    timestamp: new Date().toISOString()
  };
  db.logs.unshift(auditLog);

  saveDB(db);
  res.status(201).json(newBill);
});

app.delete("/api/bills/:id", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  db.bills = db.bills.filter((b) => b.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Invoice deleted successfully" });
});

// Notifications PUT Mark Read
app.put("/api/notifications/:id/read", (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    db.notifications[index].read = true;
    saveDB(db);
    res.json(db.notifications[index]);
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

// Serve UI Client
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
