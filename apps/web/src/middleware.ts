import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // If authenticated user visits home or auth pages, redirect directly to dashboard
    if (token && (path === "/" || path === "/login" || path === "/register" || path.startsWith("/auth"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Security headers
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );

    return response;
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Protect private dashboard and studio routes
        if (
          path.startsWith("/dashboard") ||
          path.startsWith("/studio") ||
          path.startsWith("/settings")
        ) {
          return Boolean(token);
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/auth/:path*",
    "/dashboard/:path*",
    "/studio/:path*",
    "/settings/:path*",
  ],
};
