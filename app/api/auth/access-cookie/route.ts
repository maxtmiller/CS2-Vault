import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json({ error: "Missing cookie name" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(name) || null;

  let value = null;
  if (cookie) value = cookie.value;

  return Response.json({ name, value });
}