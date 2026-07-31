import React from "react";
import "./LegalPage.css";


export default function LegalPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <h1>AgriLink — Terms &amp; Privacy</h1>
        <p className="legal-updated">Last updated: [24th July 2026]</p>
      </header>

      <nav className="legal-toc" aria-label="Table of contents">
        <a href="#eula">End-User Licence Agreement</a>
        <a href="#privacy">Privacy Policy</a>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* PART A — EULA                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="eula" className="legal-section">
        <h2>Part A — End-User Licence Agreement</h2>

        <h3>1. Acceptance of terms</h3>
        <p>
          By creating an account and using AgriLink, you agree to this Licence
          Agreement and the accompanying Privacy Policy. If you do not agree,
          please do not use the platform.
        </p>

        <h3>2. Who can use AgriLink</h3>
        <p>
          AgriLink is intended for smallholder farmers, agricultural
          extension officers, and approved pilot participants in [Northern
          Ghana / your pilot districts]. You must provide accurate
          information when registering, including field and farm details,
          and keep your login credentials confidential.
        </p>

        <h3>3. What AgriLink provides</h3>
        <ul>
          <li>A dashboard summarising your fields, listings, and buyer connections</li>
          <li>Market price information and a produce-listing tool</li>
          <li>Irrigation advisory recommendations based on the field data you provide</li>
          <li>The Enterprise Hub's entrepreneurship resources (certification, finance, network, and market guidance)</li>
        </ul>

        <h3 className="legal-highlight">4. Important limitation on the irrigation advisory feature</h3>
        <p>
          The irrigation advisory feature provides general, automated
          guidance based on the field information you enter (crop type, soil
          type, area, and last-watered date). <strong>It is not a substitute
          for professional agronomic advice</strong> and should be used
          alongside your own judgement and, where possible, guidance from an
          agricultural extension officer. AgriLink is under active
          development and testing; advisory outputs may occasionally be
          inaccurate. If a recommendation seems wrong for your field
          conditions, please use your own judgement and report it using the
          feedback option in the app.
        </p>

        <h3>5. Your responsibilities</h3>
        <p>You agree not to:</p>
        <ul>
          <li>Post false market listings or misrepresent produce for sale</li>
          <li>Attempt to access other farmers' accounts or field data</li>
          <li>Use the platform to circumvent fair pricing or exploit other users</li>
          <li>Interfere with or attempt to disrupt AgriLink's systems</li>
        </ul>

        <h3>6. Account suspension and termination</h3>
        <p>
          AgriLink may suspend or terminate an account that violates Section
          5, or at your own request. You may request deletion of your
          account and associated data at any time (see Privacy Policy,
          Section 6).
        </p>

        <h3>7. Service availability</h3>
        <p>
          AgriLink is hosted on third-party infrastructure (Render) and is
          currently a pilot/prototype platform. We do not guarantee
          uninterrupted availability, and features may change as the
          platform is developed and tested further.
        </p>

        <h3>8. Ownership</h3>
        <p>
          AgriLink's software, design, and branding remain the property of
          the project team. You retain ownership of the data you enter (your
          field records, listings, and profile information); we hold and
          process it only as described in the Privacy Policy.
        </p>

        <h3>9. Governing law</h3>
        <p>
          This agreement is governed by the laws of the Republic of Ghana,
          including the Electronic Transactions Act, 2008 (Act 772) and the
          Data Protection Act, 2012 (Act 843).
        </p>

        <h3>10. Changes to this agreement</h3>
        <p>
          We may update this agreement as AgriLink develops. Material
          changes will be communicated in-app before they take effect.
        </p>

        <h3>11. Contact</h3>
        <p>Questions about this agreement: [mariamabu025@gmail.com/+233539086138].</p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PART B — PRIVACY POLICY                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="privacy" className="legal-section">
        <h2>Part B — Privacy Policy</h2>

        <h3>1. Who we are</h3>
        <p>
          AgriLink is a Capstone research and development project. The data
          controller is [African Leadership University, as registered or in
          the process of registering with Ghana's Data Protection Commission
          under Act 843].
        </p>

        <h3>2. What data we collect</h3>
        <table className="legal-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Why we collect it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account data</td>
              <td>Name, phone number, password (hashed)</td>
              <td>To create and secure your login</td>
            </tr>
            <tr>
              <td>Field data</td>
              <td>Crop type, field area, soil type, last-watered date, general location</td>
              <td>To generate irrigation advisory recommendations</td>
            </tr>
            <tr>
              <td>Market activity</td>
              <td>Listings you post, prices viewed</td>
              <td>To operate the Market module</td>
            </tr>
            <tr>
              <td>Transaction data <em>(planned)</em></td>
              <td>Mobile Money (MoMo) payment references linked to listings</td>
              <td>To support in-app payments for produce, once this feature is live</td>
            </tr>
            <tr>
              <td>Usage data</td>
              <td>Which features you use, session activity</td>
              <td>To improve the platform and diagnose problems</td>
            </tr>
            <tr>
              <td>Feedback data</td>
              <td>Survey responses, interview notes</td>
              <td>To evaluate AgriLink as part of ongoing Capstone research, under informed consent</td>
            </tr>
          </tbody>
        </table>
        <p>
          We do not collect more location precision than the irrigation
          advisory feature needs, and we do not collect data unrelated to
          these purposes.
        </p>

        <h3>3. How we use your data</h3>
        <ul>
          <li>To operate the dashboard, market, irrigation, and enterprise features you use directly</li>
          <li>To generate irrigation recommendations from your own field records</li>
          <li>To evaluate the platform as part of academic research (only for participants who have given informed consent, under REC-approved research procedures)</li>
          <li>To fix problems and improve reliability</li>
        </ul>
        <p>We do not sell your data, and we do not use it for advertising.</p>

        <h3 className="legal-highlight">4. Where your data is stored and how it's protected</h3>
        <p>
          Your account is protected by password hashing and token-based
          authentication. AgriLink is currently a pilot platform: our
          production-grade database migration (from a development-stage file
          store to a properly access-controlled database) was in progress at
          the time of this version of the policy, and is a precondition for
          any full-scale rollout beyond the current pilot. We will not
          extend AgriLink to a larger farmer population, or activate
          MoMo-linked transactions, until this migration and its security
          testing are complete.
        </p>

        <h3>5. Who we share data with</h3>
        <ul>
          <li>Agricultural extension officers and research supervisors, only with your consent</li>
          <li>Payment processors (once MoMo integration is active), limited to what's needed to process a transaction</li>
          <li>Our hosting provider (Render), which stores and runs the application on our behalf</li>
        </ul>
        <p>We do not share your data with advertisers or unrelated third parties.</p>

        <h3 className="legal-highlight">6. Your rights</h3>
        <p>Under the Data Protection Act, 2012 (Act 843), you have the right to:</p>
        <ul>
          <li>Know what personal data we hold about you and why</li>
          <li>Request a copy of your data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Withdraw consent for research participation at any time</li>
          <li>Lodge a complaint with Ghana's Data Protection Commission</li>
        </ul>
        <p>
          To exercise any of these, contact [mariamabu025@gmail.com] or use
          the in-app request option below.
        </p>

        <h3>7. Data retention</h3>
        <p>
          We keep your data for as long as your account is active, or as
          needed for the research pilot, whichever applies. If you delete
          your account, your personal data is removed within [30 days],
          except where we are required to keep research records under our
          institution's ethics policy.
        </p>

        <h3>8. Children's data</h3>
        <p>
          AgriLink is intended for adult farmers, extension officers, and
          researchers. We do not knowingly collect data from minors.
        </p>

        <h3>9. Changes to this policy</h3>
        <p>
          We may update this policy as the platform develops. We will notify
          users in-app of material changes.
        </p>

        <h3>10. Contact</h3>
        <p>Questions or requests about your data: [mariamabu025@gmail.com].</p>
      </section>
    </div>
  );
}

