import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Dignity Home Health Care",
  description: "Terms of Service for Dignity Home Health Care website and services.",
}

export default function TermsPage() {
  return (
    <div className="py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: January 2024
          </p>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Dignity Home Health Care website and services, you agree to be 
              bound by these Terms of Service. If you do not agree to these terms, please do not use 
              our website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Services Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dignity Home Health Care provides home health care services including skilled nursing, 
              physical therapy, occupational therapy, speech therapy, personal care, and companion care. 
              Services are provided by licensed and trained healthcare professionals in accordance with 
              applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Website Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The content on this website is provided for informational purposes only and is not intended 
              to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the 
              advice of your physician or other qualified health provider with any questions you may have 
              regarding a medical condition.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use this website for any unlawful purpose or in any way that could damage, 
              disable, or impair the website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Contact Form Submissions</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you submit information through our contact form, you agree that the information provided 
              is accurate and complete. We will use this information to respond to your inquiry and may 
              contact you regarding our services. Your information will be handled in accordance with our 
              Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on this website, including text, graphics, logos, and images, is the property of 
              Dignity Home Health Care and is protected by copyright and other intellectual property laws. 
              You may not reproduce, distribute, or create derivative works from this content without our 
              express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dignity Home Health Care shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising out of your use of or inability to use this 
              website or our services. This limitation applies to the fullest extent permitted by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective 
              immediately upon posting on this website. Your continued use of the website after changes 
              are posted constitutes your acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of 
              the State of California, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="text-muted-foreground">
              <p>Dignity Home Health Care</p>
              <p>1589 W Shaw Ave Ste 10</p>
              <p>Fresno, CA 93711</p>
              <p>Phone: (559) 375-1234</p>
              <p>Email: info@dignityhomehealthcare.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
