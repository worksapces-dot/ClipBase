import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function Privacy() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: December 2025</p>
        
        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, and payment information when you create an account or subscribe to our services. We also collect video content you upload for processing.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve our services, process your videos, communicate with you about your account, and send you updates about ClipBlaze.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage & Security</h2>
            <p>Your videos are encrypted during upload and storage. We use industry-standard security measures to protect your data. Videos are automatically deleted 30 days after processing unless you choose to keep them.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We use trusted third-party services for payment processing (Stripe), cloud storage (AWS), and analytics. These services have their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You can access, update, or delete your personal data at any time from your account settings. You can also request a complete export of your data by contacting support.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p>We use essential cookies to keep you logged in and remember your preferences. We also use analytics cookies to understand how you use our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at privacy@clipblaze.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
