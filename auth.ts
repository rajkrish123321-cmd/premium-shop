import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser, neonConfigured } from "@/lib/neon";

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

        if (!neonConfigured) return null;
        try {
          const result = await authenticateUser(email, password);
          return {
            id: result.user.id,
            email: result.user.email || email,
            name: result.user.user_metadata?.name || email,
            role: result.user.role,
          };
        } catch (error) {
          console.warn("Supabase credential lookup failed:", error);
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
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = String(token.role ?? "customer");
      }

      return session;
    },
  },
});
