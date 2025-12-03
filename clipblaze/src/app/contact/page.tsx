"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Contact() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-muted-foreground">Have a question or feedback? We&apos;d love to hear from you.</p>
        </div>
        
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First name</label>
              <Input 
                placeholder="John" 
                className="bg-white/5 border-white/10 focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last name</label>
              <Input 
                placeholder="Doe" 
                className="bg-white/5 border-white/10 focus:border-white/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input 
              type="email" 
              placeholder="john@example.com" 
              className="bg-white/5 border-white/10 focus:border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input 
              placeholder="How can we help?" 
              className="bg-white/5 border-white/10 focus:border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea 
              rows={5}
              placeholder="Tell us more about your question..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:border-white/20 focus:outline-none resize-none"
            />
          </div>

          <Button className="w-full bg-white text-black hover:bg-white/90">
            Send Message
          </Button>
        </form>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl mb-2">📧</div>
            <h3 className="font-semibold mb-1">Email</h3>
            <p className="text-sm text-muted-foreground">support@clipblaze.com</p>
          </div>
          <div>
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-1">Live Chat</h3>
            <p className="text-sm text-muted-foreground">Available 9am-6pm EST</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🐦</div>
            <h3 className="font-semibold mb-1">Twitter</h3>
            <p className="text-sm text-muted-foreground">@clipblaze</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
