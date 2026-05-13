import type { Metadata } from "next";
import styles from "../components/LegalPage.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "GitPrice Privacy Policy — what data we collect, how we use it, and your rights as a user.",
  openGraph: {
    title: "Privacy Policy — GitPrice",
    description:
      "GitPrice Privacy Policy — what data we collect, how we use it, and your rights as a user.",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <span className={styles.badge}>Privacy Policy</span>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.meta}>
          <span>Effective May 11, 2026</span>
          <span className={styles.metaDot}>&middot;</span>
          <span>Last updated May 11, 2026</span>
        </p>
      </div>

      <p className={styles.intro}>
        GitPrice is a browser extension that helps you compare prices across Egyptian e-commerce stores
        including Amazon.eg, Noon, Jumia, B.Tech, and 2B. This Privacy Policy explains what information
        we collect, how we use it, and your rights as a user.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
        <p className={styles.body}>GitPrice collects the minimum data necessary to provide price comparison functionality.</p>
        <p className={styles.body}><strong>Data collected automatically while using the extension:</strong></p>
        <ul className={styles.list}>
          <li>Product identifiers (ASIN, SKU) and product titles from the pages you browse on supported stores</li>
          <li>Current prices displayed on those pages</li>
          <li>Your extension settings stored in <code className={styles.code}>chrome.storage.sync</code></li>
          <li>Anonymous error and crash reports (opt-out available in Settings &rarr; Privacy)</li>
        </ul>
        <p className={styles.body}><strong>Account data (if you sign in):</strong></p>
        <ul className={styles.list}>
          <li>Email address used to create your GitPrice account</li>
          <li>Authentication tokens stored locally in <code className={styles.code}>chrome.storage.local</code></li>
        </ul>
        <p className={styles.body}>We do not collect your browsing history outside supported store pages, financial information, passwords, or any personally identifiable information beyond your email if you register.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
        <ul className={styles.list}>
          <li>To search for and display competing prices across supported stores</li>
          <li>To send price-drop notifications for products you are tracking (if enabled)</li>
          <li>To improve extension reliability by diagnosing crashes and errors</li>
          <li>To authenticate your account and manage Pro subscription status</li>
        </ul>
        <p className={styles.body}>We do not use your data for advertising, profiling, or sale to third parties.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Third-Party Services and Affiliate Links</h2>
        <p className={styles.body}>
          GitPrice may redirect you to Amazon.eg, Noon, Jumia, B.Tech, or 2B using affiliate links.
          These links allow us to earn a small commission when you make a purchase, at no additional cost to you.
        </p>
        <p className={styles.body}>
          When you follow an affiliate link, the destination store&apos;s own privacy policy applies. GitPrice does not share your personal information with affiliate stores.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Data Storage and Security</h2>
        <p className={styles.body}>
          Your extension settings and authentication tokens are stored locally in your browser using
          Chrome&apos;s secure storage APIs (<code className={styles.code}>chrome.storage.local</code> and <code className={styles.code}>chrome.storage.sync</code>).
          Server-side data is stored on secured servers with access controls and encryption at rest.
        </p>
        <p className={styles.body}>We retain price comparison data only as long as necessary. Account data is retained until you delete your account.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Data Sharing</h2>
        <p className={styles.body}>We do not sell, rent, or trade your personal information. We may share data only in these limited circumstances:</p>
        <ul className={styles.list}>
          <li><strong>Service providers:</strong> Third-party vendors assisting in operating the extension under strict confidentiality agreements</li>
          <li><strong>Legal requirements:</strong> If required by applicable law, court order, or governmental authority</li>
          <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to users</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Your Rights</h2>
        <p className={styles.body}>Depending on your jurisdiction, you may have the right to:</p>
        <ul className={styles.list}>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Ask us to correct inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Opt-out of error reporting:</strong> Disable anonymous error reports in Settings &rarr; Privacy</li>
        </ul>
        <p className={styles.body}>
          To exercise these rights, contact us at{" "}
          <a href="mailto:privacy@gitprice.com" className={styles.link}>privacy@gitprice.com</a>.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Cookies and Tracking</h2>
        <p className={styles.body}>
          The GitPrice extension itself does not set cookies. When you visit store pages, those sites may set their own cookies &mdash; their respective privacy policies govern that activity.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Children&apos;s Privacy</h2>
        <p className={styles.body}>
          GitPrice is not directed at children under 13. We do not knowingly collect personal information from children.
          If you believe a child has provided us with personal data, contact us at{" "}
          <a href="mailto:privacy@gitprice.com" className={styles.link}>privacy@gitprice.com</a> and we will promptly delete it.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Changes to This Policy</h2>
        <p className={styles.body}>
          We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated effective date. For significant changes, we will notify you via a notice in the extension.
        </p>
      </div>
    </div>
  );
}
