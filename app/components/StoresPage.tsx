import { t, type Locale } from "../../lib/i18n";
import { storeHref, type CountryGroup } from "../../lib/stores";
import legal from "./LegalPage.module.css";
import styles from "./StoresPage.module.css";

const countryName = (locale: Locale, code: string) => new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;

/** The stores GitPrice compares, one list per country. The legal page template; links come tagged from the API. Copy: web.stores.*. */
export default function StoresPage({ locale, groups }: { locale: Locale; groups: CountryGroup[] }) {
  return (
    <div className={`container ${legal.page}`}>
      <header className={legal.header}>
        <h1 className={legal.title}>{t(locale, "web.stores.title")}</h1>
      </header>
      <article className={`${legal.article} ${styles.article}`}>
        {groups.length === 0 && <p className={legal.body}>{t(locale, "web.stores.empty")}</p>}
        {groups.map(({ country, stores }) => (
          <section key={country} className={legal.section} aria-labelledby={`country-${country}`}>
            <h2 id={`country-${country}`} className={legal.sectionTitle}>{countryName(locale, country)}</h2>
            <ul className={styles.list}>
              {stores.map((s) => (
                <li key={s.id} className={styles.row}>
                  <span className={styles.name} dir="auto">
                    {s.name}
                    <span className={styles.domain} dir="ltr">{s.domain}</span>
                  </span>
                  <a
                    className="gp-btn-2 gp-btn-sm"
                    href={storeHref(s)}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    aria-label={t(locale, "web.stores.goLabel", { name: s.name })}
                    data-gp-track="cta_click"
                    data-gp-cta-id={`store_${s.id}`}
                    data-gp-placement="stores"
                  >
                    {t(locale, "web.stores.go")}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
}
