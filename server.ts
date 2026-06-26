import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";


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

// Ensure db.json file exists and is populated with high-resilience memory fallback
let memoryDb: typeof defaultDb | null = null;

// --- MONGODB INTEGRATION & SCHEMAS ---
let isMongoConnected = false;

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true },
  profilePhoto: { type: String, default: "" },
  createdAt: { type: String },
  activityLogs: [{ type: String }],
  password: { type: String, required: true }
}, { strict: false });

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
}, { strict: false });

const supplierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  gstNo: { type: String }
}, { strict: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  barcode: { type: String },
  qrCode: { type: String },
  name: { type: String, required: true },
  categoryId: { type: String },
  brand: { type: String },
  supplierId: { type: String },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  gstRate: { type: Number },
  expiryDate: { type: String },
  stockQty: { type: Number },
  lowStockThreshold: { type: Number }
}, { strict: false });

const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  type: { type: String, default: "Regular" },
  loyaltyPoints: { type: Number, default: 0 },
  purchaseHistory: [{ type: String }]
}, { strict: false });

const purchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String },
  productName: { type: String },
  supplierId: { type: String },
  supplierName: { type: String },
  purchasePrice: { type: Number },
  qty: { type: Number },
  totalAmount: { type: Number },
  invoiceNo: { type: String },
  date: { type: String }
}, { strict: false });

const billSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  billNo: { type: String },
  date: { type: String },
  customerId: { type: String },
  customerName: { type: String },
  cashierId: { type: String },
  cashierName: { type: String },
  cashierEmail: { type: String },
  items: { type: Array, default: [] },
  subTotal: { type: Number },
  cgst: { type: Number },
  sgst: { type: Number },
  grandTotal: { type: Number },
  paymentMethod: { type: String },
  amountPaid: { type: Number },
  changeAmount: { type: Number }
}, { strict: false });

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String },
  title: { type: String },
  message: { type: String },
  date: { type: String },
  read: { type: Boolean, default: false }
}, { strict: false });

const logSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  userEmail: { type: String },
  fullname: { type: String },
  role: { type: String },
  action: { type: String },
  timestamp: { type: String }
}, { strict: false });

const settingsSchema = new mongoose.Schema({
  storeName: { type: String },
  storeAddress: { type: String },
  gstNumber: { type: String },
  logoUrl: { type: String },
  theme: { type: String },
  language: { type: String }
}, { strict: false });

const MongoModels = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Category: mongoose.models.Category || mongoose.model("Category", categorySchema),
  Supplier: mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema),
  Product: mongoose.models.Product || mongoose.model("Product", productSchema),
  Customer: mongoose.models.Customer || mongoose.model("Customer", customerSchema),
  Purchase: mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema),
  Bill: mongoose.models.Bill || mongoose.model("Bill", billSchema),
  Notification: mongoose.models.Notification || mongoose.model("Notification", notificationSchema),
  Log: mongoose.models.Log || mongoose.model("Log", logSchema),
  Settings: mongoose.models.Settings || mongoose.model("Settings", settingsSchema),
};

async function seedMongoIfNeeded() {
  try {
    const userCount = await MongoModels.User.countDocuments();
    if (userCount === 0) {
      console.log("MongoDB is empty. Seeding default database...");
      await MongoModels.User.insertMany(defaultDb.users);
      await MongoModels.Category.insertMany(defaultDb.categories);
      await MongoModels.Supplier.insertMany(defaultDb.suppliers);
      await MongoModels.Product.insertMany(defaultDb.products);
      await MongoModels.Customer.insertMany(defaultDb.customers);
      await MongoModels.Log.insertMany(defaultDb.logs);
      await MongoModels.Notification.insertMany(defaultDb.notifications);
      await MongoModels.Settings.create(defaultDb.settings);
      console.log("MongoDB successfully seeded!");
    }
  } catch (err) {
    console.error("Error seeding MongoDB:", err);
  }
}

