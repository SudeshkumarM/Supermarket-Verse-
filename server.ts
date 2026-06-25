import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { MongoClient, Db } from "mongodb";


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

// MongoDB Connection Setup
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let useMongo = false;

async function initMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("username:password") || uri.includes("<username>") || uri.includes("your-password") || uri.includes("cluster.mongodb.net/supermarket")) {
    console.warn("MONGODB_URI is not set, contains default placeholders, or is unconfigured. Falling back to local JSON file storage (db.json).");
    useMongo = false;
    return false;
  }
  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log("Connected to MongoDB successfully!");
    useMongo = true;
    
    // Seed MongoDB collections if they are empty
    await seedMongoIfEmpty();
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB, falling back to local JSON storage:", error);
    useMongo = false;
    return false;
  }
}

async function seedMongoIfEmpty() {
  if (!mongoDb) return;
  try {
    const collections = ["users", "categories", "suppliers", "products", "customers", "purchases", "bills", "logs", "notifications"];
    for (const colName of collections) {
      const count = await mongoDb.collection(colName).countDocuments();
      if (count === 0) {
        console.log(`Seeding MongoDB collection: ${colName}`);
        const data = (defaultDb as any)[colName];
        if (data && data.length > 0) {
          await mongoDb.collection(colName).insertMany(JSON.parse(JSON.stringify(data)));
        }
      }
    }

    const settingsCount = await mongoDb.collection("settings").countDocuments();
    if (settingsCount === 0) {
      await mongoDb.collection("settings").insertOne(JSON.parse(JSON.stringify(defaultDb.settings)));
    }
  } catch (err) {
    console.error("Error seeding MongoDB:", err);
  }
}

async function getFullDB() {
  if (useMongo && mongoDb) {
    try {
      const users = await mongoDb.collection("users").find({}).toArray();
      const categories = await mongoDb.collection("categories").find({}).toArray();
      const suppliers = await mongoDb.collection("suppliers").find({}).toArray();
      const products = await mongoDb.collection("products").find({}).toArray();
      const customers = await mongoDb.collection("customers").find({}).toArray();
      const purchases = await mongoDb.collection("purchases").find({}).toArray();
      const bills = await mongoDb.collection("bills").find({}).toArray();
      const logs = await mongoDb.collection("logs").find({}).toArray();
      const notifications = await mongoDb.collection("notifications").find({}).toArray();
      
      let settings: any = await mongoDb.collection("settings").findOne({});
      if (!settings) {
        settings = defaultDb.settings;
      }

      // Convert Mongo _id to avoid circular or weird structures, ensuring fully clean serializable objects
      const cleanDocs = (arr: any[]) => arr.map(item => {
        const { _id, ...rest } = item;
        return rest;
      });

      const { _id: sId, ...cleanSettings } = settings as any;

      return {
        users: cleanDocs(users),
        categories: cleanDocs(categories),
        suppliers: cleanDocs(suppliers),
        products: cleanDocs(products),
        customers: cleanDocs(customers),
        purchases: cleanDocs(purchases),
        bills: cleanDocs(bills),
        logs: cleanDocs(logs),
        settings: cleanSettings,
        notifications: cleanDocs(notifications)
      };
    } catch (e) {
      console.error("MongoDB read error, falling back to local JSON DB:", e);
      return loadDB();
    }
  } else {
    return loadDB();
  }
}

// REST API Endpoints
app.get("/api/db", async (req, res) => {
  const db = await getFullDB();
  res.json(db);
});

// LOGIN Endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  let user;
  if (useMongo && mongoDb) {
    try {
      user = await mongoDb.collection("users").findOne({
        email: { $regex: new RegExp("^" + email + "$", "i") },
        password: password
      });
    } catch (e) {
      console.error("Mongo login error:", e);
    }
  } else {
    const db = loadDB();
    user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
  }

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

    if (useMongo && mongoDb) {
      try {
        await mongoDb.collection("logs").insertOne(newLog);
      } catch (e) {
        console.error("Mongo log insertion error:", e);
      }
    } else {
      const db = loadDB();
      db.logs.unshift(newLog);
      saveDB(db);
    }

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
  if (useMongo && mongoDb) {
    try {
      const settings = await mongoDb.collection("settings").findOne({});
      const newSettings = { ...settings, ...req.body };
      delete newSettings._id;
      await mongoDb.collection("settings").updateOne({}, { $set: newSettings }, { upsert: true });
      res.json(newSettings);
    } catch (e) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  } else {
    const db = loadDB();
    db.settings = { ...db.settings, ...req.body };
    saveDB(db);
    res.json(db.settings);
  }
});

