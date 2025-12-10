import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 * Handle OAuth callback from Supabase Auth
 * 
 * This route is called after a user completes OAuth login (e.g., Google, GitHub)
 * It exchanges the authorization code for a session
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Kein Autorisierungscode erhalten")}`
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Session exchange error:", exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Authentifizierung fehlgeschlagen")}`
      );
    }

    // Check if user profile exists, create if not
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create one
        const { error: createError } = await supabase.from("profiles").insert({
          id: data.user.id,
          role: "student", // Default role
          display_name: data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name ||
                        data.user.email?.split("@")[0],
        });

        if (createError) {
          console.error("Profile creation error:", createError);
          // Continue anyway, profile can be created later
        }
      }
    }

    // Redirect to the intended destination
    const redirectUrl = new URL(next, origin);
    
    // Ensure we're not redirecting to an external URL
    if (redirectUrl.origin !== origin) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Ein unerwarteter Fehler ist aufgetreten")}`
    );
  }
}
