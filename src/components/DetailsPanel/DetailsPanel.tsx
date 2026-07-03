import { useEffect, useState } from "react";
import { useFamilyTree } from "../../context/useFamilyTree";
import { deceasedWord, fullName, hasFamilyCard, nameWithRestInPeace } from "../../utils/buildGraph";
import type { FamilyGraph, Person } from "../../types";
import styles from "./DetailsPanel.module.css";

/**
 * الوالدان المعروضان: من سجّله في children (أب أو أم) بالإضافة إلى الوالد
 * الآخر. إن حُدِّد `motherId`/`fatherId` صراحة (ضروري عند تعدد زوجات الأب أو
 * أزواج الأم) يُستخدم، وإلا يُفترض أن كل أزواج من سجّله والدان محتملان (يكفي
 * في حال وجود زوج واحد فقط بلا لبس).
 */
function displayParentIds(graph: FamilyGraph, person: Person): string[] {
  const ids = new Set(person.parents);
  const otherParent = person.motherId ?? person.fatherId;
  if (otherParent) {
    ids.add(otherParent);
  } else {
    for (const registeredId of person.parents) {
      const registered = graph.people.get(registeredId);
      registered?.spouses.forEach((spouseId) => {
        if (spouseId !== person.id) ids.add(spouseId);
      });
    }
  }
  return [...ids];
}

/**
 * الأبناء المعروضون: أبناء الشخص مباشرة، بالإضافة إلى أبناء زوجه/زوجته
 * المسجَّلين هناك (إلا إذا حدّد الابن صراحة عبر motherId/fatherId أن والده
 * الآخر شخص مختلف)، بالإضافة إلى أي شخص ربطه محرر البيانات بهذا الشخص عبر
 * motherId/fatherId مباشرة حتى دون تسجيل علاقة زواج بينهما (كحالة الطلاق).
 */
function displayChildrenIds(graph: FamilyGraph, person: Person): string[] {
  const ids = new Set<string>();
  for (const spouseId of person.spouses) {
    const spouse = graph.people.get(spouseId);
    spouse?.children.forEach((childId) => {
      const child = graph.people.get(childId);
      const declaredOtherParent = child?.motherId ?? child?.fatherId;
      if (!declaredOtherParent || declaredOtherParent === person.id) {
        ids.add(childId);
      }
    });
  }
  person.children.forEach((childId) => ids.add(childId));
  for (const candidate of graph.people.values()) {
    if (candidate.motherId === person.id || candidate.fatherId === person.id) {
      ids.add(candidate.id);
    }
  }
  return [...ids];
}

export function DetailsPanel() {
  const { graph, selectedId, focusOn, setSelectedId, canGoBack, goBack } = useFamilyTree();
  const person = selectedId ? graph.people.get(selectedId) : null;
  const [collapsedStories, setCollapsedStories] = useState<Set<number>>(new Set());
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);

  useEffect(() => {
    setCollapsedStories(new Set());
    setIsPhotoExpanded(false);
  }, [selectedId]);

  if (!person) {
    return (
      <aside className={styles.panel}>
        <p className={styles.empty}>اختر شخصًا من الشجرة لعرض تفاصيله هنا.</p>
      </aside>
    );
  }

  const statusText = person.alive
    ? person.birthYear
      ? `من مواليد ${person.birthYear}`
      : ""
    : person.birthYear
      ? `(${person.birthYear} - ${person.deathYear ?? "؟"})`
      : "";

  const isPluralSpouses = person.spouses.length > 1;
  const spouseLabel = person.gender === "female"
    ? (isPluralSpouses ? "الأزواج" : "الزوج")
    : (isPluralSpouses ? "الزوجات" : "الزوجة");

  const relations: { label: string; ids: string[] }[] = [
    { label: "الوالدان", ids: displayParentIds(graph, person) },
    { label: spouseLabel, ids: person.spouses },
    { label: "الأبناء", ids: displayChildrenIds(graph, person) },
  ];

  const toggleStory = (index: number) => {
    setCollapsedStories((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const showBackButton = canGoBack && !hasFamilyCard(graph, person.id);

  return (
    <aside className={styles.panel}>
      {showBackButton && (
        <button className={styles.backButton} onClick={goBack}>
          → عودة
        </button>
      )}
      <div className={styles.header}>
        {person.photo && (
          <img
            className={styles.photo}
            src={`${import.meta.env.BASE_URL}${person.photo}`}
            alt=""
            onClick={() => setIsPhotoExpanded(true)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{fullName(person)}</h2>
            {!person.alive && (
              <span className={styles.deceasedTag}>
                {deceasedWord(person)}{person.deathYear ? ` عام ${person.deathYear}` : ""}
              </span>
            )}
          </div>
          {statusText && <p className={styles.status}>{statusText}</p>}
        </div>
        <button className={styles.closeButton} onClick={() => setSelectedId(null)} aria-label="إغلاق">
          ×
        </button>
      </div>

      {person.bio && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>السيرة</h3>
          <p className={styles.bio}>{person.bio}</p>
        </div>
      )}

      {person.achievements && person.achievements.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>أبرز الإنجازات</h3>
          <ul className={styles.achievements}>
            {person.achievements.map((achievement, index) => (
              <li key={index}>{achievement}</li>
            ))}
          </ul>
        </div>
      )}

      {relations.map(
        ({ label, ids }) =>
          ids.length > 0 && (
            <div className={styles.section} key={label}>
              <h3 className={styles.sectionTitle}>{label}</h3>
              <div className={styles.relationLinks}>
                {ids.map((id) => {
                  const related = graph.people.get(id);
                  if (!related) return null;
                  const name = nameWithRestInPeace(related);
                  const dotClass = related.gender === "male" ? styles.dotMale : styles.dotFemale;
                  const isMember = hasFamilyCard(graph, id);
                  return (
                    <button
                      key={id}
                      className={`${styles.relationLink} ${isMember ? "" : styles.relationLinkReadonly}`}
                      onClick={() => focusOn(id)}
                      title={isMember ? undefined : "من عائلة أخرى — اضغط لعرض التفاصيل المتاحة"}
                    >
                      <span className={`${styles.genderDot} ${dotClass}`} />
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
      )}

      {person.stories && person.stories.length > 0 && (
        <div className={styles.section}>
          <div className={styles.storiesHeader}>
            <span className={styles.storiesTitle}>قصص وذكريات</span>
            <span className={styles.storiesCount}>{person.stories.length}</span>
          </div>
          <div className={styles.storyList}>
            {person.stories.map((story, index) => {
              const isCollapsed = collapsedStories.has(index);
              return (
                <div className={styles.storyCard} key={index}>
                  <button className={styles.storyHeader} onClick={() => toggleStory(index)}>
                    <span className={`${styles.storyChevron} ${isCollapsed ? styles.storyChevronCollapsed : ""}`}>
                      ⌄
                    </span>
                    <span className={styles.storyHeaderText}>
                      <span className={styles.storyTitle}>{story.title}</span>
                      {story.narrator && <span className={styles.storyNarrator}>رواية: {story.narrator}</span>}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <>
                      <div className={styles.storyDivider} />
                      <p className={styles.storyText}>{story.text}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isPhotoExpanded && person.photo && (
        <div className={styles.photoOverlay} onClick={() => setIsPhotoExpanded(false)}>
          <img src={`${import.meta.env.BASE_URL}${person.photo}`} alt={fullName(person)} />
        </div>
      )}
    </aside>
  );
}