// Establish Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  console.log("Connecting to MongoDB via MONGODB_URI...");
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(async () => {
    isMongoConnected = true;
    console.log("Successfully connected to MongoDB!");
    await seedMongoIfNeeded();
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed. Falling back to local JSON/Memory DB:", err.message);
    isMongoConnected = false;
  });
} else {
  console.log("No MONGODB_URI provided in environment. Storing database state locally in db.json / memory.");
}

function loadDB(): typeof defaultDb {
  if (memoryDb) {
    return memoryDb;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw);
      return memoryDb!;
    } else {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      } catch (writeErr) {
        console.error("Warning: DB_FILE write failed (possibly read-only filesystem). Falling back to dynamic in-memory storage:", writeErr);
      }
      memoryDb = JSON.parse(JSON.stringify(defaultDb)); // Deep copy
      return memoryDb!;
    }
  } catch (error) {
    console.error("Error reading DB file, using fallback in-memory state:", error);
    memoryDb = JSON.parse(JSON.stringify(defaultDb)); // Deep copy
    return memoryDb!;
  }
}

async function saveToMongo(data: typeof defaultDb) {
  if (!isMongoConnected) return;
  try {
    // Sync Users
    await Promise.all(data.users.map(async (u) => {
      await MongoModels.User.findOneAndUpdate({ id: u.id } as any, u, { upsert: true } as any);
    }));
    const userIds = data.users.map(u => u.id);
    await MongoModels.User.deleteMany({ id: { $nin: userIds } } as any);

    // Sync Categories
    await Promise.all(data.categories.map(async (c) => {
      await MongoModels.Category.findOneAndUpdate({ id: c.id } as any, c, { upsert: true } as any);
    }));
    const categoryIds = data.categories.map(c => c.id);
    await MongoModels.Category.deleteMany({ id: { $nin: categoryIds } } as any);

    // Sync Suppliers
    await Promise.all(data.suppliers.map(async (s) => {
      await MongoModels.Supplier.findOneAndUpdate({ id: s.id } as any, s, { upsert: true } as any);
    }));
    const supplierIds = data.suppliers.map(s => s.id);
    await MongoModels.Supplier.deleteMany({ id: { $nin: supplierIds } } as any);

    // Sync Products
    await Promise.all(data.products.map(async (p) => {
      await MongoModels.Product.findOneAndUpdate({ id: p.id } as any, p, { upsert: true } as any);
    }));
    const productIds = data.products.map(p => p.id);
    await MongoModels.Product.deleteMany({ id: { $nin: productIds } } as any);

    // Sync Customers
    await Promise.all(data.customers.map(async (c) => {
      await MongoModels.Customer.findOneAndUpdate({ id: c.id } as any, c, { upsert: true } as any);
    }));
    const customerIds = data.customers.map(c => c.id);
    await MongoModels.Customer.deleteMany({ id: { $nin: customerIds } } as any);

    // Sync Purchases
    if (data.purchases) {
      await Promise.all(data.purchases.map(async (p) => {
        await MongoModels.Purchase.findOneAndUpdate({ id: p.id } as any, p, { upsert: true } as any);
      }));
      const purchaseIds = data.purchases.map(p => p.id);
      await MongoModels.Purchase.deleteMany({ id: { $nin: purchaseIds } } as any);
    }

    // Sync Bills
    await Promise.all(data.bills.map(async (b) => {
      await MongoModels.Bill.findOneAndUpdate({ id: b.id } as any, b, { upsert: true } as any);
    }));
    const billIds = data.bills.map(b => b.id);
    await MongoModels.Bill.deleteMany({ id: { $nin: billIds } } as any);

    // Sync Notifications
    await Promise.all(data.notifications.map(async (n) => {
      await MongoModels.Notification.findOneAndUpdate({ id: n.id } as any, n, { upsert: true } as any);
    }));
    const notificationIds = data.notifications.map(n => n.id);
    await MongoModels.Notification.deleteMany({ id: { $nin: notificationIds } } as any);

    // Sync Logs
    await Promise.all(data.logs.map(async (l) => {
      await MongoModels.Log.findOneAndUpdate({ id: l.id } as any, l, { upsert: true } as any);
    }));
    const logIds = data.logs.map(l => l.id);
    await MongoModels.Log.deleteMany({ id: { $nin: logIds } } as any);

    // Sync Settings
    await MongoModels.Settings.findOneAndUpdate({} as any, data.settings, { upsert: true } as any);

  } catch (err) {
    console.error("Error synchronizing state to MongoDB:", err);
  }
}

