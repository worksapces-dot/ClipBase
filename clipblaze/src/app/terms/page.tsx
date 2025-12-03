import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function Terms() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last updated: December 2025</p>
        
        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ClipBlaze, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>ClipBlaze provides AI-powered video editing tools that transform long-form videos into short-form content. Features include highlight detection, automatic captions, and video cropping.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activities under it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Content Ownership</h2>
            <p>You retain all rights to your original content. By uploading videos, you grant ClipBlaze a limited license to process your content for the purpose of providing our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to upload content that is illegal, infringes on others&apos; rights, contains malware, or violates any applicable laws. We reserve the right to remove content that violates these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Payment & Refunds</h2>
            <p>Paid subscriptions are billed monthly or annually. We offer a 14-day money-back guarantee for new subscribers. Refund requests can be made through support.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>ClipBlaze is provided &quot;as is&quot; without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of ClipBlaze after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at legal@clipblaze.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
