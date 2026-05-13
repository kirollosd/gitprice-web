import type { Metadata } from "next";
import styles from "../components/LegalPage.module.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "GitPrice Terms of Service — please read before installing or using the GitPrice Chrome extension.",
  openGraph: {
    title: "Terms of Service — GitPrice",
    description:
      "GitPrice Terms of Service — please read before installing or using the GitPrice Chrome extension.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <span className={styles.badge}>Terms of Service</span>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.meta}>
          <span>Effective May 11, 2026</span>
          <span className={styles.metaDot}>&middot;</span>
          <span>Last updated May 11, 2026</span>
        </p>
      </div>

      <p className={styles.intro}>
        Please read these Terms of Service carefully before installing or using the GitPrice Chrome
        extension. By installing or using the Service, you agree to be bound by these Terms.
        If you do not agree, do not install or use the Service.
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Description of Service</h2>
        <p className={styles.body}>
          GitPrice is a browser extension that automatically detects product pages on supported
          e-commerce platforms &mdash; currently Amazon.eg, Noon, and Jumia &mdash; and displays price
          comparisons for the same or equivalent products across those platforms. The Service also
          provides optional price-drop alerts and a 6-month local price history for tracked products.
        </p>
        <p className={styles.body}>
          GitPrice is a pre-launch MVP product offered free of charge during its initial release.
          The scope of supported platforms and features may change over time.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Eligibility and Account</h2>
        <p className={styles.body}>
          You must be at least 13 years of age to use the Service. You may use GitPrice without
          creating an account. Certain features (such as syncing alerts across devices) require
          registration. You are responsible for maintaining the confidentiality of your account credentials.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. User Obligations</h2>
        <p className={styles.body}>By using the Service, you agree to:</p>
        <ul className={styles.list}>
          <li>Use the Service only for personal, non-commercial price-comparison purposes.</li>
          <li>Not attempt to reverse-engineer, decompile, or scrape the Service itself.</li>
          <li>Not use the Service to automate bulk purchases, generate fraudulent affiliate clicks, or circumvent the terms of any supported e-commerce platform.</li>
          <li>Not interfere with or disrupt the Service&apos;s infrastructure or the servers of third-party platforms it accesses.</li>
          <li>Comply with all applicable laws and regulations in your jurisdiction.</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Affiliate Disclosure</h2>
        <p className={styles.body}>
          GitPrice participates in affiliate programmes operated by Amazon.eg, Noon, and Jumia. When
          you click a price-comparison result or a &ldquo;Go to Store&rdquo; link provided by the Service, that
          link may contain an affiliate tracking code. If you complete a purchase after following such
          a link, GitPrice may receive a commission from the retailer at <strong>no additional cost to
          you</strong>. Affiliate commissions do not influence the prices displayed or the ranking of
          results &mdash; GitPrice always shows you the best available price regardless of affiliate relationships.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Privacy and Data</h2>
        <p className={styles.body}>
          GitPrice stores product data and price history <strong>locally on your device</strong>. No
          personal shopping data is transmitted to GitPrice servers in the current MVP release. For
          details on what data is collected and how it is used, please see our{" "}
          <a href="/privacy/" className={styles.link}>Privacy Policy</a>.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Disclaimer of Warranties</h2>
        <p className={styles.body}>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT. GITPRICE DOES NOT WARRANT THAT PRICES DISPLAYED ARE ACCURATE,
          COMPLETE, OR UP TO DATE. PRICES ON THIRD-PARTY PLATFORMS MAY CHANGE AT ANY TIME, AND GITPRICE
          IS NOT RESPONSIBLE FOR DISCREPANCIES BETWEEN DISPLAYED AND ACTUAL PRICES.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Limitation of Liability</h2>
        <p className={styles.body}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GITPRICE AND ITS OFFICERS, EMPLOYEES, AND
          CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES &mdash; INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL &mdash; ARISING FROM YOUR USE OF
          OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          GITPRICE&rsquo;S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED USD 10.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Third-Party Platforms</h2>
        <p className={styles.body}>
          The Service accesses publicly available data on third-party e-commerce platforms. GitPrice is
          not affiliated with, endorsed by, or sponsored by Amazon.eg, Noon, Jumia, or any other retailer.
          Each platform&apos;s own terms of service govern your use of that platform, and GitPrice makes no
          representations regarding those terms.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Modifications to the Service and Terms</h2>
        <p className={styles.body}>
          GitPrice reserves the right to modify or discontinue the Service at any time without notice.
          We may also update these Terms from time to time. We will indicate the date of the last revision
          at the top of this page. Your continued use of the Service after a change in Terms constitutes
          your acceptance of the revised Terms.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Termination</h2>
        <p className={styles.body}>
          You may stop using the Service at any time by uninstalling the extension. GitPrice may suspend
          or terminate your access to the Service if you violate these Terms. Upon termination, the
          obligations and limitations set forth in Sections 4&ndash;7 and 11 survive.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>11. Governing Law</h2>
        <p className={styles.body}>
          These Terms are governed by and construed in accordance with the laws of the Arab Republic of
          Egypt, without regard to its conflict-of-law principles. Any dispute arising out of or relating
          to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts
          located in Cairo, Egypt.
        </p>
      </div>
    </div>
  );
}
