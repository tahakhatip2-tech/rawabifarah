import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

export interface ChatProductSuggestion {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  unit: string;
  image: string;
  categoryAr: string;
}

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponsePayload {
  reply: string;
  products: ChatProductSuggestion[];
  quickReplies: string[];
  showWhatsAppHandoff: boolean;
}

interface ProductWithCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  ingredientsAr: string | null;
  allergens: string[];
  retailPrice: number;
  unit: string;
  images: string[];
  isFeatured: boolean;
  isSeasonal: boolean;
  category: { nameAr: string; slug: string } | null;
}

interface BranchRecord {
  nameAr: string;
  address: unknown;
  phone: string | null;
  hours: unknown;
}

const DEFAULT_QUICK_REPLIES = [
  "ما هي المنتجات المميزة اليوم؟",
  "أين تقع فروعكم وساعات العمل؟",
  "هل يوجد توصيل أو طلبات جملة؟",
  "تحدث مع خدمة العملاء واتساب",
];

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // Remove diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    "من",
    "في",
    "على",
    "عن",
    "هل",
    "ما",
    "ماذا",
    "كم",
    "سعر",
    "اسعار",
    "اريد",
    "ابي",
    "بدي",
    "عندكم",
    "يوجد",
    "لو",
    "سمحت",
    "ممكن",
    "احصل",
    "الي",
    "او",
    "مع",
    "the",
    "is",
    "are",
    "what",
    "price",
    "have",
    "do",
    "you",
  ]);
  return normalizeArabic(text)
    .split(" ")
    .filter((t) => t.length >= 2 && !stopWords.has(t));
}

function toSuggestion(p: ProductWithCategory): ChatProductSuggestion {
  return {
    id: p.id,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    price: p.retailPrice,
    unit: p.unit,
    image: p.images[0] || "/rwabifarah.png",
    categoryAr: p.category?.nameAr ?? "مخبوزات",
  };
}

function formatJsonText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const preferred = [obj.ar, obj.street, obj.city, obj.text, obj.daily, obj.weekdays]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    if (preferred.length > 0) return preferred.join(" — ");
    return Object.values(obj)
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(" | ");
  }
  return "";
}

function scoreProduct(p: ProductWithCategory, tokens: string[], normalizedQuery: string): number {
  if (tokens.length === 0) return 0;
  const nameAr = normalizeArabic(p.nameAr);
  const nameEn = normalizeArabic(p.nameEn);
  const catAr = normalizeArabic(p.category?.nameAr ?? "");
  const desc = normalizeArabic(p.descriptionAr ?? "");
  const ing = normalizeArabic(p.ingredientsAr ?? "");
  const allergens = normalizeArabic(p.allergens.join(" "));

  let score = 0;
  if (nameAr.includes(normalizedQuery) || nameEn.includes(normalizedQuery)) {
    score += 20;
  }
  for (const token of tokens) {
    if (nameAr.includes(token)) score += 10;
    if (nameEn.includes(token)) score += 8;
    if (catAr.includes(token)) score += 6;
    if (desc.includes(token)) score += 3;
    if (ing.includes(token)) score += 3;
    if (allergens.includes(token)) score += 4;
  }
  return score;
}

function hasAnyKeyword(normalized: string, keywords: string[]): boolean {
  return keywords.some((kw) => normalized.includes(normalizeArabic(kw)));
}

