import React from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../Components/Breadcrumbs'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'

const LAST_UPDATED = '22 May 2026'
const CONTACT_EMAIL = 'privacy@aashmikadesigns.com'
const SUPPORT_EMAIL = 'info@aashmikadesigns.com'
const SUPPORT_PHONE = '+91 98765 43210'

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information we collect' },
  { id: 'how-we-use-data', title: 'How we use your data' },
  { id: 'cookies', title: 'Cookies & similar technologies' },
  { id: 'account-security', title: 'Account security' },
  { id: 'payment-information', title: 'Payment information' },
  { id: 'third-party-services', title: 'Third-party services' },
  { id: 'data-retention', title: 'Data retention' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'children', title: "Children's privacy" },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'contact', title: 'Contact us' },
]

function PrivacyPolicy() {
  return (
    <div className="page-shell">
      <SiteHeader showSearch={false} />

      <article className="section-container py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Privacy Policy' },
          ]}
        />

        <header className="max-w-3xl">
          <p className="text-overline">Legal</p>
          <h1 className="mt-2 font-bodoni text-3xl text-ink sm:text-4xl lg:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Aashmika Designs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This policy
            explains what personal information we collect when you use our online jewellery store, how we
            use it, and the choices available to you.
          </p>
          <p className="mt-3 font-playfair text-xs text-muted sm:text-sm">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Table of contents — sticky on desktop, horizontal scroll on mobile */}
          <nav
            aria-label="Privacy policy sections"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="lux-card p-4 sm:p-5">
              <p className="font-bodoni text-sm text-ink sm:text-base">On this page</p>
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
                {sections.map((item) => (
                  <li key={item.id} className="shrink-0 lg:shrink">
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 font-playfair text-xs text-muted transition hover:bg-[#f7ecee] hover:text-[#7a2c3a] sm:text-sm lg:py-2.5"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="legal-prose min-w-0 space-y-10 sm:space-y-12">
            <section id="introduction" className="scroll-mt-28">
              <h2 className="legal-heading">Introduction</h2>
              <p>
                This Privacy Policy applies to visitors and customers of the Aashmika Designs website and related
                services (collectively, the &quot;Services&quot;). By browsing our store, creating an account,
                placing an order, or otherwise using the Services, you agree to the practices described here.
              </p>
              <p>
                If you do not agree with this policy, please discontinue use of the Services. For questions,
                contact us using the details in the{' '}
                <a href="#contact" className="legal-link">
                  Contact us
                </a>{' '}
                section below.
              </p>
            </section>

            <section id="information-we-collect" className="scroll-mt-28">
              <h2 className="legal-heading">Information we collect</h2>
              <p>We collect information you provide directly and information generated when you use our store.</p>

              <h3 className="legal-subheading">Information you provide</h3>
              <ul className="legal-list">
                <li>
                  <strong>Account details:</strong> name, email address, password authentication data,
                  and mobile phone number when you register or update your profile.
                </li>
                <li>
                  <strong>Order &amp; delivery details:</strong> shipping name, address, city, state, pincode,
                  phone number, and email used for order confirmation and support.
                </li>
                <li>
                  <strong>Communications:</strong> messages you send to customer support, including feedback
                  or return requests.
                </li>
              </ul>

              <h3 className="legal-subheading">Information collected automatically</h3>
              <ul className="legal-list">
                <li>
                  <strong>Device &amp; usage data:</strong> browser type, approximate location (derived from IP),
                  pages viewed, products viewed, and referral source.
                </li>
                <li>
                  <strong>Cart &amp; wishlist data:</strong> items saved in your cart or wishlist, stored locally
                  in your browser and associated with your account when you sign in.
                </li>
                <li>
                  <strong>Cookies &amp; similar technologies:</strong> as described in the Cookies section below.
                </li>
              </ul>
            </section>

            <section id="how-we-use-data" className="scroll-mt-28">
              <h2 className="legal-heading">How we use your data</h2>
              <p>We use personal information for legitimate business purposes, including to:</p>
              <ul className="legal-list">
                <li>Process and fulfil orders, including delivery and order status updates</li>
                <li>Create and manage your customer account and authenticate sign-in securely</li>
                <li>Provide customer support and respond to enquiries or disputes</li>
                <li>Improve our website, product catalogue, and shopping experience</li>
                <li>Send service-related messages (e.g. order confirmations); marketing only where permitted and with your consent</li>
                <li>Detect, prevent, and address fraud, abuse, or security incidents</li>
                <li>Comply with applicable laws, regulations, and legal requests</li>
              </ul>
              <p>
                We process your data based on performance of a contract (fulfilling your order), legitimate
                interests (operating and improving our store), and, where required, your consent.
              </p>
            </section>

            <section id="cookies" className="scroll-mt-28">
              <h2 className="legal-heading">Cookies &amp; similar technologies</h2>
              <p>
                Cookies are small text files stored on your device. We and our partners may use cookies and
                similar technologies (such as local storage) to:
              </p>
              <ul className="legal-list">
                <li>Keep you signed in and remember your session preferences</li>
                <li>Store cart and wishlist contents on your device</li>
                <li>Understand how visitors use our site so we can improve navigation and performance</li>
                <li>Support security features and prevent fraudulent activity</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling certain cookies may limit
                features such as staying signed in or retaining items in your cart between visits.
              </p>
            </section>

            <section id="account-security" className="scroll-mt-28">
              <h2 className="legal-heading">Account security</h2>
              <p>
                We take reasonable technical and organisational measures to protect your account and personal
                information, including:
              </p>
              <ul className="legal-list">
                <li>Password-based customer sign-in with secure hashing and account access controls</li>
                <li>Secure transmission of data over HTTPS where supported by your browser and our hosting</li>
                <li>Access controls limiting who within our organisation can view order and account data</li>
              </ul>
              <p>
                You are responsible for keeping your device secure and not sharing account credentials with anyone.
                Contact us immediately at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                  {CONTACT_EMAIL}
                </a>{' '}
                if you suspect unauthorised access to your account.
              </p>
            </section>

            <section id="payment-information" className="scroll-mt-28">
              <h2 className="legal-heading">Payment information</h2>
              <p>
                When you checkout, you may select a payment method such as card, UPI, or cash on delivery
                (COD), depending on availability. We do not store full card numbers or UPI PINs on our servers.
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Card &amp; UPI payments:</strong> processed by authorised payment partners; only
                  limited transaction references (e.g. payment status, last four digits where applicable) may
                  be retained for reconciliation and support.
                </li>
                <li>
                  <strong>Cash on delivery:</strong> no electronic payment data is collected at checkout; we
                  may record that COD was selected for fulfilment purposes.
                </li>
              </ul>
              <p>
                Payment providers handle your financial data under their own privacy policies. We encourage
                you to review those policies when making a payment.
              </p>
            </section>

            <section id="third-party-services" className="scroll-mt-28">
              <h2 className="legal-heading">Third-party services</h2>
              <p>
                We work with trusted third parties to operate our store. These may include:
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Authentication &amp; platform services</strong> (e.g. account and catalog hosting
                  partners) to manage sign-in and product data
                </li>
                <li>
                  <strong>Payment processors</strong> to complete transactions securely
                </li>
                <li>
                  <strong>Delivery &amp; logistics partners</strong> to ship orders to your address
                </li>
                <li>
                  <strong>Analytics and infrastructure providers</strong> to monitor site performance and
                  reliability
                </li>
              </ul>
              <p>
                These parties may access personal information only as needed to perform services on our
                behalf and are expected to protect it in line with contractual obligations. We do not sell
                your personal information to third parties for their independent marketing.
              </p>
            </section>

            <section id="data-retention" className="scroll-mt-28">
              <h2 className="legal-heading">Data retention</h2>
              <p>
                We retain personal information for as long as necessary to fulfil the purposes described in
                this policy, including completing orders, resolving disputes, meeting legal obligations, and
                maintaining business records. Account data may be kept while your account is active and for a
                reasonable period afterward unless you request deletion, subject to legal retention requirements.
              </p>
            </section>

            <section id="your-rights" className="scroll-mt-28">
              <h2 className="legal-heading">Your rights</h2>
              <p>
                Depending on applicable law (including Indian data protection rules where relevant), you may
                have the right to:
              </p>
              <ul className="legal-list">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your data, subject to legal and contractual limits</li>
                <li>Withdraw consent for optional processing such as marketing communications</li>
                <li>Lodge a complaint with a relevant data protection authority</li>
              </ul>
              <p>
                To exercise these rights, email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                  {CONTACT_EMAIL}
                </a>{' '}
                or update your details in{' '}
                <Link to="/profile" className="legal-link">
                  My account
                </Link>
                . We will respond within a reasonable timeframe.
              </p>
            </section>

            <section id="children" className="scroll-mt-28">
              <h2 className="legal-heading">Children&apos;s privacy</h2>
              <p>
                Our Services are not directed to individuals under 18 years of age. We do not knowingly collect
                personal information from children. If you believe a child has provided us with personal data,
                please contact us so we can take appropriate steps to delete it.
              </p>
            </section>

            <section id="changes" className="scroll-mt-28">
              <h2 className="legal-heading">Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top
                will reflect the latest version. Material changes may be communicated via the website or
                email where appropriate. Continued use of the Services after changes take effect constitutes
                acceptance of the revised policy.
              </p>
            </section>

            <section id="contact" className="scroll-mt-28">
              <h2 className="legal-heading">Contact us</h2>
              <p>
                For privacy-related questions, data requests, or concerns about how we handle your information,
                please reach out:
              </p>
              <div className="lux-card mt-4 space-y-4 p-5 sm:p-6">
                <p className="font-bodoni text-lg text-ink">Aashmika Designs — Privacy &amp; Data Protection</p>
                <ul className="space-y-3 text-sm text-muted sm:text-base">
                  <li className="flex items-start gap-3">
                    <i className="fa-regular fa-envelope mt-1 text-gold" aria-hidden />
                    <span>
                      Privacy enquiries:{' '}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                        {CONTACT_EMAIL}
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-regular fa-envelope mt-1 text-gold" aria-hidden />
                    <span>
                      General support:{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="legal-link">
                        {SUPPORT_EMAIL}
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-phone mt-1 text-gold" aria-hidden />
                    <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="legal-link">
                      {SUPPORT_PHONE}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-location-dot mt-1 text-gold" aria-hidden />
                    <span>Chennai, India</span>
                  </li>
                </ul>
                <Link to="/collections" className="lux-button inline-flex text-sm">
                  Continue shopping
                </Link>
              </div>
            </section>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy
