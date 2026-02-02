import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HIPAA Notice | Dignity Home Health Care",
  description: "HIPAA Notice of Privacy Practices for Dignity Home Health Care. Understanding your health information rights.",
}

export default function HipaaPage() {
  return (
    <div className="py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
          Notice of Privacy Practices (HIPAA)
        </h1>
        <div className="prose prose-lg max-w-none text-foreground">
          <p className="text-muted-foreground text-lg mb-8">
            Effective Date: January 2024
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <p className="text-foreground font-medium">
              THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND 
              DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Commitment to Your Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dignity Home Health Care is committed to protecting the privacy of your health information. 
              We are required by law to maintain the privacy of your protected health information (PHI), 
              provide you with this notice of our legal duties and privacy practices, and follow the terms 
              of the notice currently in effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">How We May Use and Disclose Your Health Information</h2>
            
            <h3 className="font-semibold text-lg text-foreground mt-6 mb-2">For Treatment</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may use your health information to provide, coordinate, or manage your health care and 
              related services with other health care providers.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6 mb-2">For Payment</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may use and disclose your health information to bill and receive payment for services 
              we provide to you, including Medicare, Medicaid, and private insurance.
            </p>

            <h3 className="font-semibold text-lg text-foreground mt-6 mb-2">For Health Care Operations</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may use your health information for our own operations, such as quality assessment, 
              training, and accreditation activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Your Rights Regarding Your Health Information</h2>
            <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Right to Inspect and Copy:</strong> You have the right to inspect 
                and obtain a copy of your health information.
              </li>
              <li>
                <strong className="text-foreground">Right to Amend:</strong> You have the right to request an amendment 
                to your health information if you believe it is incorrect or incomplete.
              </li>
              <li>
                <strong className="text-foreground">Right to Accounting of Disclosures:</strong> You have the right to 
                request a list of disclosures we have made of your health information.
              </li>
              <li>
                <strong className="text-foreground">Right to Request Restrictions:</strong> You have the right to request 
                restrictions on certain uses and disclosures of your health information.
              </li>
              <li>
                <strong className="text-foreground">Right to Request Confidential Communications:</strong> You have the 
                right to request that we communicate with you in a specific way or at a specific location.
              </li>
              <li>
                <strong className="text-foreground">Right to a Paper Copy:</strong> You have the right to obtain a paper 
                copy of this notice upon request.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Maintain the privacy of your health information</li>
              <li>Provide you with this notice of our legal duties and privacy practices</li>
              <li>Notify you if a breach occurs that may have compromised your health information</li>
              <li>Follow the duties and privacy practices described in this notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Questions or Complaints</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have questions about this notice or believe your privacy rights have been violated, 
              you may contact our Privacy Officer:
            </p>
            <div className="text-muted-foreground mb-4">
              <p>Dignity Home Health Care</p>
              <p>Privacy Officer</p>
              <p>1589 W Shaw Ave Ste 10</p>
              <p>Fresno, CA 93711</p>
              <p>Phone: (559) 375-1234</p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You may also file a complaint with the Secretary of the U.S. Department of Health and Human 
              Services. We will not retaliate against you for filing a complaint.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
