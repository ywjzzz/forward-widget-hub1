import { NextRequest, NextResponse } from "next/server";
import { getBackendDb, getBackendStore } from "@/lib/backend";
import { verifyAdmin } from "@/lib/admin-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verifyAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const db = await getBackendDb();

  const mod = (await db
    .prepare("SELECT id, collection_id, filename FROM modules WHERE id = ?")
    .get(id)) as { id: string; collection_id: string; filename: string } | undefined;

  if (!mod) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.prepare("DELETE FROM modules WHERE id = ?").run(id);
  const store = await getBackendStore();
  await store.remove(mod.collection_id, mod.filename);

  return NextResponse.json({ success: true });
}
