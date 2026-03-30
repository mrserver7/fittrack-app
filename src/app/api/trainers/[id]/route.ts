import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/trainers/[id] — update trainer fields (admin only) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !(session.user as Record<string, unknown>).isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const trainer = await prisma.trainer.update({ where: { id }, data: body });
  return NextResponse.json({ trainer });
}

/** DELETE /api/trainers/[id] — soft-delete trainer (admin only) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !(session.user as Record<string, unknown>).isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Cannot delete self
  if (session.user!.id === id)
    return NextResponse.json({ error: "You cannot delete your own account here." }, { status: 400 });

  const trainer = await prisma.trainer.findUnique({ where: { id } });
  if (!trainer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trainer.isAdmin) return NextResponse.json({ error: "Cannot delete another admin." }, { status: 400 });

  await prisma.trainer.update({
    where: { id },
    data: { deletedAt: new Date(), status: "archived" },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: session.user!.id!,
      actorRole: "admin",
      action: "trainer.deleted",
      resourceType: "Trainer",
      resourceId: id,
    },
  });

  return NextResponse.json({ success: true });
}