function buildSmartReply(
  message: string,
  products: ProductWithCategory[],
  categoryNames: string[],
  branches: BranchRecord[],
  currentPath?: string
): ChatResponsePayload {
  const norm = normalizeArabic(message);
  const tokens = tokenize(message);

  // If user is currently viewing a specific product page and asks about it
  const productMatchInPath = currentPath?.match(/^\/products\/([a-f0-9]{24})/i);
  const activePageProduct = productMatchInPath
    ? products.find((p) => p.id === productMatchInPath[1])
    : undefined;

  // 1. Direct WhatsApp / human support request
  if (hasAnyKeyword(norm, ["واتس", "واتساب", "whatsapp", "موظف", "بشري", "خدمه العملاء", "اتصال"])) {
    return {
      reply:
        "بكل سرور! يمكنك التواصل مباشرة مع فريق خدمة عملاء مخابز روابي الفرح عبر الواتساب على الرقم +962 7 9808 0411 للرد الفوري على الطلبات الخاصة أو الاستفسارات.",
      products: [],
      quickReplies: ["ما هي المنتجات المميزة اليوم؟", "أين تقع فروعكم؟"],
      showWhatsAppHandoff: true,
    };
  }

  // 2. Greeting
  if (
    tokens.length <= 2 &&
    hasAnyKeyword(norm, ["السلام", "مرحبا", "اهلا", "هلا", "صباح الخير", "مساء الخير", "hi", "hello"])
  ) {
    const featured = products.filter((p) => p.isFeatured).slice(0, 3);
    const sample = featured.length > 0 ? featured : products.slice(0, 3);
    return {
      reply:
        "أهلاً وسهلاً بك في مخابز روابي الفرح! 🥐 أنا مساعدك الذكي، يسعدني مساعدتك في معرفة الأصناف الطازجة والأسعار والفروع أو طلبات الجملة. كيف أخدمك اليوم؟",
      products: sample.map(toSuggestion),
      quickReplies: DEFAULT_QUICK_REPLIES,
      showWhatsAppHandoff: false,
    };
  }

  // 3. Branches, locations, working hours
  if (hasAnyKeyword(norm, ["فرع", "فروع", "موقع", "عنوان", "ساعات", "دوام", "تفتح", "تغلق", "وين", "مكان", "هاتف", "تليفون"])) {
    const branchLines =
      branches.length > 0
        ? branches.map((b, idx) => {
            const addr = formatJsonText(b.address);
            const hrs = formatJsonText(b.hours);
            const parts = [`${idx + 1}. ${b.nameAr}`];
            if (addr) parts.push(`العنوان: ${addr}`);
            if (hrs) parts.push(`الدوام: ${hrs}`);
            if (b.phone) parts.push(`هاتف: ${b.phone}`);
            return parts.join(" — ");
          })
        : [
            "1. الفرع الرئيسي — الرابية بجانب مجمع البنوك (07:00 ص – 11:00 م)",
            "2. فرع غرب عمّان — الدوار السابع، شارع المطار (07:00 ص – 12:00 منتصف الليل)",
          ];

    return {
      reply: `يسعدنا استقبالكم يومياً في فروعنا:\n${branchLines.join("\n")}\n\nوللاستفسار الفوري أو مشاركة الموقع عبر واتساب تواصلوا معنا على +962 7 9808 0411.`,
      products: [],
      quickReplies: ["هل يوجد توصيل؟", "عرض المخبوزات المميزة", "تحدث مع خدمة العملاء واتساب"],
      showWhatsAppHandoff: true,
    };
  }

  // 4. B2B / Wholesale
  if (hasAnyKeyword(norm, ["جمله", "تجار", "مقاهي", "مطاعم", "فنادق", "كافيه", "توريد", "تعاقد", "b2b", "شركات"])) {
    return {
      reply:
        "نوفر في روابي الفرح خدمة التوريد اليومي بالجملة للمطاعم والفنادق والمقاهي بأسعار تعاقدية خاصة ومواعيد توصيل صباحية مضمونة.\nيمكنك زيارة صفحة الجملة (B2B) من القائمة العلوية أو مراسلة فريق المبيعات مباشرة عبر الواتساب +962 7 9808 0411.",
      products: [],
      quickReplies: ["أين تقع فروعكم؟", "ما هي الأصناف المتوفرة؟", "تحدث مع خدمة العملاء واتساب"],
      showWhatsAppHandoff: true,
    };
  }

  // 5. Delivery / Custom Orders / Order tracking
  if (hasAnyKeyword(norm, ["توصيل", "شحن", "طلبيه", "طلب خاص", "مناسبات", "حفلات", "تتبع", "وصل"])) {
    return {
      reply:
        "يمكنك الطلب بسهولة عبر المتجر بإضافة المنتجات للسلة ثم إتمام الطلب من صفحة الدفع، ونحرص على تحضير مخبوزاتك طازجة يومياً.\nللطلبات الخاصة بالمناسبات أو متابعة طلب قائم، يمكنك مراسلتنا مباشرة على واتساب +962 7 9808 0411.",
      products: [],
      quickReplies: ["ما هي المنتجات المميزة اليوم؟", "أين تقع فروعكم؟", "تحدث مع خدمة العملاء واتساب"],
      showWhatsAppHandoff: true,
    };
  }

  // 6. Allergens / Ingredients inquiry (either on current product or matched products)
  if (hasAnyKeyword(norm, ["حساسيه", "جلوتين", "غلوتين", "مكسرات", "حليب", "لاكتوز", "مكونات", "يحتوي", "خالي"])) {
    const scored = products
      .map((p) => ({ p, score: scoreProduct(p, tokens, norm) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.p);

    const targets = scored.length > 0 ? scored.slice(0, 3) : activePageProduct ? [activePageProduct] : [];
    if (targets.length > 0) {
      const details = targets.map((p) => {
        const ing = p.ingredientsAr ? `المكونات: ${p.ingredientsAr}` : "المكونات الطبيعية الطازجة من مخبزنا";
        const allg = p.allergens.length > 0 ? `تنبيه الحساسية: ${p.allergens.join("، ")}` : "لم تُسجَّل مسببات حساسية محددة في النظام";
        return `• ${p.nameAr}: ${ing}. (${allg})`;
      });
      return {
        reply: `${details.join("\n")}\n\nإذا كانت لديك حساسية شديدة يرجى التأكد معنا عبر واتساب قبل الطلب حرصاً على سلامتك.`,
        products: targets.map(toSuggestion),
        quickReplies: ["تحدث مع خدمة العملاء واتساب", "عرض المنتجات المميزة"],
        showWhatsAppHandoff: true,
      };
    }
  }

  // 7. Match specific products by search tokens
  const scoredProducts = products
    .map((p) => ({ p, score: scoreProduct(p, tokens, norm) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score);

  if (scoredProducts.length > 0) {
    const top = scoredProducts.slice(0, 4).map((x) => x.p);
    const summaryLines = top.map(
      (p) => `• ${p.nameAr} — ${formatCurrency(p.retailPrice)} (${p.unit})`
    );
    return {
      reply: `وجدت لك هذه الخيارات الطازجة من قائمة روابي الفرح:\n${summaryLines.join("\n")}\n\nيمكنك النقر على أي منتج لعرض تفاصيله ومكوناته أو إضافته للسلة مباشرة:`,
      products: top.map(toSuggestion),
      quickReplies: ["هل يوجد توصيل؟", "أين تقع فروعكم؟", "عرض أصناف أخرى"],
      showWhatsAppHandoff: false,
    };
  }

  // 8. Asking about the product currently open in /products/[id]
  if (activePageProduct && hasAnyKeyword(norm, ["هذا", "المنتج", "سعره", "مكوناته", "تفاصيل", "متوفر"])) {
    const ing = activePageProduct.ingredientsAr ? `\nالمكونات: ${activePageProduct.ingredientsAr}` : "";
    const allg =
      activePageProduct.allergens.length > 0
        ? `\nمسببات الحساسية: ${activePageProduct.allergens.join("، ")}`
        : "";
    return {
      reply: `تفاصيل "${activePageProduct.nameAr}":\nالسعر: ${formatCurrency(activePageProduct.retailPrice)} / ${activePageProduct.unit}.${ing}${allg}`,
      products: [toSuggestion(activePageProduct)],
      quickReplies: ["أضفه أو اطلب عبر واتساب", "ما هي المنتجات المميزة اليوم؟"],
      showWhatsAppHandoff: false,
    };
  }

  // 9. General menu / featured / categories / prices
  if (
    hasAnyKeyword(norm, [
      "منيو",
      "قائمه",
      "منتجات",
      "اصناف",
      "اسعار",
      "مميز",
      "موسمي",
      "عروض",
      "متوفر",
      "اكل",
      "حلويات",
      "مخبوزات",
      "خبز",
      "كرواسون",
    ])
  ) {
    const featured = products.filter((p) => p.isFeatured || p.isSeasonal).slice(0, 4);
    const list = featured.length > 0 ? featured : products.slice(0, 4);
    const catsText = categoryNames.length > 0 ? `الأقسام المتوفرة: ${categoryNames.join("، ")}.` : "";
    return {
      reply: `نخبز يومياً مجموعة مختارة من أشهى المخبوزات والحلويات الطازجة. ${catsText}\nإليك أبرز الأصناف المقترحة لك الآن:`,
      products: list.map(toSuggestion),
      quickReplies: ["أين تقع فروعكم؟", "هل يوجد توصيل أو طلبات جملة؟", "تحدث مع خدمة العملاء واتساب"],
      showWhatsAppHandoff: false,
    };
  }

  // 10. Graceful fallback with WhatsApp handoff
  return {
    reply:
      "شكراً لتواصلك مع مخابز روابي الفرح! لم أتمكن من تحديد طلبك بدقة في قاعدة المنتجات الحالية، لكن يمكنك سؤالي عن اسم منتج معين (مثل خبز، كرواسون، بقلاوة)، أو عن الفروع والأسعار، أو التواصل مباشرة مع فريقنا عبر الواتساب لخدمتك فوراً:",
    products: products.filter((p) => p.isFeatured).slice(0, 2).map(toSuggestion),
    quickReplies: DEFAULT_QUICK_REPLIES,
    showWhatsAppHandoff: true,
  };
}

async function tryGeminiReply(
  message: string,
  history: ChatHistoryMessage[],
  products: ProductWithCategory[],
  branches: BranchRecord[],
  fallback: ChatResponsePayload
): Promise<ChatResponsePayload | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const catalogLines = products.slice(0, 40).map((p) => ({
    id: p.id,
    nameAr: p.nameAr,
    category: p.category?.nameAr ?? "",
    price: formatCurrency(p.retailPrice),
    unit: p.unit,
    ingredientsAr: p.ingredientsAr ?? "",
    allergens: p.allergens,
    featured: p.isFeatured,
  }));

  const systemPrompt = [
    "أنت المساعد الذكي الرسمي لمخابز وحلويات روابي الفرح (Rawabi Al-Farah Bakery) في عمّان - الأردن.",
    "أجب باللغة العربية بأسلوب ودود ومختصر وواضح.",
    "استخدم فقط البيانات التالية ولا تخترع أسعاراً أو فروعاً غير موجودة.",
    `رقم الواتساب المباشر لخدمة العملاء والطلبات الخاصة: +962 7 9808 0411`,
    `الفروع المسجلة: ${JSON.stringify(branches)}`,
    `قائمة المنتجات الحية: ${JSON.stringify(catalogLines)}`,
    'أعد الرد بصيغة JSON فقط بدون أي نص خارجه بهذا الشكل: {"reply": "...", "productIds": ["id1"], "quickReplies": ["...", "..."], "showWhatsAppHandoff": false}',
  ].join("\n");

  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 450,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as {
      reply?: string;
      productIds?: string[];
      quickReplies?: string[];
      showWhatsAppHandoff?: boolean;
    };

    if (!parsed.reply || typeof parsed.reply !== "string") return null;

    const productMap = new Map(products.map((p) => [p.id, p]));
    const suggested = (Array.isArray(parsed.productIds) ? parsed.productIds : [])
      .map((id) => productMap.get(id))
      .filter((p): p is ProductWithCategory => Boolean(p))
      .slice(0, 4)
      .map(toSuggestion);

    return {
      reply: parsed.reply,
      products: suggested.length > 0 ? suggested : fallback.products,
      quickReplies:
        Array.isArray(parsed.quickReplies) && parsed.quickReplies.length > 0
          ? parsed.quickReplies.slice(0, 3)
          : fallback.quickReplies,
      showWhatsAppHandoff: Boolean(parsed.showWhatsAppHandoff),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      message?: unknown;
      history?: unknown;
      currentPath?: unknown;
    } | null;

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return err("الرجاء كتابة رسالتك أولاً", 400);
    }
    if (message.length > 1000) {
      return err("الرسالة طويلة جداً، يرجى اختصارها إلى أقل من 1000 حرف", 400);
    }

    const history: ChatHistoryMessage[] = Array.isArray(body?.history)
      ? body.history
          .filter(
            (m): m is ChatHistoryMessage =>
              Boolean(m) &&
              typeof m === "object" &&
              ((m as ChatHistoryMessage).role === "user" ||
                (m as ChatHistoryMessage).role === "assistant") &&
              typeof (m as ChatHistoryMessage).content === "string"
          )
          .slice(-8)
      : [];

    const currentPath =
      typeof body?.currentPath === "string" ? body.currentPath : undefined;

    const [products, categories, branches] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          descriptionAr: true,
          ingredientsAr: true,
          allergens: true,
          retailPrice: true,
          unit: true,
          images: true,
          isFeatured: true,
          isSeasonal: true,
          category: { select: { nameAr: true, slug: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      }),
      prisma.productCategory.findMany({
        where: { isActive: true },
        select: { nameAr: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { nameAr: true, address: true, phone: true, hours: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const categoryNames = categories.map((c) => c.nameAr);
    const smartFallback = buildSmartReply(
      message,
      products,
      categoryNames,
      branches,
      currentPath
    );

    const geminiResult = await tryGeminiReply(
      message,
      history,
      products,
      branches,
      smartFallback
    );

    return ok(geminiResult ?? smartFallback);
  } catch {
    return err("تعذر معالجة الرسالة حالياً، يمكنك مراسلتنا مباشرة على واتساب +962 7 9808 0411", 500);
  }
}

