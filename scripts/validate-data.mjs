#!/usr/bin/env node
// يتحقق من سلامة data/people.json قبل البناء/النشر. يوقف العملية (exit code 1)
// عند وجود خطأ حقيقي، ويكتفي بتحذير عند مشاكل غير قاطعة.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "people.json");

const errors = [];
const warnings = [];

const { meta, people } = JSON.parse(readFileSync(dataPath, "utf8"));

const byId = new Map();
for (const person of people) {
  if (byId.has(person.id)) {
    errors.push(`معرّف مكرر: "${person.id}" يظهر أكثر من مرة.`);
  }
  byId.set(person.id, person);
}

if (!byId.has(meta.rootId)) {
  errors.push(`rootId "${meta.rootId}" غير موجود ضمن قائمة الأشخاص.`);
}

function checkRefs(person, field) {
  for (const refId of person[field] ?? []) {
    if (!byId.has(refId)) {
      errors.push(`الشخص "${person.id}" يشير في "${field}" إلى معرّف غير موجود: "${refId}".`);
    }
  }
}

for (const person of people) {
  checkRefs(person, "children");
  checkRefs(person, "spouses");
  if (person.alive === false && !person.deathYear) {
    warnings.push(`الشخص "${person.id}" (${person.firstName}) متوفى بدون سنة وفاة.`);
  }
}

// اكتشاف حلقات ضمن علاقة children وحدها (يجب أن تبقى شجرة نسب صرفة).
const WHITE = 0, GRAY = 1, BLACK = 2;
const state = new Map(people.map((p) => [p.id, WHITE]));

function detectCycle(id, path) {
  state.set(id, GRAY);
  path.push(id);
  const person = byId.get(id);
  for (const childId of person?.children ?? []) {
    if (!byId.has(childId)) continue;
    if (state.get(childId) === GRAY) {
      const cycleStart = path.indexOf(childId);
      errors.push(`حلقة في علاقات children: ${path.slice(cycleStart).concat(childId).join(" → ")}`);
    } else if (state.get(childId) === WHITE) {
      detectCycle(childId, path);
    }
  }
  path.pop();
  state.set(id, BLACK);
}

for (const person of people) {
  if (state.get(person.id) === WHITE) detectCycle(person.id, []);
}

// التحقق من الوصول: كل شخص يجب أن يكون متاحًا من الجذر عبر children أو spouses.
if (byId.has(meta.rootId)) {
  const reachable = new Set([meta.rootId]);
  const queue = [meta.rootId];
  while (queue.length) {
    const id = queue.shift();
    const person = byId.get(id);
    for (const nextId of [...(person.children ?? []), ...(person.spouses ?? [])]) {
      if (byId.has(nextId) && !reachable.has(nextId)) {
        reachable.add(nextId);
        queue.push(nextId);
      }
    }
  }
  for (const person of people) {
    if (!reachable.has(person.id)) {
      warnings.push(`الشخص "${person.id}" (${person.firstName}) غير متصل بالشجرة انطلاقًا من rootId.`);
    }
  }
}

for (const warning of warnings) console.warn(`⚠️  ${warning}`);
for (const error of errors) console.error(`❌ ${error}`);

if (errors.length > 0) {
  console.error(`\nفشل التحقق: ${errors.length} خطأ.`);
  process.exit(1);
}

console.log(`✅ البيانات سليمة (${people.length} شخصًا، ${warnings.length} تحذير).`);
