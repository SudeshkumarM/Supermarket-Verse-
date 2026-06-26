import { defaultDb } from "./clientDefaultDb";

// State to track if we should intercept
let useLocalDbFallback = false;

// Initialize local database with defaultDb if not already present
const LOCAL_STORAGE_KEY = "supermarket_local_db";

function getLocalDB(): typeof defaultDb {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }
  try {
    const parsed = JSON.parse(data);
    // Ensure all required collections exist
    return {
      users: parsed.users || defaultDb.users,
      categories: parsed.categories || defaultDb.categories,
      suppliers: parsed.suppliers || defaultDb.suppliers,
      products: parsed.products || defaultDb.products,
      customers: parsed.customers || defaultDb.customers,
      purchases: parsed.purchases || defaultDb.purchases,
      bills: parsed.bills || defaultDb.bills,
      notifications: parsed.notifications || defaultDb.notifications,
      logs: parsed.logs || defaultDb.logs,
      settings: parsed.settings || defaultDb.settings,
    };
  } catch (e) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }
}

function saveLocalDB(db: typeof defaultDb) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

// Intercept with a custom wrapper to avoid modifying read-only window.fetch
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  // If we shouldn't intercept or the URL is not an API call, use native fetch
  if (!useLocalDbFallback || !urlString.includes("/api/")) {
    return window.fetch(input, init);
  }

  // Parse method and clean route
  const method = (init?.method || "GET").toUpperCase();
  const urlObj = new URL(urlString, window.location.origin);
  const pathname = urlObj.pathname;

  console.log(`[Offline Interceptor] Intercepted: ${method} ${pathname}`);

  try {
    const db = getLocalDB();

    // 1. GET /api/db
    if (pathname === "/api/db" && method === "GET") {
      return new Response(JSON.stringify(db), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. POST /api/login
    if (pathname === "/api/login" && method === "POST") {
      const { email, password } = JSON.parse(init?.body as string || "{}");
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
          action: "Logged in successfully (Offline Mode)",
          timestamp: new Date().toISOString(),
        };
        db.logs.unshift(newLog);
        user.activityLogs = user.activityLogs || [];
        user.activityLogs.unshift(`Logged in on ${new Date().toLocaleString()}`);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, user }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ message: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. PUT /api/settings
    if (pathname === "/api/settings" && method === "PUT") {
      const body = JSON.parse(init?.body as string || "{}");
      db.settings = { ...db.settings, ...body };
      saveLocalDB(db);
      return new Response(JSON.stringify(db.settings), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Products CRUD
    if (pathname.startsWith("/api/products")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newProd = { id: "prod_" + Date.now(), ...body };
        db.products.push(newProd);

        // Low stock threshold check
        if (Number(newProd.stockQty) <= Number(newProd.lowStockThreshold)) {
          db.notifications.unshift({
            id: "notif_" + Date.now(),
            type: "warning",
            title: "Low Stock Alert",
            message: `Product: "${newProd.name}" has only ${newProd.stockQty} unit(s) remaining (threshold: ${newProd.lowStockThreshold}).`,
            date: new Date().toISOString(),
            read: false,
          });
        }
        saveLocalDB(db);
        return new Response(JSON.stringify(newProd), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && id && id !== "products") {
        const body = JSON.parse(init?.body as string || "{}");
        const index = db.products.findIndex((p) => p.id === id);
        if (index !== -1) {
          db.products[index] = { ...db.products[index], ...body };
          saveLocalDB(db);
          return new Response(JSON.stringify(db.products[index]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (method === "DELETE" && id && id !== "products") {
        db.products = db.products.filter((p) => p.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "Product deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 5. Categories CRUD
    if (pathname.startsWith("/api/categories")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newCat = { id: "cat_" + Date.now(), ...body };
        db.categories.push(newCat);
        saveLocalDB(db);
        return new Response(JSON.stringify(newCat), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && id && id !== "categories") {
        const body = JSON.parse(init?.body as string || "{}");
        const index = db.categories.findIndex((c) => c.id === id);
        if (index !== -1) {
          db.categories[index] = { ...db.categories[index], ...body };
          saveLocalDB(db);
          return new Response(JSON.stringify(db.categories[index]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (method === "DELETE" && id && id !== "categories") {
        db.categories = db.categories.filter((c) => c.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "Category deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 6. Suppliers CRUD
    if (pathname.startsWith("/api/suppliers")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newSup = { id: "sup_" + Date.now(), ...body };
        db.suppliers.push(newSup);
        saveLocalDB(db);
        return new Response(JSON.stringify(newSup), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && id && id !== "suppliers") {
        const body = JSON.parse(init?.body as string || "{}");
        const index = db.suppliers.findIndex((s) => s.id === id);
        if (index !== -1) {
          db.suppliers[index] = { ...db.suppliers[index], ...body };
          saveLocalDB(db);
          return new Response(JSON.stringify(db.suppliers[index]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (method === "DELETE" && id && id !== "suppliers") {
        db.suppliers = db.suppliers.filter((s) => s.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "Supplier deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 7. Customers CRUD
    if (pathname.startsWith("/api/customers")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newCust = { id: "cust_" + Date.now(), purchaseHistory: [], loyaltyPoints: 0, ...body };
        db.customers.push(newCust);
        saveLocalDB(db);
        return new Response(JSON.stringify(newCust), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && id && id !== "customers") {
        const body = JSON.parse(init?.body as string || "{}");
        const index = db.customers.findIndex((c) => c.id === id);
        if (index !== -1) {
          db.customers[index] = { ...db.customers[index], ...body };
          saveLocalDB(db);
          return new Response(JSON.stringify(db.customers[index]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (method === "DELETE" && id && id !== "customers") {
        db.customers = db.customers.filter((c) => c.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "Customer deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 8. Purchases CRUD
    if (pathname.startsWith("/api/purchases")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newPurchase = { id: "pur_" + Date.now(), ...body };
        db.purchases = db.purchases || [];
        db.purchases.unshift(newPurchase);

        // Adjust stock
        const prodIndex = db.products.findIndex((p) => p.id === newPurchase.productId);
        if (prodIndex !== -1) {
          db.products[prodIndex].stockQty = (db.products[prodIndex].stockQty || 0) + Number(newPurchase.qty);
        }
        saveLocalDB(db);
        return new Response(JSON.stringify(newPurchase), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && id && id !== "purchases") {
        db.purchases = db.purchases || [];
        const index = db.purchases.findIndex((p) => p.id === id);
        if (index !== -1) {
          const purchase = db.purchases[index];
          const prodIndex = db.products.findIndex((p) => p.id === purchase.productId);
          if (prodIndex !== -1) {
            db.products[prodIndex].stockQty = Math.max(0, (db.products[prodIndex].stockQty || 0) - Number(purchase.qty));
          }
          db.purchases.splice(index, 1);
          saveLocalDB(db);
        }
        return new Response(JSON.stringify({ success: true, message: "Purchase record deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 9. Users (Staff) CRUD
    if (pathname.startsWith("/api/users")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const newUser = { id: "usr_" + Date.now(), activityLogs: ["Account registered (Offline)"], ...body };
        db.users.push(newUser);
        saveLocalDB(db);
        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && id && id !== "users") {
        const body = JSON.parse(init?.body as string || "{}");
        const index = db.users.findIndex((u) => u.id === id);
        if (index !== -1) {
          db.users[index] = { ...db.users[index], ...body };
          saveLocalDB(db);
          return new Response(JSON.stringify(db.users[index]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      if (method === "DELETE" && id && id !== "users") {
        db.users = db.users.filter((u) => u.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 10. Bills / Invoices CRUD
    if (pathname.startsWith("/api/bills")) {
      const id = pathname.split("/").pop();

      if (method === "POST") {
        const { billData } = JSON.parse(init?.body as string || "{}");
        const newBill = {
          id: "bill_" + Date.now(),
          billNo: "INV-" + (db.bills.length + 1001),
          ...billData,
        };

        db.bills.unshift(newBill);

        // Deduct products stocks and add warning if low stock
        newBill.items.forEach((item: any) => {
          const prodIndex = db.products.findIndex((p) => p.id === item.productId);
          if (prodIndex !== -1) {
            db.products[prodIndex].stockQty = Math.max(0, (db.products[prodIndex].stockQty || 0) - item.qty);
            if (db.products[prodIndex].stockQty <= db.products[prodIndex].lowStockThreshold) {
              db.notifications.unshift({
                id: "notif_low_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
                type: "warning",
                title: "Low Stock Alert",
                message: `Product: "${db.products[prodIndex].name}" has only ${db.products[prodIndex].stockQty} unit(s) remaining (threshold: ${db.products[prodIndex].lowStockThreshold}).`,
                date: new Date().toISOString(),
                read: false,
              });
            }
          }
        });

        // Add Loyalty points to custom loyalty points update
        if (newBill.customerId && newBill.customerId !== "walkin") {
          const custIndex = db.customers.findIndex((c) => c.id === newBill.customerId);
          if (custIndex !== -1) {
            const addedPoints = Math.floor(newBill.grandTotal / 100) * 10;
            db.customers[custIndex].loyaltyPoints = (db.customers[custIndex].loyaltyPoints || 0) + addedPoints;
            db.customers[custIndex].purchaseHistory = db.customers[custIndex].purchaseHistory || [];
            db.customers[custIndex].purchaseHistory.unshift({
              billId: newBill.id,
              billNo: newBill.billNo,
              amount: newBill.grandTotal,
              date: newBill.date,
            });
          }
        }

        // Add to audit logs
        const newLog = {
          id: "log_" + Date.now(),
          userId: newBill.cashierId || "system",
          userEmail: newBill.cashierName || "cashier",
          fullname: newBill.cashierName || "System Cashier",
          role: "Cashier",
          action: `Billed Invoice: ${newBill.billNo} - Total: ₹${newBill.grandTotal.toFixed(2)}`,
          timestamp: new Date().toISOString(),
        };
        db.logs.unshift(newLog);

        saveLocalDB(db);
        return new Response(JSON.stringify(newBill), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && id && id !== "bills") {
        db.bills = db.bills.filter((b) => b.id !== id);
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true, message: "Invoice deleted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 11. Notifications Mark Read
    if (pathname.includes("/api/notifications") && pathname.endsWith("/read") && method === "PUT") {
      const parts = pathname.split("/");
      const id = parts[parts.indexOf("notifications") + 1];
      const index = db.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        db.notifications[index].read = true;
        saveLocalDB(db);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Route not found or unhandled" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Check connection to Server, fallback if fails
export async function checkServerConnectionAndInit() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await window.fetch("/api/db", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.clone().text();
      // Verify response is actually JSON, not HTML (which is common for SPA routers returning 404/index.html)
      try {
        JSON.parse(text);
        console.log("%c[Database] Connected successfully to the active Express + MongoDB server backend.", "color: #10b981; font-weight: bold;");
        useLocalDbFallback = false;
        return;
      } catch (e) {
        console.warn("[Database] Server /api/db returned non-JSON. Probably a static SPA fallback. Enabling Client Fallback...");
      }
    } else {
      console.warn("[Database] Server responded with error. Enabling Client Fallback...");
    }
  } catch (err) {
    console.warn("[Database] Server unreachable or slow. Enabling Client Fallback...");
  }

  useLocalDbFallback = true;
  console.log("%c[Database] Hybrid Client-Side Offline Database Enabled (localStorage backed). All supermarket data is fully functional & saved in your browser storage.", "color: #3b82f6; font-weight: bold;");
}
