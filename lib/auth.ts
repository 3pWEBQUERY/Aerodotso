import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "E-Mail und Passwort",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const supabase = createSupabaseServerClient();

        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, password_hash, name, avatar_url")
          .eq("email", credentials.email)
          .single();

        if (error || !user) {
          return null;
        }

        const isValid = await compare(
          credentials.password,
          (user as any).password_hash as string
        );

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email as string,
          name: (user as any).name as string | null,
          image: (user as any).avatar_url as string | null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
