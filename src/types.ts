export type Gender = "male" | "female";

export interface Story {
  title: string;
  narrator?: string;
  text: string;
}

export interface RawPerson {
  id: string;
  gender: Gender;
  firstName: string;
  fatherName?: string;
  grandfatherName?: string;
  familyName?: string;
  birthYear?: number | null;
  deathYear?: number | null;
  alive: boolean;
  bio?: string;
  achievements?: string[];
  photo?: string;
  stories?: Story[];
  children?: string[];
  spouses?: string[];
  /** يُستخدم فقط عند تعدد زوجات الأب لتحديد الأم الفعلية لهذا الابن/الابنة بدقة. */
  motherId?: string;
  /** يُستخدم فقط عند تعدد أزواج الأم لتحديد الأب الفعلي لهذا الابن/الابنة بدقة. */
  fatherId?: string;
}

export interface FamilyMeta {
  title: string;
  subtitle?: string;
  rootId: string;
  familyName: string;
  /** تاريخ آخر تحديث للبيانات (يُحدَّث يدويًا عند كل تعديل)، مثل "2026-07-03". */
  lastUpdated?: string;
}

export interface FamilyData {
  meta: FamilyMeta;
  people: RawPerson[];
}

/** شخص بعد اشتقاق العلاقات العكسية (parents) ودمج الأزواج بشكل متماثل. */
export interface Person extends RawPerson {
  parents: string[];
  children: string[];
  spouses: string[];
}

export interface FamilyGraph {
  meta: FamilyMeta;
  people: Map<string, Person>;
}
