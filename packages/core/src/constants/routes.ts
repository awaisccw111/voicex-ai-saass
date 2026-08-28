export const APP_ROUTES = {
  HOME: "/",
  STUDIO: "/dashboard/studio",
  VOICES: "/#voices",
  CLONING: "/#demo",
  PRICING: "/#pricing",
  API_DOCS: "/docs/api",
  LOGIN: "/login",
  SIGNUP: "/register",
  SETTINGS: "/dashboard/settings",
  PROJECTS: "/dashboard",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
