import { describe, expect, it } from "vitest";
import { buildFamilyGraph, fullName, hasFamilyCard, isBloodDescendant } from "./buildGraph";
import type { FamilyData } from "../types";

function makeData(overrides: Partial<FamilyData> = {}): FamilyData {
  return {
    meta: { title: "t", rootId: "root", familyName: "الأسرة", ...overrides.meta },
    people: [
      {
        id: "root",
        gender: "male",
        firstName: "الجذر",
        alive: false,
        children: ["son", "daughter"],
        spouses: [],
      },
      {
        id: "son",
        gender: "male",
        firstName: "الابن",
        alive: true,
        children: ["grandson"],
        spouses: ["cousin_wife"],
      },
      {
        id: "daughter",
        gender: "female",
        firstName: "البنت",
        alive: true,
        children: ["cousin_wife"],
        spouses: [],
      },
      // ابنة البنت تتزوج ابن عمها (زواج أقارب): لها بطاقة أصيلة عبر أمها... لكن حسب
      // القاعدة تُسجَّل تحت اسم عائلة الأب فقط، لذا هنا هي من خارج نسل الدم الظاهر
      // إن كان والدها من خارج العائلة. لتبسيط الاختبار نجعلها ابنة الابن الآخر.
      {
        id: "cousin_wife",
        gender: "female",
        firstName: "ابنة العم",
        fatherName: "الابن",
        alive: true,
        children: [],
        spouses: [],
      },
      {
        id: "grandson",
        gender: "male",
        firstName: "الحفيد",
        alive: true,
        children: [],
        spouses: [],
      },
      {
        id: "outside_spouse",
        gender: "female",
        firstName: "زوجة من خارج العائلة",
        familyName: "عائلة أخرى",
        alive: true,
        children: [],
        spouses: [],
      },
      ...(overrides.people ?? []),
    ],
    ...overrides,
  } as FamilyData;
}

describe("buildFamilyGraph", () => {
  it("يشتق parents من علاقات children العكسية", () => {
    const graph = buildFamilyGraph(makeData());
    expect(graph.people.get("son")?.parents).toEqual(["root"]);
    expect(graph.people.get("grandson")?.parents).toEqual(["son"]);
  });

  it("يدمج spouses ليظهر الرابط متماثلًا على الطرفين حتى لو صُرِّح به مرة واحدة", () => {
    const graph = buildFamilyGraph(makeData());
    expect(graph.people.get("son")?.spouses).toContain("cousin_wife");
    expect(graph.people.get("cousin_wife")?.spouses).toContain("son");
  });

  it("يستخدم meta.familyName كقيمة افتراضية عند غياب familyName الشخصي", () => {
    const graph = buildFamilyGraph(makeData());
    expect(graph.people.get("son")?.familyName).toBe("الأسرة");
  });

  it("يحافظ على familyName الصريح عند وجوده (زوجة من خارج العائلة)", () => {
    const graph = buildFamilyGraph(makeData());
    expect(graph.people.get("outside_spouse")?.familyName).toBe("عائلة أخرى");
  });
});

describe("isBloodDescendant / hasFamilyCard", () => {
  it("الجذر له بطاقة لكنه ليس isBloodDescendant (حالة خاصة)", () => {
    const graph = buildFamilyGraph(makeData());
    expect(isBloodDescendant(graph, "root")).toBe(false);
    expect(hasFamilyCard(graph, "root")).toBe(true);
  });

  it("نسل الدم الحامل لاسم العائلة له بطاقة أصيلة", () => {
    const graph = buildFamilyGraph(makeData());
    expect(isBloodDescendant(graph, "son")).toBe(true);
    expect(hasFamilyCard(graph, "grandson")).toBe(true);
  });

  it("الزوجة القادمة من خارج العائلة (بلا آباء في الشجرة) لا تُحتسب نسل دم", () => {
    const graph = buildFamilyGraph(makeData());
    expect(isBloodDescendant(graph, "outside_spouse")).toBe(false);
  });
});

describe("fullName", () => {
  it("يجمع الاسم الأول واسم الأب والجد والعائلة، متجاهلًا الحقول الفارغة", () => {
    const graph = buildFamilyGraph(makeData());
    const grandson = graph.people.get("grandson")!;
    expect(fullName(grandson)).toBe("الحفيد الأسرة");
  });
});