// CRUD Operations: PRODUCTS
app.post("/api/products", async (req, res) => {
  const newProduct = {
    id: "prod_" + Date.now(),
    ...req.body
  };

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("products").insertOne(newProduct);
      if (Number(newProduct.stockQty) <= Number(newProduct.lowStockThreshold)) {
        const newNotif = {
          id: "alert_stock_" + newProduct.id + "_" + Date.now(),
          type: "warning",
          title: "Low Stock Alert",
          message: `Product: "${newProduct.name}" has only ${newProduct.stockQty} unit(s) remaining (threshold: ${newProduct.lowStockThreshold}).`,
          date: new Date().toISOString(),
          read: false
        };
        await mongoDb.collection("notifications").insertOne(newNotif);
      }
    } catch (e) {
      console.error("Mongo product post error:", e);
    }
  } else {
    const db = loadDB();
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
  }

  res.status(201).json(newProduct);
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (useMongo && mongoDb) {
    try {
      const prod = await mongoDb.collection("products").findOne({ id });
      if (prod) {
        const updatedProduct = { ...prod, ...updateData };
        await mongoDb.collection("products").updateOne({ id }, { $set: updateData });

        if (Number(updatedProduct.stockQty) <= Number(updatedProduct.lowStockThreshold)) {
          const prefix = "alert_stock_" + id;
          const alreadyNotified = await mongoDb.collection("notifications").findOne({
            id: { $regex: "^" + prefix },
            read: false
          });
          if (!alreadyNotified) {
            const newNotif = {
              id: "alert_stock_" + id + "_" + Date.now(),
              type: "warning",
              title: "Low Stock Alert",
              message: `Product: "${updatedProduct.name}" has only ${updatedProduct.stockQty} unit(s) remaining (threshold: ${updatedProduct.lowStockThreshold}).`,
              date: new Date().toISOString(),
              read: false
            };
            await mongoDb.collection("notifications").insertOne(newNotif);
          }
        }
        res.json(updatedProduct);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to update product" });
    }
  } else {
    const db = loadDB();
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
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (useMongo && mongoDb) {
    try {
      const result = await mongoDb.collection("products").deleteOne({ id });
      if (result.deletedCount > 0) {
        res.json({ success: true, message: "Product deleted successfully" });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  } else {
    const db = loadDB();
    const initialLength = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length < initialLength) {
      saveDB(db);
      res.json({ success: true, message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  }
});

// CRUD Operations: CATEGORIES
app.post("/api/categories", async (req, res) => {
  const newCat = {
    id: "cat_" + Date.now(),
    ...req.body
  };
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("categories").insertOne(newCat);
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.categories.push(newCat);
    saveDB(db);
  }
  res.status(201).json(newCat);
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("categories").updateOne({ id }, { $set: updateData });
      const updated = await mongoDb.collection("categories").findOne({ id });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update category" });
    }
  } else {
    const db = loadDB();
    const index = db.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      db.categories[index] = { ...db.categories[index], ...updateData };
      saveDB(db);
      res.json(db.categories[index]);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("categories").deleteOne({ id });
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.categories = db.categories.filter((c) => c.id !== id);
    saveDB(db);
  }
  res.json({ success: true, message: "Category deleted" });
});

// CRUD Operations: SUPPLIERS
app.post("/api/suppliers", async (req, res) => {
  const newSup = {
    id: "sup_" + Date.now(),
    ...req.body
  };
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("suppliers").insertOne(newSup);
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.suppliers.push(newSup);
    saveDB(db);
  }
  res.status(201).json(newSup);
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("suppliers").updateOne({ id }, { $set: updateData });
      const updated = await mongoDb.collection("suppliers").findOne({ id });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  } else {
    const db = loadDB();
    const index = db.suppliers.findIndex((s) => s.id === id);
    if (index !== -1) {
      db.suppliers[index] = { ...db.suppliers[index], ...updateData };
      saveDB(db);
      res.json(db.suppliers[index]);
    } else {
      res.status(404).json({ error: "Supplier not found" });
    }
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("suppliers").deleteOne({ id });
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.suppliers = db.suppliers.filter((s) => s.id !== id);
    saveDB(db);
  }
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
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("customers").insertOne(newCust);
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.customers.push(newCust);
    saveDB(db);
  }
  res.status(201).json(newCust);
});

app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("customers").updateOne({ id }, { $set: updateData });
      const updated = await mongoDb.collection("customers").findOne({ id });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  } else {
    const db = loadDB();
    const index = db.customers.findIndex((c) => c.id === id);
    if (index !== -1) {
      db.customers[index] = { ...db.customers[index], ...updateData };
      saveDB(db);
      res.json(db.customers[index]);
    } else {
      res.status(404).json({ error: "Customer not found" });
    }
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("customers").deleteOne({ id });
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.customers = db.customers.filter((c) => c.id !== id);
    saveDB(db);
  }
  res.json({ success: true, message: "Customer deleted" });
});