function saveDB(data: typeof defaultDb) {
  memoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database to disk (ephemeral/read-only hosting):", error);
  }
  
  // Fire-and-forget sync to MongoDB asynchronously
  if (isMongoConnected) {
    saveToMongo(data).catch(err => {
      console.error("Async MongoDB save failed:", err);
    });
  }
}

async function getFullDB(): Promise<typeof defaultDb> {
  if (isMongoConnected) {
    try {
      const [products, categories, suppliers, customers, users, bills, logs, notifications, purchases, settingsDoc] = await Promise.all([
        MongoModels.Product.find().lean(),
        MongoModels.Category.find().lean(),
        MongoModels.Supplier.find().lean(),
        MongoModels.Customer.find().lean(),
        MongoModels.User.find().lean(),
        MongoModels.Bill.find().lean(),
        MongoModels.Log.find().lean(),
        MongoModels.Notification.find().lean(),
        MongoModels.Purchase.find().lean(),
        MongoModels.Settings.findOne().lean()
      ]);
      return {
        products: products as any,
        categories: categories as any,
        suppliers: suppliers as any,
        customers: customers as any,
        users: users as any,
        bills: bills as any,
        logs: logs as any,
        notifications: notifications as any,
        purchases: (purchases || []) as any,
        settings: (settingsDoc || defaultDb.settings) as any
      };
    } catch (err) {
      console.error("Failed to query MongoDB, falling back to local database:", err);
      return loadDB();
    }
  }
  return loadDB();
}

// REST API Endpoints
app.get("/api/db", async (req, res) => {
  const db = await getFullDB();
  res.json(db);
});

// LOGIN Endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  const db = await getFullDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (user) {
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
app.get("/api/products", async (req, res) => {
  const db = await getFullDB();
  res.json(db.products);
});
app.get("/api/categories", async (req, res) => {
  const db = await getFullDB();
  res.json(db.categories);
});
app.get("/api/suppliers", async (req, res) => {
  const db = await getFullDB();
  res.json(db.suppliers);
});
app.get("/api/customers", async (req, res) => {
  const db = await getFullDB();
  res.json(db.customers);
});
app.get("/api/users", async (req, res) => {
  const db = await getFullDB();
  res.json(db.users);
});
app.get("/api/bills", async (req, res) => {
  const db = await getFullDB();
  res.json(db.bills);
});
app.get("/api/logs", async (req, res) => {
  const db = await getFullDB();
  res.json(db.logs);
});
app.get("/api/settings", async (req, res) => {
  const db = await getFullDB();
  res.json(db.settings);
});
app.get("/api/notifications", async (req, res) => {
  const db = await getFullDB();
  res.json(db.notifications);
});

