import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const isAdmin = (session.user as Record<string, unknown>).isAdmin as boolean;
  const id = session.user.id!;

  if (role === "trainer") {
    if (isAdmin) return NextResponse.json({ error: "Admin account cannot be deleted." }, { status: 403 });
    await prisma.trainer.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
  } else if (role === "client") {
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived" },
    });
  } else {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
