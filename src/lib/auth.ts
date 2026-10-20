import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const isDevLoginEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_DEV_LOGIN === "true";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/webmasters.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    ...(isDevLoginEnabled
      ? [
          CredentialsProvider({
            id: "dev",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "text", placeholder: "you@example.com" },
            },
            async authorize(credentials) {
              const email = credentials?.email?.trim().toLowerCase();
              if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
              const name = email.split("@")[0];
              const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email, name },
              });
              return { id: user.id, email: user.email, name: user.name };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      return session;
    },
  },
};
