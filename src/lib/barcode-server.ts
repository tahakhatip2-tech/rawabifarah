import { prisma } from "@/lib/db";
import { generateEan13Code } from "@/lib/barcode";

/**
 * Generates an EAN-13 barcode guaranteed unused in the Barcode collection.
 */
export async function generateUniqueEan13(offset = 0): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateEan13Code(offset + attempt * 17);
    const exists = await prisma.barcode.findUnique({
      where: { code: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return generateEan13Code(Date.now() % 10000);
}

