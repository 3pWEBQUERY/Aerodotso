import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "E-Mail und Passwort (mind. 8 Zeichen) sind erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Für diese E-Mail existiert bereits ein Konto." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash })
      .select("id, email")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json(
      { error: "Interner Fehler bei der Registrierung." },
      { status: 500 }
    );
  }
}
