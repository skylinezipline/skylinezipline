import { withAuth } from "next-auth/middleware"

export default withAuth

export const config = {
  matcher: [
    "/ops/:path*",
    "/admin/:path*",
    "/marketing/:path*",
    "/onboarding",
  ],
}
