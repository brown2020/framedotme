import { NextResponse } from "next/server";
import { adminAuth } from "@/firebase/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { logger } from "@/utils/logger";

const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { idToken?: unknown }
      | null;

    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_EXPIRES_IN_MS / 1000),
    });
    return response;
  } catch (error) {
    logger.error("Failed to create session cookie", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: "/" });
  return response;
}


