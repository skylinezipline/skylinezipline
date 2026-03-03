import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials for internal staff login
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "guide@skylinezipline.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: validate against database
        // In production: look up user in DB, compare hashed password
        if (!credentials?.email || !credentials?.password) return null;

        // Demo credentials for development
        if (
          credentials.email === "admin@skylinezipline.com" &&
          credentials.password === "demo1234"
        ) {
          return {
            id: "1",
            email: credentials.email,
            name: "Mike Torres",
            role: "ADMIN",
          };
        }
        return null;
      },
    }),
    // Google OAuth for staff (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
