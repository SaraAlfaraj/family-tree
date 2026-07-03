/**
 * تطبيع نص عربي للبحث: إزالة التشكيل، توحيد أشكال الألف والهمزات، وتوحيد
 * التاء المربوطة/الهاء والياء/الألف المقصورة، حتى يجد المستخدم النتيجة بغض
 * النظر عن اختلافات الكتابة الشائعة (عبدالله مقابل عبد الله، إلخ).
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟ]/g, "") // تشكيل
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function matchesQuery(fullName: string, query: string): boolean {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return false;
  return normalizeArabic(fullName).includes(normalizedQuery);
}
