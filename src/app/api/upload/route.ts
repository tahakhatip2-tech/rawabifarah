import crypto from "crypto";
import { withAuth, ok, err } from "@/lib/api";

export const POST = withAuth(async (req) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return err(
        "خدمة الرفع السحابي (Cloudinary) غير مفعلة بعد في إعدادات البيئة. يمكنك لصق رابط الصورة أو الفيديو (أو رابط YouTube) مباشرة في الحقل المخصص.",
        400
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return err("يرجى اختيار ملف صورة أو فيديو للرفع", 400);
    }

    const maxBytes = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxBytes) {
      return err("حجم الملف يتجاوز الحد المسموح (50 ميجابايت)", 400);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "rawabifarah/news";
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha1")
      .update(signaturePayload)
      .digest("hex");

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", timestamp);
    uploadData.append("folder", folder);
    uploadData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("[Cloudinary Error]:", json);
      return err(json?.error?.message || "فشل رفع الملف إلى Cloudinary", 500);
    }

    return ok({
      url: json.secure_url as string,
      resourceType: json.resource_type as string,
      publicId: json.public_id as string,
    });
  } catch (error) {
    console.error("[Upload POST Error]:", error);
    return err("حدث خطأ أثناء رفع الملف", 500);
  }
}, "cms:create");

