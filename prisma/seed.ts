import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── Business ─────────────────────────────────────────────
  const business = await prisma.business.upsert({
    where: { id: "000000000000000000000001" },
    update: {},
    create: {
      id: "000000000000000000000001",
      nameAr: "روابي الفرح",
      nameEn: "Rawabi Al-Farah Bakery",
      phone: "+962799000001",
      email: "info@rawabifarah.com",
      settings: {
        currency: "JOD",
        timezone: "Asia/Amman",
        taxRate: 16,
        loyaltyPointsPerJOD: 10,
        orderPrefix: "ORD",
        invoicePrefix: "INV",
      },
    },
  });
  console.log("✅ Business created:", business.nameAr);

  // ── Branch ────────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { id: "000000000000000000000002" },
    update: {},
    create: {
      id: "000000000000000000000002",
      businessId: business.id,
      nameAr: "الفرع الرئيسي — عمّان",
      nameEn: "Main Branch — Amman",
      address: { city: "عمّان", area: "الرابية", street: "شارع الأردن" },
      phone: "+962799000002",
      hours: {
        sat: { open: "07:00", close: "23:00" },
        sun: { open: "07:00", close: "23:00" },
        mon: { open: "07:00", close: "23:00" },
        tue: { open: "07:00", close: "23:00" },
        wed: { open: "07:00", close: "23:00" },
        thu: { open: "07:00", close: "23:00" },
        fri: { open: "09:00", close: "23:00" },
      },
    },
  });
  console.log("✅ Branch created:", branch.nameAr);

  // ── Warehouse ─────────────────────────────────────────────
  const warehouse = await prisma.warehouse.upsert({
    where: { id: "000000000000000000000003" },
    update: {},
    create: {
      id: "000000000000000000000003",
      branchId: branch.id,
      nameAr: "المستودع الرئيسي",
      nameEn: "Main Warehouse",
      type: "GENERAL",
    },
  });
  console.log("✅ Warehouse created:", warehouse.nameAr);

  // ── Users ─────────────────────────────────────────────────
  const users = [
    {
      id: "000000000000000000000010",
      email: "admin@rawabifarah.com",
      password: "Admin@123456",
      role: UserRole.SUPER_ADMIN,
      name: "مدير النظام",
    },
    {
      id: "000000000000000000000011",
      email: "owner@rawabifarah.com",
      password: "Owner@123456",
      role: UserRole.BUSINESS_OWNER,
      name: "صاحب المخبزة",
    },
    {
      id: "000000000000000000000012",
      email: "manager@rawabifarah.com",
      password: "Manager@123456",
      role: UserRole.BRANCH_MANAGER,
      name: "مدير الفرع",
    },
    {
      id: "000000000000000000000013",
      email: "cashier@rawabifarah.com",
      password: "Cashier@123456",
      role: UserRole.CASHIER,
      name: "الكاشير",
    },
    {
      id: "000000000000000000000014",
      email: "warehouse@rawabifarah.com",
      password: "Warehouse@123456",
      role: UserRole.WAREHOUSE_STAFF,
      name: "موظف المستودع",
    },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        passwordHash: hash,
        role: u.role,
        branchId: branch.id,
        businessId: business.id,
      },
    });
    console.log(`✅ User: ${u.email} (${u.role}) — password: ${u.password}`);
  }

  // ── Employees (linked to staff users) ─────────────────────
  const staffEmployees = [
    {
      id: "000000000000000000000112",
      userId: "000000000000000000000012",
      nameAr: "محمد علي السالم",
      nameEn: "Mohammad Ali",
      phone: "0799000012",
      jobTitle: "مدير الفرع الرئيسي",
      department: "الإدارة والإشراف",
      employmentType: "FULL_TIME",
      baseSalary: 850,
    },
    {
      id: "000000000000000000000113",
      userId: "000000000000000000000013",
      nameAr: "سارة خالد الحسن",
      nameEn: "Sara Khaled",
      phone: "0799000013",
      jobTitle: "مسؤولة الكاشير والمبيعات",
      department: "نقاط البيع والكاشير",
      employmentType: "SHIFT",
      baseSalary: 420,
    },
    {
      id: "000000000000000000000114",
      userId: "000000000000000000000014",
      nameAr: "عمر يوسف المصري",
      nameEn: "Omar Yousef",
      phone: "0799000014",
      jobTitle: "أمين المستودع",
      department: "المستودع والإمداد",
      employmentType: "FULL_TIME",
      baseSalary: 480,
    },
  ];

  for (const emp of staffEmployees) {
    await prisma.employee.upsert({
      where: { userId: emp.userId },
      update: {},
      create: {
        id: emp.id,
        userId: emp.userId,
        businessId: business.id,
        branchId: branch.id,
        nameAr: emp.nameAr,
        nameEn: emp.nameEn,
        phone: emp.phone,
        jobTitle: emp.jobTitle,
        department: emp.department,
        employmentType: emp.employmentType,
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        baseSalary: emp.baseSalary,
        isActive: true,
      },
    });
  }
  console.log("✅ Staff employees seeded:", staffEmployees.length);

  // ── Product Categories ────────────────────────────────────
  const categories = [
    { id: "000000000000000000000020", nameAr: "المعجنات", nameEn: "Pastries", slug: "pastries" },
    { id: "000000000000000000000021", nameAr: "الكيك", nameEn: "Cakes", slug: "cakes" },
    { id: "000000000000000000000022", nameAr: "الخبز", nameEn: "Bread", slug: "bread" },
    { id: "000000000000000000000023", nameAr: "الحلويات", nameEn: "Sweets", slug: "sweets" },
    { id: "000000000000000000000024", nameAr: "المواد الخام", nameEn: "Raw Materials", slug: "raw-materials" },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Product categories created:", categories.length);

  // ── Products ──────────────────────────────────────────────
  const products = [
    {
      id: "000000000000000000000030",
      sku: "BWD-001",
      nameAr: "خبز عربي",
      nameEn: "Arabic Bread",
      slug: "arabic-bread",
      categoryId: "000000000000000000000022",
      type: "FINISHED",
      unit: "رغيف",
      retailPrice: 0.25,
      costPrice: 0.10,
      taxRate: 0,
    },
    {
      id: "000000000000000000000031",
      sku: "CKE-001",
      nameAr: "كيكة الشوكولاتة",
      nameEn: "Chocolate Cake",
      slug: "chocolate-cake",
      categoryId: "000000000000000000000021",
      type: "FINISHED",
      unit: "قطعة",
      retailPrice: 8.5,
      costPrice: 3.2,
      taxRate: 16,
      isFeatured: true,
    },
    {
      id: "000000000000000000000032",
      sku: "PAS-001",
      nameAr: "كروسان بالزبدة",
      nameEn: "Butter Croissant",
      slug: "butter-croissant",
      categoryId: "000000000000000000000020",
      type: "FINISHED",
      unit: "حبة",
      retailPrice: 1.2,
      costPrice: 0.45,
      taxRate: 0,
      isFeatured: true,
    },
    {
      id: "000000000000000000000033",
      sku: "RAW-001",
      nameAr: "طحين قمح",
      nameEn: "Wheat Flour",
      slug: "wheat-flour",
      categoryId: "000000000000000000000024",
      type: "RAW_MATERIAL",
      unit: "كغ",
      retailPrice: 0.65,
      costPrice: 0.5,
      taxRate: 0,
    },
    {
      id: "000000000000000000000034",
      sku: "RAW-002",
      nameAr: "سكر",
      nameEn: "Sugar",
      slug: "sugar",
      categoryId: "000000000000000000000024",
      type: "RAW_MATERIAL",
      unit: "كغ",
      retailPrice: 0.9,
      costPrice: 0.7,
      taxRate: 0,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p as any,
    });

    // Add inventory for finished products
    if (p.type === "FINISHED" || p.type === "RAW_MATERIAL") {
      await prisma.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: p.id,
            warehouseId: warehouse.id,
          },
        },
        update: {},
        create: {
          productId: p.id,
          warehouseId: warehouse.id,
          qtyOnHand: p.type === "RAW_MATERIAL" ? 100 : 50,
          reorderPoint: p.type === "RAW_MATERIAL" ? 20 : 10,
        },
      });
    }
  }
  console.log("✅ Products created:", products.length);

  // ── System Settings ───────────────────────────────────────
  const settings = [
    { key: "currency", value: { code: "JOD", symbol: "د.أ", decimals: 3 } },
    { key: "timezone", value: { tz: "Asia/Amman" } },
    { key: "tax", value: { rate: 16, included: false } },
    { key: "loyalty", value: { pointsPerJOD: 10, pointValue: 0.005 } },
    {
      key: "ordering",
      value: {
        orderPrefix: "ORD",
        invoicePrefix: "INV",
        poPrefix: "PO",
        grPrefix: "GR",
      },
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log("✅ System settings initialized");

  console.log("\n✨ Seed completed successfully!\n");
  console.log("═══════════════════════════════════════");
  console.log("Test Accounts:");
  console.log("  Super Admin:    admin@rawabifarah.com    / Admin@123456");
  console.log("  Business Owner: owner@rawabifarah.com   / Owner@123456");
  console.log("  Branch Manager: manager@rawabifarah.com / Manager@123456");
  console.log("  Cashier:        cashier@rawabifarah.com / Cashier@123456");
  console.log("  Warehouse:      warehouse@rawabifarah.com / Warehouse@123456");
  console.log("═══════════════════════════════════════");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
