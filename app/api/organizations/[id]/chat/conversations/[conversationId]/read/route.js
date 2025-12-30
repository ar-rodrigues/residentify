import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * PUT /api/organizations/[id]/chat/conversations/[conversationId]/read
 * Mark all unread messages in a conversation as read
 */
export async function PUT(request, { params }) {
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

    // Verify user is a participant in the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("chat_conversations")
      .select("id, user1_id, user2_id, role_id")
      .eq("id", conversationId)
      .eq("organization_id", id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        {
          error: true,
          message: "Conversación no encontrada.",
        },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isUserToUser = conversation.user2_id !== null && conversation.role_id === null;
    const isRoleConversation = conversation.role_id !== null && conversation.user2_id === null;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'read/route.js:66',message:'Checking participant status',data:{conversationId,userId:user.id,isUserToUser,isRoleConversation,user1Id:conversation.user1_id,user2Id:conversation.user2_id,roleId:conversation.role_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    let isParticipant = false;
    
    if (isUserToUser) {
      // User-to-user conversation: check if user is user1 or user2
      isParticipant = conversation.user1_id === user.id || conversation.user2_id === user.id;
    } else if (isRoleConversation) {
      // Role conversation: check if user is initiator or role member
      if (conversation.user1_id === user.id) {
        // User is the initiator
        isParticipant = true;
      } else {
        // Check if user is a member of the role
        const { data: roleMemberCheck, error: roleMemberError } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", id)
          .eq("user_id", user.id)
          .eq("organization_role_id", conversation.role_id)
          .single();
        
        isParticipant = !roleMemberError && roleMemberCheck !== null;
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'read/route.js:90',message:'Participant check result',data:{isParticipant,isUserToUser,isRoleConversation,isInitiator:conversation.user1_id===user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!isParticipant) {
      return NextResponse.json(
        {
          error: true,
          message: "No eres participante de esta conversación.",
        },
        { status: 403 }
      );
    }

    // Mark all unread messages in this conversation as read
    // For role conversations:
    // - If user is initiator: mark messages where recipient_id = user.id (messages from role members responding to initiator)
    // - If user is role member: mark messages where recipient_id IS NULL (messages from initiator to role)
    // For user-to-user conversations:
    // - Mark messages where recipient_id = user.id
    let updateQuery = supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("organization_id", id)
      .eq("is_read", false);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'read/route.js:95',message:'Before building update query',data:{isRoleConversation,isInitiator:conversation.user1_id===user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (isRoleConversation) {
      if (conversation.user1_id === user.id) {
        // User is initiator: mark messages from role members (recipient_id = user.id, since role members respond to initiator)
        updateQuery = updateQuery.eq("recipient_id", user.id);
      } else {
        // User is role member: mark messages from initiator (recipient_id IS NULL, since initiator sends to role)
        updateQuery = updateQuery.is("recipient_id", null);
      }
    } else {
      // User-to-user conversation: mark messages where recipient_id = user.id
      updateQuery = updateQuery.eq("recipient_id", user.id);
    }

    const { error: updateError } = await updateQuery;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'read/route.js:110',message:'After update query',data:{updateError:updateError?{code:updateError.code,message:updateError.message}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (updateError) {
      console.error("Error marking messages as read:", updateError);
      return NextResponse.json(
        {
          error: true,
          message: "Error al marcar los mensajes como leídos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Mensajes marcados como leídos exitosamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error marking messages as read:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al marcar los mensajes como leídos.",
      },
      { status: 500 }
    );
  }
}



