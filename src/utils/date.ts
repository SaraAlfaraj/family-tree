const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** يحوّل تاريخًا بصيغة "YYYY-MM-DD" إلى صيغة عربية مقروءة مثل "3 يوليو 2026". */
export function formatArabicDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} ${ARABIC_MONTHS[month - 1]} ${year}`;
}
