import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser, neonConfigured } from "@/lib/neon";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "trendyjewellery62@gmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-me",
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          return { id: `admin-${email}`, email, name: "Store Administrator", role: "admin" };
        }

        if (!neonConfigured) return null;
        try {
          const result = await authenticateUser(email, password);
          return { id: result.user.id, email: result.user.email || email, name: result.user.user_metadata?.name || email, role: result.user.role || (email === ADMIN_EMAIL ? "admin" : "customer") };
        } catch (error) {
          console.warn("Neon credential lookup failed:", error);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "customer";
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = String(token.role ?? "customer");
        session.user.name = token.name;
        session.user.email = token.email;
      }

      return session;
    },
  },
});
