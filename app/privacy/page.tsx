import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Dignity Home Health Care",
  description: "Privacy Policy for Dignity Home Health Care. Learn how we protect your personal and health information.",
}

export default function PrivacyPage() {
  return (
    <div className="py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: January 2024
          </p>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dignity Home Health Care is committed to protecting your privacy and ensuring the security 
              of your personal and health information. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our services or visit our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Personal identification information (name, email, phone number, address)</li>
              <li>Health information necessary to provide care services</li>
              <li>Insurance and billing information</li>
              <li>Emergency contact information</li>
              <li>Website usage data and cookies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide and coordinate home health care services</li>
              <li>Communicate with you about your care</li>
              <li>Process billing and insurance claims</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Improve our services and website</li>
              <li>Respond to your inquiries and requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information with healthcare 
              providers involved in your care, insurance companies for billing purposes, and as required 
              by law. All sharing is done in compliance with HIPAA regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your 
              personal and health information against unauthorized access, alteration, disclosure, or 
              destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal and health information</li>
              <li>Request corrections to your information</li>
              <li>Request restrictions on certain uses of your information</li>
              <li>Receive a copy of your health records</li>
              <li>File a complaint if you believe your privacy rights have been violated</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 text-muted-foreground">
              <p>Dignity Home Health Care</p>
              <p>1589 W Shaw Ave Ste 10</p>
              <p>Fresno, CA 93711</p>
              <p>Phone: (559) 375-1234</p>
              <p>Email: privacy@dignityhomehealthcare.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
