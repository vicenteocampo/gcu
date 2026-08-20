import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from "@/lib/admin-session";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/questionnaire",
  "/thank-you",
  "/referral",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/referral") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("eligibility_status")
      .eq("id", user.id)
      .single();

    if (profile?.eligibility_status !== "eligible") {
      return NextResponse.redirect(new URL("/thank-you", request.url));
    }
  }

  // Admin auth is a separate email + static 6-digit PIN gate (app/admin/login),
  // not the customer-facing email+OTP flow — checked via a signed cookie,
  // independent of the Supabase user session.
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAdminAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if (isAdminRoute && !isAdminAuthRoute) {
    const adminEmail = verifyAdminSessionValue(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    if (!adminEmail) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/questionnaire/:path*",
    "/thank-you/:path*",
    "/referral/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
