import * as React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Container,
} from "@saas/ui";
import { PRESET_VOICES, APP_ROUTES } from "@saas/core";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from "@/lib/stripe";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VoiceDemoStudio } from "@/components/voice-demo";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }
  const faqs = [
    {
      question: "What is VOICEX AI and how does neural voiceover work?",
      answer:
        "VOICEX AI is an enterprise neural audio platform that converts written scripts into hyper-realistic human speech. Using Fish Audio acoustic models, it preserves natural breath, dynamic emotion, cadence, and vocal timber.",
    },
    {
      question: "Do I own commercial rights to synthesized audio?",
      answer:
        "Yes! All audio generated on Creator, Pro, and Enterprise plans includes a full commercial license for YouTube monetization, broadcast television, podcasts, video games, and corporate advertising.",
    },
    {
      question: "How are generation credits calculated?",
      answer:
        "Credits are calculated based on script character count: approximately 1 credit per 5 characters (with a minimum of 10 credits per synthesis). 1,000 credits yield approximately 6–8 minutes of studio voiceover.",
    },
    {
      question: "How does zero-shot voice cloning work?",
      answer:
        "You can upload a clean 60-second audio recording of any speaker. Our neural acoustic engine analyzes the vocal timbre and creates an instant replica ready for text synthesis.",
    },
    {
      question: "Can I integrate VOICEX into my own software or backend?",
      answer:
        "Absolutely. We offer a full REST API and WebSocket streaming SDK for Node.js, Python, and Go, allowing developers to generate audio in under 180ms TTFB.",
    },
  ];

  const testimonials = [
    {
      quote:
        "VOICEX cut our audiobook production time by 80%. The emotional range and cadence of voices like Aurora Vance sound indistinguishable from human voice actors.",
      author: "Sarah Jenkins",
      role: "Audiobook Producer & Publisher",
      company: "EchoMedia Books",
      avatarInitials: "SJ",
    },
    {
      quote:
        "We voiced over 40 NPC characters in our open-world indie game using VOICEX. The British and cinematic tones gave our dialogue AAA broadcast quality.",
      author: "Dmitri Vance",
      role: "Lead Game Designer",
      company: "Nexus Interactive",
      avatarInitials: "DV",
    },
    {
      quote:
        "The zero-latency streaming API enabled us to build an interactive AI conversational agent that speaks with ultra-realistic human pauses and intonation.",
      author: "Elena Rostova",
      role: "CTO & Co-Founder",
      company: "SoundWave AI",
      avatarInitials: "ER",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-border/40">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-1/4 w-[450px] h-[280px] bg-accent/15 rounded-full blur-[110px] pointer-events-none -z-10" />

          <Container size="xl" className="text-center flex flex-col items-center">
            {/* Announcement Badge */}
            <div className="mb-6">
              <Badge variant="glow" size="md" dot>
                Powered by Fish Audio S2.1 Pro Engine (83 Languages)
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-5xl leading-[1.1] mb-6">
              Studio-Quality AI Voiceovers in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">
                Any Language & Emotion
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Transform written scripts into broadcast-quality human speech. 120+ lifelike AI voices,
              controllable emotional cadence, and zero-shot voice cloning for creators and enterprises.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center">
              <Link href={APP_ROUTES.SIGNUP} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  fullWidth
                  rightIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  }
                >
                  Get 1,000 Free Credits
                </Button>
              </Link>
              <Link href="#demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" fullWidth>
                  Test Live Studio Demo
                </Button>
              </Link>
            </div>

            {/* Metrics Counter Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mt-16 pt-12 border-t border-border/40 w-full max-w-4xl text-left">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">99.4%</p>
                <p className="text-xs text-muted-foreground">Human Naturalness MOS</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">&lt; 180ms</p>
                <p className="text-xs text-muted-foreground">Streaming TTFB Latency</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">42</p>
                <p className="text-xs text-muted-foreground">Languages & Dialects</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">10M+</p>
                <p className="text-xs text-muted-foreground">Minutes Synthesized</p>
              </div>
            </div>
          </Container>
        </section>

        {/* 2. Interactive Live Studio Demo */}
        <section className="py-16 md:py-24 bg-card/20 border-b border-border/40">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="primary" size="sm" className="mb-3">
                Live Studio Sandbox
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Experience the Voice Engine
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Type your script below, choose an actor, adjust emotional timbre, and preview
                synthetic acoustic output in real time.
              </p>
            </div>

            <VoiceDemoStudio />
          </Container>
        </section>

        {/* 3. How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 border-b border-border/40">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" size="sm" className="mb-3">
                Workflow
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How VOICEX Generates Speech
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Three seamless steps from written text to broadcast-ready master audio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <Card className="border-border/60 bg-card/60 relative">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mb-3">
                    01
                  </div>
                  <CardTitle>Enter or Paste Script</CardTitle>
                  <CardDescription>
                    Provide your script or dialogue text. Add phonetic spelling, adjust delivery
                    speed, and pick emotional nuances like empathetic, whisper, or dramatic.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 2 */}
              <Card className="border-border/60 bg-card/60 relative">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent font-bold text-lg flex items-center justify-center mb-3">
                    02
                  </div>
                  <CardTitle>Pick Neural Voice Actor</CardTitle>
                  <CardDescription>
                    Select from 120+ vocal actors trained across narrative, commercial, podcast, and
                    gaming styles—or clone your own voice in 60 seconds.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 3 */}
              <Card className="border-border/60 bg-card/60 relative">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success font-bold text-lg flex items-center justify-center mb-3">
                    03
                  </div>
                  <CardTitle>Synthesize & Export</CardTitle>
                  <CardDescription>
                    Our BullMQ distributed queue processes the audio through Fish Audio neural
                    models, storing lossless MP3, WAV, or FLAC files on S3 ready for instant download.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </Container>
        </section>

        {/* 4. Voice Catalog Showcase */}
        <section id="voices" className="py-16 md:py-24 bg-card/20 border-b border-border/40">
          <Container size="xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <Badge variant="primary" size="sm" className="mb-3">
                  Voice Catalog
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Curated Acoustic Profiles
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mt-2">
                  Trained on hundreds of hours of high-definition studio audio.
                </p>
              </div>
              <Link href={APP_ROUTES.SIGNUP}>
                <Button variant="ghost" size="sm">
                  View all 120+ voice models →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRESET_VOICES.map((voice) => (
                <Card key={voice.id} hoverable className="border-border/60 bg-card/70 backdrop-blur-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                          {voice.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <CardTitle className="text-base">{voice.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{voice.languageName}</p>
                        </div>
                      </div>
                      <Badge variant={voice.isPremium ? "glow" : "default"} size="sm">
                        {voice.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Specialized for {voice.category} delivery with supported emotions:{" "}
                      {voice.supportedEmotions.join(", ")}.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {voice.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* 5. Enterprise Feature Matrix */}
        <section id="features" className="py-16 md:py-24 border-b border-border/40">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" size="sm" className="mb-3">
                Capabilities
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Engineered for High-Volume Production
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Everything media studios, game developers, and engineering teams need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-border/60 bg-card/60">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle>Real-Time Streaming API</CardTitle>
                  <CardDescription>
                    Stream synthesized audio over WebSocket with under 180ms TTFB for conversational
                    AI agents and virtual assistants.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 bg-card/60">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <CardTitle>Zero-Shot Voice Cloning</CardTitle>
                  <CardDescription>
                    Clone any voice with just 60 seconds of clean reference audio, capturing timbre,
                    inflection, and micro-accents.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/60 bg-card/60">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle>Commercial Monetization</CardTitle>
                  <CardDescription>
                    Full commercial royalty-free rights for broadcast TV, YouTube monetization,
                    video games, audiobooks, and corporate ads.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </Container>
        </section>

        {/* 6. Pricing Matrix (Reflecting Stripe Plans & Credit Packs) */}
        <section id="pricing" className="py-16 md:py-24 bg-card/20 border-b border-border/40">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="primary" size="sm" className="mb-3">
                Transparent Pricing
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple, Predictable Plans
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">
                Start free with 1,000 credits. Upgrade for voice cloning and commercial licensing.
              </p>
            </div>

            {/* Subscription Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
              {/* Free Starter */}
              <Card className="border-border/60 bg-card/60 flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Starter Free</CardTitle>
                    <Badge variant="secondary" size="sm">
                      $0 Free
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-foreground">$0</span>
                    <span className="text-xs text-muted-foreground"> / forever</span>
                  </div>
                  <CardDescription className="text-xs mt-2">
                    Ideal for testing neural speech models and personal experiments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> 1,000 complimentary starter credits
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Standard 120+ Voice Actors
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> MP3 Audio Export
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Non-commercial personal license
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={APP_ROUTES.SIGNUP} className="w-full">
                    <Button variant="outline" size="md" fullWidth>
                      Get Started Free
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Creator Plan */}
              <Card className="border-primary shadow-glow bg-card/90 flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="glow" size="sm">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{SUBSCRIPTION_PLANS.CREATOR.name}</CardTitle>
                    <Badge variant="primary" size="sm">
                      Monthly
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-foreground">
                      ${SUBSCRIPTION_PLANS.CREATOR.priceMonthlyUsd}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <CardDescription className="text-xs mt-2">
                    For YouTubers, podcasters, and content creators.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {SUBSCRIPTION_PLANS.CREATOR.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <span className="text-primary font-bold">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={APP_ROUTES.SIGNUP} className="w-full">
                    <Button variant="primary" size="md" fullWidth>
                      Start Creator Plan
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Pro Studio Plan */}
              <Card className="border-border/60 bg-card/60 flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{SUBSCRIPTION_PLANS.PRO.name}</CardTitle>
                    <Badge variant="secondary" size="sm">
                      Studio
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-foreground">
                      ${SUBSCRIPTION_PLANS.PRO.priceMonthlyUsd}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                  <CardDescription className="text-xs mt-2">
                    For audio production studios, game devs, and agencies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {SUBSCRIPTION_PLANS.PRO.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <span className="text-primary font-bold">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={APP_ROUTES.SIGNUP} className="w-full">
                    <Button variant="secondary" size="md" fullWidth>
                      Get Pro Studio
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>

            {/* One-Time Credit Packs Row */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Need extra characters without a monthly subscription?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    One-time credit packs never expire. Add synthesis characters as you need them.
                  </p>
                </div>
                <Link href={APP_ROUTES.SIGNUP}>
                  <Button variant="outline" size="sm">
                    View Credit Packs →
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{pack.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {pack.credits.toLocaleString()} credits
                      </p>
                    </div>
                    <span className="font-bold text-primary font-mono text-sm">
                      ${pack.priceUsd}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* 7. Social Proof & Testimonials */}
        <section className="py-16 md:py-24 border-b border-border/40">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="secondary" size="sm" className="mb-3">
                Testimonials
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trusted by Top Creators & Studios
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item) => (
                <Card key={item.author} className="border-border/60 bg-card/60 flex flex-col justify-between">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {item.avatarInitials}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{item.author}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.role} • {item.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* 8. Frequently Asked Questions (FAQ) */}
        <section id="faqs" className="py-16 md:py-24 bg-card/20 border-b border-border/40">
          <Container size="lg">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="primary" size="sm" className="mb-3">
                FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.question} className="border-border/60 bg-card/60 p-6">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* 9. High-Conversion Final CTA Banner */}
        <section className="py-20 bg-gradient-to-b from-card/30 to-background">
          <Container size="lg">
            <div className="p-8 md:p-14 rounded-3xl border border-primary/40 bg-gradient-to-r from-primary/15 via-accent/15 to-card/50 relative overflow-hidden text-center shadow-glow">
              <div className="max-w-2xl mx-auto space-y-6">
                <Badge variant="glow" size="sm">
                  Start Synthesizing Now
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Ready to elevate your audio content?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Claim your free 1,000 credits upon sign-up and experience broadcast-grade neural
                  voiceover synthesis in seconds.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link href={APP_ROUTES.SIGNUP}>
                    <Button size="lg" variant="primary">
                      Create Free Account (1,000 Credits)
                    </Button>
                  </Link>
                  <Link href="#pricing">
                    <Button size="lg" variant="secondary">
                      Compare Plans & Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
