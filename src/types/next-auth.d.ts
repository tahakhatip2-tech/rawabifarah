import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    permissions: string[];
    branchId: string | null;
    businessId: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      permissions: string[];
      branchId: string | null;
      businessId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    branchId: string | null;
    businessId: string | null;
  }
}