// PUT Settings
app.put("/api/settings", async (req, res) => {
  const db = await getFullDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// CRUD Operations: PRODUCTS
app.post("/api/products", async (req, res) => {
  const newProduct = {
    id: "prod_" + Date.now(),
    ...req.body
  };

  const db = await getFullDB();
  db.products.push(newProduct);
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

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  const db = await getFullDB();
  const index = db.products.findIndex((p) => p.id === id);
  if (index !== -1) {
    db.products[index] = { ...db.products[index], ...updateData };
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

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  const db = await getFullDB();
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length < initialLength) {
    saveDB(db);
    res.json({ success: true, message: "Product deleted successfully" });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// CRUD Operations: CATEGORIES
app.post("/api/categories", async (req, res) => {
  const newCat = {
    id: "cat_" + Date.now(),
    ...req.body
  };
  const db = await getFullDB();
  db.categories.push(newCat);
  saveDB(db);
  res.status(201).json(newCat);
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  const db = await getFullDB();
  const index = db.categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...updateData };
    saveDB(db);
    res.json(db.categories[index]);
  } else {
    res.status(404).json({ error: "Category not found" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
  db.categories = db.categories.filter((c) => c.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Category deleted" });
});

// CRUD Operations: SUPPLIERS
app.post("/api/suppliers", async (req, res) => {
  const newSup = {
    id: "sup_" + Date.now(),
    ...req.body
  };
  const db = await getFullDB();
  db.suppliers.push(newSup);
  saveDB(db);
  res.status(201).json(newSup);
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  const db = await getFullDB();
  const index = db.suppliers.findIndex((s) => s.id === id);
  if (index !== -1) {
    db.suppliers[index] = { ...db.suppliers[index], ...updateData };
    saveDB(db);
    res.json(db.suppliers[index]);
  } else {
    res.status(404).json({ error: "Supplier not found" });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Supplier deleted" });
});

// CRUD Operations: CUSTOMERS
app.post("/api/customers", async (req, res) => {
  const newCust = {
    id: "cust_" + Date.now(),
    loyaltyPoints: 0,
    purchaseHistory: [],
    ...req.body
  };
  const db = await getFullDB();
  db.customers.push(newCust);
  saveDB(db);
  res.status(201).json(newCust);
});

app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  const db = await getFullDB();
  const index = db.customers.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.customers[index] = { ...db.customers[index], ...updateData };
    saveDB(db);
    res.json(db.customers[index]);
  } else {
    res.status(404).json({ error: "Customer not found" });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
  db.customers = db.customers.filter((c) => c.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Customer deleted" });
});

// CRUD Operations: PURCHASES
app.post("/api/purchases", async (req, res) => {
  const newPurchase = {
    id: "purch_" + Date.now(),
    date: new Date().toISOString(),
    ...req.body
  };

  const db = await getFullDB();
  db.purchases = db.purchases || [];
  db.purchases.unshift(newPurchase);
  const prodIndex = db.products.findIndex(p => p.id === newPurchase.productId);
  if (prodIndex !== -1) {
    db.products[prodIndex].stockQty = Number(db.products[prodIndex].stockQty) + Number(newPurchase.qty);
  }
  saveDB(db);
  res.status(201).json(newPurchase);
});

app.delete("/api/purchases/:id", async (req, res) => {
  const { id } = req.params;

  const db = await getFullDB();
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
app.post("/api/users", async (req, res) => {
  const newUser = {
    id: "usr_" + Date.now(),
    createdAt: new Date().toISOString(),
    activityLogs: ["Account registered"],
    ...req.body
  };
  const db = await getFullDB();
  db.users.push(newUser);
  saveDB(db);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  const db = await getFullDB();
  const index = db.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    saveDB(db);
    res.json(db.users[index]);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
  db.users = db.users.filter((u) => u.id !== id);
  saveDB(db);
  res.json({ success: true, message: "User deleted" });
});

// CRUD Operations: BILLS / checkout
app.post("/api/bills", async (req, res) => {
  const { billData } = req.body;
  
  const db = await getFullDB();
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

app.delete("/api/bills/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
  db.bills = db.bills.filter((b) => b.id !== id);
  saveDB(db);
  res.json({ success: true, message: "Invoice deleted successfully" });
});

// Notifications PUT Mark Read
app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const db = await getFullDB();
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
