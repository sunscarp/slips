import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getRole(request: NextRequest): string | null {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8")
    );
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRole(request);

  // /system/admin — only role "admin"
  if (pathname.startsWith("/system/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // /admin/* — only role "admin" or "salon"
  if (pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "salon") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/system/admin/:path*"],
};
