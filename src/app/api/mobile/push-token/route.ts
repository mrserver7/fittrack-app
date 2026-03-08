import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (user.role === "trainer") {
    await prisma.trainer.update({ where: { id: user.id }, data: { pushToken: token } });
  } else if (user.role === "client") {
    await prisma.client.update({ where: { id: user.id }, data: { pushToken: token } });
  }

  return NextResponse.json({ ok: true });
}
