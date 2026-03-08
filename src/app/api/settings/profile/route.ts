import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.role;
  const id = user.id;
  const body = await req.json();
  const { name, email, photoUrl } = body;

  // Validate email uniqueness if changing email
  if (email) {
    const existingTrainer = await prisma.trainer.findFirst({ where: { email, id: { not: id } } });
    const existingClient = await prisma.client.findFirst({ where: { email, id: { not: id } } });
    if (existingTrainer || existingClient) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }
  }

  if (role === "trainer") {
    const updated = await prisma.trainer.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      },
    });
    return NextResponse.json({ trainer: updated });
  } else if (role === "client") {
    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      },
    });
    return NextResponse.json({ client: updated });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
