import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OFFICIAL_VOICES = [
  {
    fishAudioId: "b347db033a6549378b48d00acb0d06cd",
    name: "Selene",
    gender: "female",
    category: "meditation",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Meditative", "Calm", "Soft", "Mindfulness"],
    previewAudioUrl: "/audio/previews/selene.mp3",
    avatarUrl: "/avatars/selene.webp",
    isPremium: true,
    isActive: true,
    order: 1,
  },
  {
    fishAudioId: "bf322df2096a46f18c579d0baa36f41d",
    name: "Adrian",
    gender: "male",
    category: "narrative",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Steady", "Reliable Narrator", "Audiobook", "Documentary"],
    previewAudioUrl: "/audio/previews/adrian.mp3",
    avatarUrl: "/avatars/adrian.webp",
    isPremium: true,
    isActive: true,
    order: 2,
  },
  {
    fishAudioId: "933563129e564b19a115bedd57b7406a",
    name: "Sarah",
    gender: "female",
    category: "commercial",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Engaged Speaker", "Commercial", "Upbeat", "Social Media"],
    previewAudioUrl: "/audio/previews/sarah.mp3",
    avatarUrl: "/avatars/sarah.webp",
    isPremium: true,
    isActive: true,
    order: 3,
  },
  {
    fishAudioId: "536d3a5e000945adb7038665781a4aca",
    name: "Ethan",
    gender: "male",
    category: "educational",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Curious Explainer", "Tech", "E-Learning", "Clear"],
    previewAudioUrl: "/audio/previews/ethan.mp3",
    avatarUrl: "/avatars/ethan.webp",
    isPremium: true,
    isActive: true,
    order: 4,
  },
  {
    fishAudioId: "e3cd384158934cc9a01029cd7d278634",
    name: "Laura",
    gender: "female",
    category: "executive",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Confident Narrator", "Executive", "Corporate", "Presentation"],
    previewAudioUrl: "/audio/previews/laura.mp3",
    avatarUrl: "/avatars/laura.webp",
    isPremium: true,
    isActive: true,
    order: 5,
  },
  {
    fishAudioId: "79d0bd3e4e5444b18f7b6d89b5927bf1",
    name: "Jordan",
    gender: "male",
    category: "commercial",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Motivational Speaker", "Dynamic", "Inspiring", "Podcast"],
    previewAudioUrl: "/audio/previews/jordan.mp3",
    avatarUrl: "/avatars/jordan.webp",
    isPremium: true,
    isActive: true,
    order: 6,
  },
  {
    fishAudioId: "9a9cf47702da476aa4629e2506d4a857",
    name: "Hannah",
    gender: "female",
    category: "conversational",
    language: "en-US",
    languageName: "English (United States) 🇺🇸",
    tags: ["Conversation Specialist", "Friendly", "Warm", "Podcast"],
    previewAudioUrl: "/audio/previews/hannah.mp3",
    avatarUrl: "/avatars/hannah.webp",
    isPremium: true,
    isActive: true,
    order: 7,
  },
];

async function main() {
  // eslint-disable-next-line no-console
  console.log("Seeding verified Fish Audio platform voices...");

  for (const voice of OFFICIAL_VOICES) {
    await prisma.platformVoice.upsert({
      where: { fishAudioId: voice.fishAudioId },
      update: { ...voice },
      create: { ...voice },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seeding complete! 7 official voices registered in Azure PostgreSQL.");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
