import type { Metadata } from "next";
import HeroMockup from "./components/HeroMockup";
import ScrollReveal from "./components/ScrollReveal";
import StoreChip from "./components/StoreChip";
import TallyButton from "./components/TallyButton";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "GitPrice — Price Comparison for Egypt",
  description:
    "GitPrice is a free Chrome extension that instantly compares prices across Amazon.eg, Noon, and Jumia so you always pay less.",
  openGraph: {
    title: "GitPrice — Price Comparison for Egypt",
    description:
      "Compare prices across Amazon.eg, Noon, and Jumia in one click. Free Chrome extension.",
    type: "website",
  },
};

/* ── Data ──────────────────────────────────────────────── */

const STORES = [
  { name: "Amazon.eg", initials: "AZ" },
  { name: "Noon", initials: "NN" },
  { name: "Jumia", initials: "JM" },
] as const;

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant comparison",
    body: "Prices from all three stores load side-by-side in under a second, right inside your current tab.",
  },
  {
    icon: "🔔",
    title: "Price drop alerts",
    body: "Set a target price and we'll notify you the moment any store drops below it.",
  },
  {
    icon: "🔒",
    title: "Zero data collection",
    body: "GitPrice never reads your Amazon account, cart, or personal data. It only sees the product page you're on.",
  },
  {
    icon: "🌐",
    title: "Egypt-native",
    body: "Built specifically for the Egyptian market — Egyptian Pound prices, local store coverage, local shipping estimates.",
  },
] as const;

const STEPS = [
  {
    num: "01",
    title: "Open any product on Amazon.eg",
    body: "Browse Amazon.eg as you normally would. GitPrice stays quietly in your toolbar until you need it.",
  },
  {
    num: "02",
    title: "Click the GitPrice icon",
    body: "One click opens the comparison panel. Prices from Noon and Jumia load automatically — no search, no copy-paste.",
  },
  {
    num: "03",
    title: "Buy at the best price",
    body: "The cheapest option is highlighted in green. Tap it to jump straight to that store's product page.",
  },
] as const;

/* ── Page ──────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`${styles.heroInner} container`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroPill}>
              <span className={styles.heroPillDot} />
              Early Access
            </div>

            <h1 className={styles.heroHeading}>
              Stop overpaying
              <br />
              <span className={styles.heroAccent}>in Egypt.</span>
            </h1>

            <p className={styles.heroSub}>
              GitPrice compares prices across Amazon.eg, Noon, and Jumia the
              moment you open a product page — so you always buy at the lowest
              price without leaving your tab.
            </p>

            <div className={styles.heroCtas}>
              <TallyButton label="Join the Waitlist" />
              <a href="#how-it-works" className={styles.heroSecondary}>
                See how it works ↓
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <HeroMockup />
            <div className={styles.heroBgGlow} aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ── Stores strip ───────────────────────────────── */}
      <section className={styles.stores}>
        <div className={`${styles.storesInner} container`}>
          <p className={styles.storesLabel}>Compares prices across</p>
          <div className={styles.storeChips}>
            {STORES.map((s) => (
              <StoreChip key={s.name} name={s.name} initials={s.initials} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className={styles.features}>
        <div className={`${styles.featuresInner} container`}>
          <ScrollReveal>
            <div className={styles.sectionLabel}>Why GitPrice</div>
            <h2 className={styles.sectionHeading}>
              Built for smarter shopping
            </h2>
          </ScrollReveal>

          <div className={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <article className={styles.featureCard}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureBody}>{f.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={`${styles.howInner} container`}>
          <ScrollReveal>
            <div className={styles.sectionLabel}>How it works</div>
            <h2 className={styles.sectionHeading}>Three steps to saving money</h2>
          </ScrollReveal>

          <ol className={styles.stepList} role="list">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 100}>
                <li className={styles.step}>
                  <div className={styles.stepNum}>{step.num}</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepBody}>{step.body}</p>
                  </div>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Waitlist CTA ───────────────────────────────── */}
      <section className={styles.waitlist}>
        <div className={`${styles.waitlistInner} container--narrow`}>
          <ScrollReveal>
            <div className={styles.waitlistCard}>
              <div className={styles.waitlistGlow} aria-hidden="true" />
              <p className={styles.waitlistEyebrow}>Limited early access</p>
              <h2 className={styles.waitlistHeading}>
                Be first to know
                <br />
                when we launch.
              </h2>
              <p className={styles.waitlistSub}>
                Join the waitlist and get early access to GitPrice before the
                public launch.
              </p>
              <TallyButton label="Get Early Access" />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
