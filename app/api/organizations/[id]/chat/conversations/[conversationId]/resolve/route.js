import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/organizations/[id]/chat/conversations/[conversationId]/resolve
 * Request resolution for a conversation
 */
export async function POST(request, { params }) {
  try {
    const { id, conversationId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { resolutionNote } = body;

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: true,
          message: "No estás autenticado. Por favor, inicia sesión.",
        },
        { status: 401 }
      );
    }

    // Check if user is member of organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres miembro de esta organización.",
        },
        { status: 403 }
      );
    }

    // Request resolution
    const { data: requestId, error: requestError } = await supabase.rpc(
      "request_conversation_resolution",
      {
        p_conversation_id: conversationId,
        p_user_id: user.id,
        p_resolution_note: resolutionNote || null,
      }
    );

    if (requestError) {
      console.error("Error requesting resolution:", requestError);
      return NextResponse.json(
        {
          error: true,
          message:
            requestError.message || "Error al solicitar la resolución.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          requestId,
        },
        message: "Solicitud de resolución enviada exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error requesting resolution:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al solicitar la resolución.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]/chat/conversations/[conversationId]/resolve
 * Approve or reject a resolution request
 */
export async function PUT(request, { params }) {
  try {
    const { id, conversationId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { requestId, action } = body; // action: 'approve' | 'reject'

    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: true,
          message: "requestId y action (approve/reject) son requeridos.",
        },
        { status: 400 }
      );
    }

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: true,
          message: "No estás autenticado. Por favor, inicia sesión.",
        },
        { status: 401 }
      );
    }

    // Check if user is member of organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres miembro de esta organización.",
        },
        { status: 403 }
      );
    }

    // Approve or reject
    const functionName =
      action === "approve"
        ? "approve_conversation_resolution"
        : "reject_conversation_resolution";
    const paramName = action === "approve" ? "p_approver_id" : "p_rejector_id";

    const { data: success, error: actionError } = await supabase.rpc(
      functionName,
      {
        p_request_id: requestId,
        [paramName]: user.id,
      }
    );

    if (actionError) {
      console.error(`Error ${action}ing resolution:`, actionError);
      return NextResponse.json(
        {
          error: true,
          message:
            actionError.message ||
            `Error al ${action === "approve" ? "aprobar" : "rechazar"} la resolución.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        data: {
          success,
        },
        message: `Resolución ${action === "approve" ? "aprobada" : "rechazada"} exitosamente.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error processing resolution:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al procesar la resolución.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/[id]/chat/conversations/[conversationId]/resolve
 * Get resolution status for a conversation
 */
export async function GET(request, { params }) {
  try {
    const { id, conversationId } = await params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: true,
          message: "No estás autenticado. Por favor, inicia sesión.",
        },
        { status: 401 }
      );
    }

    // Check if user is member of organization
    const { data: memberCheck, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres miembro de esta organización.",
        },
        { status: 403 }
      );
    }

    // Get pending resolution requests
    const { data: requests, error: requestsError } = await supabase
      .from("chat_conversation_resolution_requests")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching resolution requests:", requestsError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al obtener el estado de resolución.",
        },
        { status: 500 }
      );
    }

    // Get requester names
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req) => {
        let requesterName = null;
        try {
          const { data: name, error: nameError } = await supabase.rpc(
            "get_user_name",
            {
              p_user_id: req.requested_by,
            }
          );
          if (!nameError && name && typeof name === "string") {
            requesterName = name.trim();
          }
        } catch (err) {
          // Silently fail
        }
        return {
          ...req,
          requesterName,
        };
      })
    );

    return NextResponse.json(
      {
        error: false,
        data: {
          requests: enrichedRequests,
        },
        message: "Estado de resolución obtenido exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error fetching resolution status:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al obtener el estado de resolución.",
      },
      { status: 500 }
    );
  }
}
