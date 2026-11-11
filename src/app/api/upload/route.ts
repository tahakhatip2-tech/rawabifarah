import crypto from "crypto";
import { withAuth, ok, err } from "@/lib/api";

const UPLOAD_FOLDER = "rawabifarah/news";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function buildUploadSignature(apiSecret: string, timestamp: string) {
  const signaturePayload = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}${apiSecret}`;
  return crypto.createHash("sha1").update(signaturePayload).digest("hex");
}

/**
 * Generates a short-lived Cloudinary signed upload payload so images and large videos
 * can be uploaded directly from the admin's device without hitting Vercel's 4.5 MB body limit.
 */
export const GET = withAuth(async () => {
  try {
    const config = getCloudinaryConfig();
    if (!config) {
      return err(
        "خدمة رفع الوسائط (Cloudinary) غير مفعلة بعد. أضف المتغيرات CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET في إعدادات Vercel ثم أعد النشر.",
        400
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = buildUploadSignature(config.apiSecret, timestamp);

    return ok({
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      timestamp,
      folder: UPLOAD_FOLDER,
      signature,
    });
  } catch (error) {
    console.error("[Upload Signature GET Error]:", error);
    return err("تعذر تجهيز توقيع الرفع السحابي", 500);
  }
}, "cms:create");

export const POST = withAuth(async (req) => {
  try {
    const config = getCloudinaryConfig();

    if (!config) {
      return err(
        "خدمة رفع الوسائط (Cloudinary) غير مفعلة بعد. أضف المتغيرات CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET في إعدادات Vercel ثم أعد النشر.",
        400
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return err("يرجى اختيار ملف صورة أو فيديو للرفع من الجهاز", 400);
    }

    const maxBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxBytes) {
      return err("حجم الملف يتجاوز الحد المسموح (100 ميجابايت)", 400);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = buildUploadSignature(config.apiSecret, timestamp);

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", config.apiKey);
    uploadData.append("timestamp", timestamp);
    uploadData.append("folder", UPLOAD_FOLDER);
    uploadData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
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
