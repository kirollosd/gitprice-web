import en from "../../i18n/en.json";
import { t, type Locale } from "../../lib/i18n";
import LegalToc from "./LegalToc";
import styles from "./LegalPage.module.css";

export type LegalName = "privacy" | "terms";
type Item = { key: string; kind: "p" | "li" };
type Section = { id: string; items: Item[] };

const BULLET = /^[\u200e\u200f]*•\s*/u;

/** Sections and their paragraph/list keys in source order, so no key is ever skipped. */
export function sectionKeys(name: LegalName): Section[] {
  const node = en.web[name] as Record<string, unknown>;
  return Object.keys(node)
    .filter((id) => /^section\d+$/.test(id))
    .map((id) => ({
      id,
      items: Object.keys(node[id] as object)
        .filter((key) => key !== "heading")
        .map((key) => ({ key, kind: key.startsWith("li") ? ("li" as const) : ("p" as const) })),
    }));
}

export default function LegalPage({ locale, name }: { locale: Locale; name: LegalName }) {
  const P = `web.${name}.`;
  const toc = `web.component.webLegalToc.${name === "privacy" ? "default" : "terms"}.`;
  const sections = sectionKeys(name);
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t(locale, P + "title")}</h1>
        <p className={styles.meta}>{t(locale, P + "meta")}</p>
      </header>
      <p className={styles.intro}>{t(locale, P + "intro")}</p>
      <div className={styles.layout}>
        <LegalToc
          heading={t(locale, toc + "heading")}
          items={sections.map((s) => ({ id: s.id, label: t(locale, `${toc}label.${s.id}`) }))}
        />
        <article className={styles.article}>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className={styles.sectionTitle}>{t(locale, `${P}${s.id}.heading`)}</h2>
              {group(s.items).map((g, i) =>
                g.kind === "p" ? (
                  <p key={i} className={styles.body}>{t(locale, `${P}${s.id}.${g.keys[0]}`)}</p>
                ) : (
                  <ul key={i} className={styles.list}>
                    {g.keys.map((k) => (
                      <li key={k}>{t(locale, `${P}${s.id}.${k}`).replace(BULLET, "")}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

/** One group per paragraph; consecutive list items share a group. */
function group(items: Item[]): { kind: "p" | "li"; keys: string[] }[] {
  const out: { kind: "p" | "li"; keys: string[] }[] = [];
  for (const { key, kind } of items) {
    const last = out[out.length - 1];
    if (kind === "li" && last?.kind === "li") last.keys.push(key);
    else out.push({ kind, keys: [key] });
  }
  return out;
}
