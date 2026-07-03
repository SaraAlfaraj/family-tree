import type { FamilyData, FamilyGraph, Person, RawPerson } from "../types";

/**
 * يبني خريطة الأشخاص من البيانات الخام: يشتق `parents` من علاقات `children`
 * العكسية، ويدمج `spouses` بحيث تظهر متماثلة على الطرفين حتى لو صرّح بها
 * المحرر مرة واحدة فقط على أحد الطرفين.
 */
export function buildFamilyGraph(data: FamilyData): FamilyGraph {
  const people = new Map<string, Person>();

  for (const raw of data.people) {
    people.set(raw.id, toPerson(raw, data.meta.familyName));
  }

  for (const raw of data.people) {
    for (const childId of raw.children ?? []) {
      const child = people.get(childId);
      if (child && !child.parents.includes(raw.id)) {
        child.parents.push(raw.id);
      }
    }
    for (const spouseId of raw.spouses ?? []) {
      const spouse = people.get(spouseId);
      if (spouse && !spouse.spouses.includes(raw.id)) {
        spouse.spouses.push(raw.id);
      }
    }
  }

  return { meta: data.meta, people };
}

function toPerson(raw: RawPerson, defaultFamilyName: string): Person {
  return {
    ...raw,
    familyName: raw.familyName ?? defaultFamilyName,
    children: raw.children ?? [],
    spouses: raw.spouses ?? [],
    parents: [],
  };
}

/**
 * شخص "من نسل الدم الظاهر في الشجرة" هو من له مكان أساسي ضمن هرمية `children`
 * بدءًا من الجذر، وينتهي اسمه باسم عائلة الجذر (من لا ينتهي اسمه بها لا يُضاف
 * للشجرة إطلاقًا، حتى لو كان من نسل الدم). تُستخدم هذه الدالة لتمييز حالة
 * زواج الأقارب (الزوج/الزوجة نفسه له بطاقة أصلية في الشجرة، فتُعرض شارة رابطة
 * بدل تكرار بطاقته) عن الزواج من خارج العائلة (لا بطاقة له إطلاقًا في الشجرة).
 */
export function isBloodDescendant(graph: FamilyGraph, id: string): boolean {
  const person = graph.people.get(id);
  return (
    !!person &&
    person.id !== graph.meta.rootId &&
    person.parents.length > 0 &&
    person.familyName === graph.meta.familyName
  );
}

/** هل لهذا الشخص بطاقة معروضة فعليًا في الشجرة (فرد أصيل من العائلة)؟ */
export function hasFamilyCard(graph: FamilyGraph, id: string): boolean {
  return id === graph.meta.rootId || isBloodDescendant(graph, id);
}

export function fullName(person: Person): string {
  return [person.firstName, person.fatherName, person.grandfatherName, person.familyName]
    .filter(Boolean)
    .join(" ");
}

/** كلمة "متوفى" بالصيغة المناسبة لجنس الشخص. */
export function deceasedWord(person: Person): string {
  return person.gender === "female" ? "متوفاة" : "متوفى";
}

/** عبارة "رحمه الله"/"رحمها الله" بالصيغة المناسبة لجنس الشخص. */
export function restInPeacePhrase(person: Person): string {
  return person.gender === "female" ? "رحمها الله" : "رحمه الله";
}

/**
 * الاسم الكامل مع إضافة "رحمه الله"/"رحمها الله" إن كان الشخص متوفى — يُستخدم
 * في أماكن لا يظهر فيها وسم "متوفى" المستقل (كروابط الأقارب في لوحة التفاصيل).
 */
export function nameWithRestInPeace(person: Person): string {
  if (person.alive) return fullName(person);
  return `${fullName(person)} - ${restInPeacePhrase(person)}`;
}