// CRUD Operations: PURCHASES
app.post("/api/purchases", async (req, res) => {
  const newPurchase = {
    id: "purch_" + Date.now(),
    date: new Date().toISOString(),
    ...req.body
  };

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("purchases").insertOne(newPurchase);
      await mongoDb.collection("products").updateOne(
        { id: newPurchase.productId },
        { $inc: { stockQty: Number(newPurchase.qty) } }
      );
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.purchases = db.purchases || [];
    db.purchases.unshift(newPurchase);
    const prodIndex = db.products.findIndex(p => p.id === newPurchase.productId);
    if (prodIndex !== -1) {
      db.products[prodIndex].stockQty = Number(db.products[prodIndex].stockQty) + Number(newPurchase.qty);
    }
    saveDB(db);
  }
  res.status(201).json(newPurchase);
});

app.delete("/api/purchases/:id", async (req, res) => {
  const { id } = req.params;

  if (useMongo && mongoDb) {
    try {
      const purchase = await mongoDb.collection("purchases").findOne({ id });
      if (purchase) {
        await mongoDb.collection("products").updateOne(
          { id: purchase.productId },
          { $inc: { stockQty: -Number(purchase.qty) } }
        );
        const prod = await mongoDb.collection("products").findOne({ id: purchase.productId });
        if (prod && prod.stockQty < 0) {
          await mongoDb.collection("products").updateOne({ id: purchase.productId }, { $set: { stockQty: 0 } });
        }
        await mongoDb.collection("purchases").deleteOne({ id });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Purchase not found" });
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to delete purchase" });
    }
  } else {
    const db = loadDB();
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
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("users").insertOne(newUser);
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.users.push(newUser);
    saveDB(db);
  }
  res.status(201).json(newUser);
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData._id;

  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("users").updateOne({ id }, { $set: updateData });
      const updated = await mongoDb.collection("users").findOne({ id });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update user" });
    }
  } else {
    const db = loadDB();
    const index = db.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...req.body };
      saveDB(db);
      res.json(db.users[index]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("users").deleteOne({ id });
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.users = db.users.filter((u) => u.id !== id);
    saveDB(db);
  }
  res.json({ success: true, message: "User deleted" });
});

// CRUD Operations: BILLS / checkout
app.post("/api/bills", async (req, res) => {
  const { billData } = req.body;
  
  let newBill: any;
  if (useMongo && mongoDb) {
    try {
      const count = await mongoDb.collection("bills").countDocuments();
      newBill = {
        id: "bill_" + Date.now(),
        billNo: "INV-" + (count + 1001),
        date: new Date().toISOString(),
        ...billData
      };

      await mongoDb.collection("bills").insertOne(newBill);

      // Decrement Stock quantities of checked-out products
      for (const item of newBill.items) {
        const prod = await mongoDb.collection("products").findOne({
          $or: [{ id: item.productId }, { barcode: item.barcode }]
        });
        if (prod) {
          const newQty = Math.max(0, prod.stockQty - item.qty);
          await mongoDb.collection("products").updateOne(
            { id: prod.id },
            { $set: { stockQty: newQty } }
          );

          if (newQty <= prod.lowStockThreshold) {
            const newNotif = {
              id: "alert_stock_" + prod.id + "_" + Date.now(),
              type: "warning",
              title: "Low Stock Alert",
              message: `Product: "${prod.name}" has only ${newQty} unit(s) remaining (threshold: ${prod.lowStockThreshold}).`,
              date: new Date().toISOString(),
              read: false
            };
            await mongoDb.collection("notifications").insertOne(newNotif);
          }
        }
      }

      // Credit Customer loyalty points
      if (newBill.customerId) {
        const customer = await mongoDb.collection("customers").findOne({ id: newBill.customerId });
        if (customer) {
          const earned = Math.floor(newBill.grandTotal / 100);
          const purchaseHistory = customer.purchaseHistory || [];
          purchaseHistory.push(newBill.id);
          await mongoDb.collection("customers").updateOne(
            { id: newBill.customerId },
            {
              $set: {
                loyaltyPoints: customer.loyaltyPoints + earned,
                purchaseHistory
              }
            }
          );
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
      await mongoDb.collection("logs").insertOne(auditLog);

    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    newBill = {
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
  }

  res.status(201).json(newBill);
});

app.delete("/api/bills/:id", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("bills").deleteOne({ id });
    } catch (e) {
      console.error(e);
    }
  } else {
    const db = loadDB();
    db.bills = db.bills.filter((b) => b.id !== id);
    saveDB(db);
  }
  res.json({ success: true, message: "Invoice deleted successfully" });
});

// Notifications PUT Mark Read
app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  if (useMongo && mongoDb) {
    try {
      await mongoDb.collection("notifications").updateOne({ id }, { $set: { read: true } });
      const updated = await mongoDb.collection("notifications").findOne({ id });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to mark read" });
    }
  } else {
    const db = loadDB();
    const index = db.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      db.notifications[index].read = true;
      saveDB(db);
      res.json(db.notifications[index]);
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  }
});

// Serve UI Client
async function startServer() {
  // Initialize MongoDB connection before starting
  await initMongoDB();

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
