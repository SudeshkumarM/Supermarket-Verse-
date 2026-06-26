export const defaultDb = {
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
      phone: "9841098765",
      email: "unitedfmcg@gmail.com",
      address: "77, Broadway Street, Parry's, Chennai",
      gstNo: "33AAAFU4561M1ZD"
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
  purchases: [] as any[],
  bills: [] as any[],
  notifications: [
    {
      id: "alert_stock_prod_milk_1782219265004",
      type: "warning",
      title: "Low Stock Alert",
      message: 'Product: "Aavin Green Magic Milk 500ml" has only 4 unit(s) remaining (threshold: 10).',
      date: "2026-06-23T12:54:25.004Z",
      read: false
    },
    {
      id: "alert_exp_prod_milk_1782219265004",
      type: "alert",
      title: "Near Expiry Warning",
      message: 'Product: "Aavin Green Magic Milk 500ml" is expiring soon on 2026-06-25 (under 30 days left).',
      date: "2026-06-23T12:54:25.004Z",
      read: false
    },
    {
      id: "alert_stock_prod_soap_1782219265004",
      type: "warning",
      title: "Low Stock Alert",
      message: 'Product: "Dove Cream Bar Soap 100g" has only 8 unit(s) remaining (threshold: 15).',
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
