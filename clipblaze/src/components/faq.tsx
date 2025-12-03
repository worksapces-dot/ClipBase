"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What video formats does ClipBlaze support?",
    answer: "ClipBlaze supports MP4, MOV, and WebM formats. You can also paste YouTube links directly and we'll handle the rest.",
  },
  {
    question: "How long can my videos be?",
    answer: "Free users can upload videos up to 30 minutes. Pro and Enterprise users can upload videos up to 60 minutes in length.",
  },
  {
    question: "How accurate are the AI-generated captions?",
    answer: "Our captions achieve 95%+ accuracy for clear English speech using Whisper v3. You can always edit captions before exporting.",
  },
  {
    question: "Can I remove the ClipBlaze watermark?",
    answer: "Yes! Pro and Enterprise plans include watermark-free exports. You can also add your own custom branding.",
  },
  {
    question: "How long does it take to generate clips?",
    answer: "Most clips are ready in under 2 minutes. Processing time depends on video length and the number of clips being generated.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. You can cancel your subscription at any time from your account settings. No questions asked.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact support for a full refund.",
  },
  {
    question: "Is my content safe and private?",
    answer: "Your videos are encrypted and stored securely. We never share your content with third parties and you can delete your data anytime.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-32 relative">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-base">
            Everything you need to know about ClipBlaze
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-white/10 rounded-xl px-6 bg-white/[0.02] data-[state=open]:bg-white/[0.04]"
            >
              <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
