"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Avatar,
  Input,
  Button,
  Spin,
  Empty,
  Badge,
  App,
  Tag,
  Drawer,
  Typography,
} from "antd";
import {
  RiSendPlaneLine,
  RiUserLine,
  RiSearchLine,
  RiArrowLeftLine,
  RiUserSettingsLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";
import { createClient } from "@/utils/supabase/client";
import { getRoleConfig } from "@/config/roles";
import ChatPermissionsSettings from "@/app/[locale]/(private)/organizations/[id]/_components/widgets/residential/ChatPermissionsSettings";
import ResolutionRequestBanner from "@/components/organizations/chat/ResolutionRequestBanner";
import ResolutionActions from "@/components/organizations/chat/ResolutionActions";
import ConversationStatusBadge from "@/components/organizations/chat/ConversationStatusBadge";

const { TextArea } = Input;

export default function ChatWidget({ organizationId }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const { data: currentUser } = useUser();
  const isMobile = useIsMobile();
  const { isAdmin } = useOrganizationAuth();
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState([]);
  const [roleConversations, setRoleConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageSenderNames, setMessageSenderNames] = useState({}); // Map of sender_id -> name
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRoleConversations, setLoadingRoleConversations] =
    useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [temporaryConversation, setTemporaryConversation] = useState(null);
  const [showConversationsList, setShowConversationsList] = useState(!isMobile);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [conversationStatusFilter, setConversationStatusFilter] =
    useState("active"); // active, resolved, archived
  const [conversationDetails, setConversationDetails] = useState(null); // For role conversations

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const conversationsChannelRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations?limit=50&offset=0`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(
          result.message || "Error al obtener las conversaciones"
        );
      }

      setConversations(result.data?.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      message.error(error.message || "Error al obtener las conversaciones");
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentUser?.id, message]);

  // Silent fetch conversations without loading state (for real-time updates)
  const fetchConversationsSilently = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/conversations?limit=50&offset=0`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        // Silently fail - don't show error for background updates
        return;
      }

      setConversations(result.data?.conversations || []);
    } catch (error) {
      // Silently fail - don't show error for background updates
      console.error("Error silently fetching conversations:", error);
    }
  }, [organizationId, currentUser?.id]);

  // Fetch role conversations
  const fetchRoleConversations = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      setLoadingRoleConversations(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/role-conversations?limit=50&offset=0&status=${conversationStatusFilter}`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(
          result.message || "Error al obtener las conversaciones de rol"
        );
      }

      setRoleConversations(result.data?.roleConversations || []);
    } catch (error) {
      console.error("Error fetching role conversations:", error);
      message.error(
        error.message || "Error al obtener las conversaciones de rol"
      );
    } finally {
      setLoadingRoleConversations(false);
    }
  }, [organizationId, currentUser?.id, conversationStatusFilter, message]);

  // Silent fetch role conversations without loading state (for real-time updates)
  const fetchRoleConversationsSilently = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/role-conversations?limit=50&offset=0&status=${conversationStatusFilter}`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        return;
      }

      setRoleConversations(result.data?.roleConversations || []);
    } catch (error) {
      console.error("Error silently fetching role conversations:", error);
    }
  }, [organizationId, currentUser?.id, conversationStatusFilter]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/members?limit=100&offset=0`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al obtener los miembros");
      }

      // Filter out current user
      const filteredMembers = (result.data?.members || []).filter(
        (member) => member.userId !== currentUser.id
      );
      setMembers(filteredMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
      message.error(error.message || "Error al obtener los miembros");
    }
  }, [organizationId, currentUser?.id, message]);

  // Fetch available roles
  const fetchAvailableRoles = useCallback(async () => {
    if (!organizationId || !currentUser?.id) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/roles`
      );
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(
          result.message || "Error al obtener los roles disponibles"
        );
      }

      setAvailableRoles(result.data?.roles || []);
    } catch (error) {
      console.error("Error fetching available roles:", error);
      // Don't show error message for roles - it's not critical
    }
  }, [organizationId, currentUser?.id]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!conversationId || !organizationId || !currentUser?.id) return;

      try {
        setLoadingMessages(true);

        // Query messages directly from Supabase
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw new Error(
            messagesError.message || "Error al obtener los mensajes"
          );
        }

        setMessages(messagesData || []);

        // For role conversations, fetch sender names for messages from role members
        if (selectedConversation?.type === "role") {
          const senderIds = new Set(
            (messagesData || [])
              .filter((msg) => msg.sender_id !== currentUser.id)
              .map((msg) => msg.sender_id)
          );

          if (senderIds.size > 0) {
            const namesMap = {};
            await Promise.all(
              Array.from(senderIds).map(async (senderId) => {
                try {
                  const { data: userName, error: rpcError } =
                    await supabase.rpc("get_user_name", {
                      p_user_id: senderId,
                    });

                  if (!rpcError && userName && typeof userName === "string") {
                    namesMap[senderId] = userName.trim();
                  }
                } catch (err) {
                  console.error(
                    `Error fetching sender name for ${senderId}:`,
                    err
                  );
                }
              })
            );
            setMessageSenderNames(namesMap);
          } else {
            setMessageSenderNames({});
          }
        } else {
          setMessageSenderNames({});
        }

        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
        message.error(error.message || "Error al obtener los mensajes");
      } finally {
        setLoadingMessages(false);
      }
    },
    [
      organizationId,
      currentUser?.id,
      supabase,
      message,
      scrollToBottom,
      selectedConversation,
    ]
  );

  // Mark all unread messages in a conversation as read
  const markConversationAsRead = useCallback(
    async (conversationId) => {
      if (!conversationId || !organizationId || !currentUser?.id) return;

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/chat/conversations/${conversationId}/read`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
          // Silently fail - don't show error for background operation
          console.error("Error marking conversation as read:", result.message);
          return;
        }

        // Update local conversations state to set unreadCount to 0
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      } catch (error) {
        // Silently fail - don't show error for background operation
        console.error("Error marking conversation as read:", error);
      }
    },
    [organizationId, currentUser?.id]
  );

  // Check if user can message another user
  const checkCanMessage = useCallback(
    async (recipientId) => {
      if (!recipientId || !organizationId || !currentUser?.id) return false;

      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/chat/permissions/check?userId=${recipientId}`
        );
        const result = await response.json();

        if (!response.ok || result.error) {
          return false;
        }

        return result.data?.canMessage || false;
      } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
      }
    },
    [organizationId, currentUser?.id]
  );

  // Check if user can message a role
  const checkCanMessageRole = useCallback(
    async (roleId) => {
      if (!roleId || !organizationId || !currentUser?.id) return false;

      try {
        const { data: canMessage, error: permissionError } = await supabase.rpc(
          "can_user_message_role",
          {
            p_user_id: currentUser.id,
            p_role_id: roleId,
            p_organization_id: organizationId,
          }
        );

        if (permissionError) {
          console.error("Error checking role permissions:", permissionError);
          return false;
        }

        return canMessage || false;
      } catch (error) {
        console.error("Error checking role permissions:", error);
        return false;
      }
    },
    [organizationId, currentUser?.id, supabase]
  );

  const sendMessage = useCallback(async () => {
    if (!messageContent.trim() || !selectedConversation || sending) {
      return;
    }

    const isRoleConversation = selectedConversation.type === "role";
    const recipientId = selectedConversation.otherUserId;
    const conversationId = selectedConversation.id;
    const roleId = selectedConversation.roleId;

    // For user-to-user conversations, check permissions
    if (!isRoleConversation) {
      if (!recipientId) return;

      // Check permissions before attempting to send
      const canMessage = await checkCanMessage(recipientId);
      if (!canMessage) {
        message.error("No tienes permiso para enviar mensajes a este usuario.");
        // Close the conversation if permission is denied
        setSelectedConversation(null);
        setTemporaryConversation(null);
        setMessages([]);
        return;
      }
    }

    const isTemporary = selectedConversation.isTemporary;
    const contentToSend = messageContent.trim();
    const tempMessageId = `temp-${Date.now()}`;

    // Determine recipient_id for optimistic message
    // For role conversations:
    // - If user is initiator: recipient_id is null (sending to role)
    // - If user is role member: recipient_id is userId (the initiator's ID)
    let optimisticRecipientId = recipientId || null;
    if (isRoleConversation && selectedConversation.userId) {
      // Check if current user is the initiator
      const isInitiator = selectedConversation.userId === currentUser?.id;
      if (isInitiator) {
        // Initiator sending to role: recipient_id is null
        optimisticRecipientId = null;
      } else {
        // Role member responding: recipient_id is the initiator's ID
        optimisticRecipientId = selectedConversation.userId;
      }
    }

    // Optimistic update: add message immediately to UI
    const optimisticMessage = {
      id: tempMessageId,
      sender_id: currentUser?.id,
      recipient_id: optimisticRecipientId,
      content: contentToSend,
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageContent("");
    setTimeout(scrollToBottom, 100);

    try {
      setSending(true);

      // Build request body based on conversation type
      const requestBody = {
        content: contentToSend,
      };

      if (isRoleConversation) {
        if (conversationId) {
          requestBody.conversationId = conversationId;
        } else if (roleId) {
          requestBody.roleId = roleId;
        }
      } else {
        requestBody.recipientId = recipientId;
      }

      const response = await fetch(
        `/api/organizations/${organizationId}/chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Error al enviar el mensaje");
      }

      // Clear temporary conversation as it's now persisted
      if (isTemporary) {
        setTemporaryConversation(null);
      }

      // Real-time subscription will update the optimistic message with the real one
      // Real-time subscription will also update conversations list silently
      // No need to manually refresh - real-time handles it

      // If it was a temporary conversation, select the real one now
      if (isTemporary) {
        // Use the conversationId returned directly by the API
        const newConversationId = result.data?.conversationId;
        
        if (newConversationId) {
          // Transition the temporary conversation to a real one immediately
          const realConv = {
            ...selectedConversation,
            id: newConversationId,
            isTemporary: false,
            lastMessage: contentToSend,
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: currentUser?.id,
          };

          setSelectedConversation(realConv);
          
          // Refresh lists in background
          fetchConversationsSilently();
          fetchRoleConversationsSilently();
          
          // Fetch initial messages for the new real ID
          await fetchMessages(newConversationId);
        } else {
          // Fallback: search in lists if API didn't return ID (shouldn't happen)
          setTimeout(async () => {
          if (isRoleConversation) {
            const response = await fetch(
              `/api/organizations/${organizationId}/chat/role-conversations?limit=50&offset=0&status=${conversationStatusFilter}`
            );
            const updatedConvs = await response.json();

            const newConv = updatedConvs.data?.roleConversations?.find(
              (conv) =>
                conv.roleId === roleId && conv.userId === currentUser?.id
            );

            if (newConv) {
              setSelectedConversation(newConv);
              await fetchMessages(newConv.id);
            }
          }
        }, 500);
      }
    }
  } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      setMessageContent(contentToSend); // Restore message content
      console.error("Error sending message:", error);
      message.error(error.message || "Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  }, [
    messageContent,
    selectedConversation,
    organizationId,
    sending,
    message,
    scrollToBottom,
    fetchMessages,
    currentUser?.id,
    checkCanMessage,
    conversationStatusFilter,
  ]);

  // Start conversation with a member
  const startConversation = useCallback(
    async (member) => {
      if (!member.userId) return;

      // Check if conversation already exists
      const existingConv = conversations.find(
        (conv) => conv.otherUserId === member.userId
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        await fetchMessages(existingConv.id);
        setShowMembers(false);
        setTemporaryConversation(null);
        return;
      }

      // Create temporary conversation entry
      const tempConv = {
        id: null,
        otherUserId: member.userId,
        otherUserName: member.fullName || "Usuario",
        otherUserAvatar: null,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        isTemporary: true,
      };

      setTemporaryConversation(tempConv);
      setSelectedConversation(tempConv);
      setMessages([]);
      setShowMembers(false);
    },
    [conversations, fetchMessages]
  );

  // Start conversation with a role
  const startRoleConversation = useCallback(
    async (role) => {
      if (!role.id) return;

      // Check if role conversation already exists
      const existingConv = roleConversations.find(
        (conv) => conv.roleId === role.id && conv.userId === currentUser?.id
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        await fetchMessages(existingConv.id);
        setShowMembers(false);
        setTemporaryConversation(null);
        return;
      }

      // Create temporary role conversation entry
      const tempConv = {
        id: null,
        type: "role",
        roleId: role.id,
        roleName: role.name,
        userId: currentUser?.id,
        userName: currentUser?.fullName || "Usuario",
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
        isTemporary: true,
      };

      setTemporaryConversation(tempConv);
      setSelectedConversation(tempConv);
      setMessages([]);
      setShowMembers(false);
    },
    [roleConversations, fetchMessages, currentUser?.id]
  );

  // Set up realtime subscription for messages
  useEffect(() => {
    // Clean up previous subscription if conversation changes
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (
      !selectedConversation?.id ||
      selectedConversation?.isTemporary ||
      !currentUser?.id ||
      !organizationId
    ) {
      return;
    }

    const channelName = `chat-messages-${selectedConversation.id}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new;
          
          if (newMessage.conversation_id !== selectedConversation.id) {
            return;
          }

          // Format the new message
          const formattedMessage = {
            id: newMessage.id,
            sender_id: newMessage.sender_id,
            recipient_id: newMessage.recipient_id,
            content: newMessage.content,
            is_read: newMessage.is_read,
            created_at: newMessage.created_at,
          };

          setMessages((prev) => {
            // Check if message already exists by real ID (avoid duplicates)
            if (
              prev.some((msg) => msg.id === newMessage.id && !msg.isOptimistic)
            ) {
              return prev;
            }

            // If this is our own message, try to replace optimistic one
            if (newMessage.sender_id === currentUser.id) {
              const optimisticIndex = prev.findIndex(
                (msg) =>
                  msg.isOptimistic &&
                  msg.sender_id === currentUser.id &&
                  msg.content === newMessage.content
              );
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = formattedMessage;
                return updated;
              }
              const hasSameContent = prev.some(
                (msg) =>
                  msg.sender_id === currentUser.id &&
                  msg.content === newMessage.content &&
                  !msg.isOptimistic
              );
              if (hasSameContent) {
                return prev;
              }
            }

            return [...prev, formattedMessage];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    selectedConversation?.id,
    selectedConversation?.isTemporary,
    currentUser?.id,
    organizationId,
    supabase,
    // scrollToBottom removed to avoid unnecessary re-subscriptions
  ]);

  // Set up organization-level realtime subscription for conversations list
  useEffect(() => {
    if (!organizationId || !currentUser?.id) {
      return;
    }

    const channelName = `chat-conversations-${organizationId}-${currentUser.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        async (payload) => {
          const newMessage = payload.new;

          // Only update conversations if the message involves the current user
          if (
            newMessage.sender_id === currentUser.id ||
            newMessage.recipient_id === currentUser.id
          ) {
            // Check if this message belongs to a role conversation by querying the conversation
            // We can't rely on recipient_id alone because:
            // - When initiator sends to role: recipient_id IS NULL
            // - When role member responds: recipient_id = initiator's user_id (not null!)
            let isRoleConversation = false;
            try {
              const { data: conversation } = await supabase
                .from("chat_conversations")
                .select("id, role_id, user2_id")
                .eq("id", newMessage.conversation_id)
                .single();
              
              // It's a role conversation if role_id is not null and user2_id is null
              isRoleConversation = conversation?.role_id !== null && conversation?.user2_id === null;
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatWidget.js:745',message:'Checked conversation type',data:{conversationId:newMessage.conversation_id,isRoleConversation,roleId:conversation?.role_id,user2Id:conversation?.user2_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
            } catch (error) {
              // If we can't check, default to checking recipient_id (fallback)
              isRoleConversation = newMessage.recipient_id === null;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/24baa257-7894-45ed-901b-0624624cf8ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatWidget.js:752',message:'Error checking conversation type, using fallback',data:{error:error.message,isRoleConversation},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
            }

            if (isRoleConversation) {
              // Handle role conversation update
              // Refresh both role conversations (for role members) and regular conversations (for initiators)
              fetchRoleConversationsSilently();
              fetchConversationsSilently(); // Also refresh regular list in case user is initiator
            } else {
              // Handle user-to-user conversation update
              // Only update if it's NOT a role conversation to avoid duplicates
              setConversations((prev) => {
                // Find the conversation that this message belongs to
                const otherUserId =
                  newMessage.sender_id === currentUser.id
                    ? newMessage.recipient_id
                    : newMessage.sender_id;

                const existingIndex = prev.findIndex(
                  (conv) => conv.otherUserId === otherUserId && conv.type !== "role"
                );

                if (existingIndex !== -1) {
                  // Update existing conversation
                  const updated = [...prev];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    lastMessage: newMessage.content,
                    lastMessageTime: newMessage.created_at,
                    unreadCount:
                      newMessage.sender_id === currentUser.id
                        ? updated[existingIndex].unreadCount
                        : (updated[existingIndex].unreadCount || 0) + 1,
                  };
                  // Move updated conversation to top
                  const [updatedConv] = updated.splice(existingIndex, 1);
                  return [updatedConv, ...updated];
                } else {
                  // New conversation - fetch silently to get full conversation data
                  fetchConversationsSilently();
                  return prev;
                }
              });
            }
          } else {
            // Message doesn't directly involve current user, but might be a role conversation
            // where current user is a role member. Check the conversation type
            try {
              const { data: conversation } = await supabase
                .from("chat_conversations")
                .select("id, role_id, user2_id")
                .eq("id", newMessage.conversation_id)
                .single();
              
              const isRoleConversation = conversation?.role_id !== null && conversation?.user2_id === null;
              if (isRoleConversation) {
                fetchRoleConversationsSilently();
              }
            } catch (error) {
              // Silently fail - don't update if we can't determine
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new;
          const oldMessage = payload.old;
          // If a message was marked as read (is_read changed from false to true)
          // and the current user is the recipient, update the unread count
          if (
            updatedMessage.recipient_id === currentUser.id &&
            oldMessage.is_read === false &&
            updatedMessage.is_read === true
          ) {
            // Silently refetch conversations to get updated unread counts
            fetchConversationsSilently();
            // Also refresh role conversations in case this is a role conversation
            fetchRoleConversationsSilently();
          }
          // Also handle role conversations where recipient_id is null (user sending to role)
          // When a role member marks a message as read, we need to refresh role conversations
          if (
            updatedMessage.recipient_id === null &&
            oldMessage.is_read === false &&
            updatedMessage.is_read === true
          ) {
            fetchRoleConversationsSilently();
          }
        }
      )
      .subscribe();

    conversationsChannelRef.current = channel;

    return () => {
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current);
        conversationsChannelRef.current = null;
      }
    };
  }, [
    organizationId,
    currentUser?.id,
    supabase,
    fetchConversationsSilently,
    fetchRoleConversationsSilently,
  ]);

  // Initial load
  useEffect(() => {
    if (organizationId && currentUser?.id) {
      fetchConversations();
      fetchRoleConversations();
      fetchMembers();
      fetchAvailableRoles();
    }
  }, [
    organizationId,
    currentUser?.id,
    fetchConversations,
    fetchRoleConversations,
    fetchMembers,
    fetchAvailableRoles,
  ]);

  // Load messages and conversation details when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && !selectedConversation?.isTemporary) {
      fetchMessages(selectedConversation.id);
      // Mark all unread messages as read when conversation is opened
      markConversationAsRead(selectedConversation.id);

      // Fetch conversation details for role conversations
      if (selectedConversation.type === "role") {
        fetch(
          `/api/organizations/${organizationId}/chat/role-conversations/${selectedConversation.id}`
        )
          .then((res) => res.json())
          .then((result) => {
            if (!result.error && result.data?.conversation) {
              setConversationDetails(result.data.conversation);
            }
          })
          .catch((err) => {
            console.error("Error fetching conversation details:", err);
          });
      } else {
        setConversationDetails(null);
      }
    } else if (selectedConversation?.isTemporary) {
      setMessages([]);
      setConversationDetails(null);
    } else {
      setMessages([]);
      setConversationDetails(null);
    }
  }, [
    selectedConversation?.id,
    selectedConversation?.isTemporary,
    selectedConversation?.type,
    organizationId,
    fetchMessages,
    markConversationAsRead,
  ]);

  // Clean up temporary conversation when user is deselected
  useEffect(() => {
    if (!selectedConversation && temporaryConversation) {
      setTemporaryConversation(null);
    }
  }, [selectedConversation, temporaryConversation]);

  // Handle permission changes - refresh lists and validate current conversation
  const handlePermissionChange = useCallback(async () => {
    // Refresh conversations, role conversations, members, and available roles
    await Promise.all([
      fetchConversations(),
      fetchRoleConversations(),
      fetchMembers(),
      fetchAvailableRoles(),
    ]);

    // Check if current conversation is still valid
    if (selectedConversation) {
      // Handle user-to-user conversations
      if (selectedConversation.otherUserId) {
        const canMessage = await checkCanMessage(
          selectedConversation.otherUserId
        );
        if (!canMessage) {
          // Close conversation if permission is no longer granted
          setSelectedConversation(null);
          setTemporaryConversation(null);
          setMessages([]);
          message.warning(
            "La conversación se cerró porque ya no tienes permiso para enviar mensajes a este usuario."
          );
        }
      }
      // Handle role conversations
      else if (
        selectedConversation.type === "role" &&
        selectedConversation.roleId
      ) {
        // For role conversations, check if user can still message the role
        // Only check if user is the initiator (userId matches current user)
        // Role members can always respond, so we only validate for initiators
        if (selectedConversation.userId === currentUser?.id) {
          const canMessage = await checkCanMessageRole(
            selectedConversation.roleId
          );
          if (!canMessage) {
            // Close conversation if permission is no longer granted
            setSelectedConversation(null);
            setTemporaryConversation(null);
            setMessages([]);
            message.warning(
              "La conversación se cerró porque ya no tienes permiso para enviar mensajes a este rol."
            );
          }
        }
      }
    }
  }, [
    selectedConversation,
    fetchConversations,
    fetchRoleConversations,
    fetchMembers,
    fetchAvailableRoles,
    checkCanMessage,
    checkCanMessageRole,
    currentUser?.id,
    message,
  ]);

  // On mobile, show conversations list when no conversation is selected
  useEffect(() => {
    if (isMobile && !selectedConversation) {
      setShowConversationsList(true);
    }
  }, [isMobile, selectedConversation]);

  // Handle enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get other user info from conversation
  const getOtherUser = (conversation) => {
    return {
      id: conversation.otherUserId,
      name: conversation.otherUserName || "Usuario",
      avatar: conversation.otherUserAvatar,
    };
  };

  // Get translated role name
  const getTranslatedRoleName = (roleName) => {
    if (!roleName) return null;
    // Normalize role name to lowercase for translation key matching
    const normalizedRoleName = roleName.toLowerCase();
    return t(
      `organizations.members.roles.${normalizedRoleName}`,
      {
        defaultValue: roleName,
      }
    );
  };

  // Get all conversations including temporary ones
  const getAllConversations = useMemo(() => {
    const allConvs = [...conversations];
    if (temporaryConversation) {
      // Only add temporary if it doesn't already exist as a real conversation
      const exists = conversations.some(
        (conv) => conv.otherUserId === temporaryConversation.otherUserId
      );
      if (!exists) {
        // Add temporary conversation at the top of the list
        allConvs.unshift(temporaryConversation);
      }
    }
    return allConvs;
  }, [conversations, temporaryConversation]);

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return getAllConversations;
    }

    const searchLower = searchTerm.toLowerCase();
    return getAllConversations.filter((conv) => {
      const userName = conv.otherUserName || "";
      return userName.toLowerCase().includes(searchLower);
    });
  }, [getAllConversations, searchTerm]);

  // Format message time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Ahora";
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-row h-full w-full rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--ant-color-bg-blur)",
      }}
    >
      {/* Conversations List */}
      <div
        className={`${
          isMobile
            ? showConversationsList
              ? "flex flex-col w-full h-full"
              : "hidden"
            : "w-80 border-r flex flex-col h-full"
        }`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="p-4 border-b space-y-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold m-0">Conversaciones</h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  type="text"
                  size="small"
                  icon={<RiUserSettingsLine className="text-lg" />}
                  onClick={() => setShowSettingsDrawer(true)}
                  title={t("chat.permissions.title")}
                />
              )}
              <Button
                type="primary"
                size="small"
                onClick={() => setShowMembers(!showMembers)}
              >
                {showMembers ? t("common.cancel") : t("chat.newConversation")}
              </Button>
            </div>
          </div>
          {!showMembers && (
            <Input
              placeholder={t("chat.searchConversations")}
              prefix={<RiSearchLine />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!showMembers && (
            <>
              {roleConversations.length > 0 && (
                <div
                  className="border-b pb-2"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Conversaciones de Rol
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type={
                            conversationStatusFilter === "active"
                              ? "primary"
                              : "default"
                          }
                          size="small"
                          onClick={() => setConversationStatusFilter("active")}
                        >
                          Activas
                        </Button>
                        <Button
                          type={
                            conversationStatusFilter === "resolved"
                              ? "primary"
                              : "default"
                          }
                          size="small"
                          onClick={() =>
                            setConversationStatusFilter("resolved")
                          }
                        >
                          Resueltas
                        </Button>
                        <Button
                          type={
                            conversationStatusFilter === "archived"
                              ? "primary"
                              : "default"
                          }
                          size="small"
                          onClick={() =>
                            setConversationStatusFilter("archived")
                          }
                        >
                          Archivadas
                        </Button>
                      </div>
                    </div>
                    {roleConversations.map((conversation) => {
                      const isSelected =
                        selectedConversation?.id === conversation.id &&
                        selectedConversation?.type === "role";
                      return (
                        <div
                          key={
                            conversation.id ||
                            `role-conv-${conversation.roleId}-${conversation.userId}`
                          }
                          onClick={() => {
                            setSelectedConversation(conversation);
                            if (isMobile) {
                              setShowConversationsList(false);
                            }
                          }}
                          className="p-3 cursor-pointer flex items-center gap-3 rounded-lg mb-2"
                          style={{
                            backgroundColor: isSelected
                              ? "var(--color-primary-bg)"
                              : "var(--color-bg-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor =
                                "var(--color-bg-tertiary)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor =
                                "var(--color-bg-secondary)";
                            }
                          }}
                        >
                          <Avatar
                            icon={<RiUserLine />}
                            src={null}
                            className="bg-gray-300"
                          >
                            {conversation.userName?.[0]?.toUpperCase() || "U"}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium truncate text-sm">
                                {conversation.userName || "Usuario"}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge
                                  count={conversation.unreadCount}
                                  size="small"
                                  style={{
                                    backgroundColor: "var(--color-error)",
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {conversation.roleName &&
                                (() => {
                                  const roleConfig = getRoleConfig(
                                    conversation.roleName
                                  );
                                  const RoleIcon = roleConfig.icon;
                                  return (
                                    <Tag
                                      color={roleConfig.color}
                                      icon={RoleIcon ? <RoleIcon /> : null}
                                      className="m-0 text-xs"
                                      size="small"
                                    >
                                      {t(
                                        `organizations.members.roles.${conversation.roleName}`,
                                        {
                                          defaultValue: conversation.roleName,
                                        }
                                      )}
                                    </Tag>
                                  );
                                })()}
                              {conversation.status &&
                                conversation.status !== "active" && (
                                  <Tag
                                    color={
                                      conversation.status === "resolved"
                                        ? "green"
                                        : "default"
                                    }
                                    className="m-0 text-xs"
                                    size="small"
                                  >
                                    {conversation.status === "resolved"
                                      ? "Resuelta"
                                      : "Archivada"}
                                  </Tag>
                                )}
                            </div>
                            {conversation.lastMessage && (
                              <div
                                className="text-xs truncate mt-1"
                                style={{ color: "var(--color-text-secondary)" }}
                              >
                                {conversation.lastMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          {showMembers ? (
            <div
              className="pb-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Roles Section */}
              {availableRoles.length > 0 && (
                <div className="px-4 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <div
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Roles
                  </div>
                  {availableRoles.map((role) => (
                    <div
                      key={`role-${role.id}`}
                      onClick={() => {
                        startRoleConversation(role);
                        // On mobile, hide members list when selecting
                        if (isMobile) {
                          setShowConversationsList(false);
                        }
                      }}
                      className="p-3 cursor-pointer flex items-center gap-3 rounded-lg mb-2"
                      style={{
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-bg-secondary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Avatar
                        icon={<RiUserLine />}
                        src={null}
                        className="bg-gray-300"
                      >
                        {role.name?.[0]?.toUpperCase() || "R"}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {(() => {
                            const roleConfig = getRoleConfig(role.name);
                            return t(
                              `organizations.members.roles.${role.name}`,
                              {
                                defaultValue: role.name,
                              }
                            );
                          })()}
                        </div>
                        {role.description && (
                          <div
                            className="text-xs truncate mt-1"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Members Section */}
              <div className="px-4 py-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Miembros
                </div>
                {members.length === 0 ? (
                  <div className="p-4 text-center">
                    <Empty
                      description={
                        <span style={{ color: "var(--color-text-secondary)" }}>
                          {t("chat.noMembersAvailable")}
                        </span>
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : (
                  members.map((member, index) => (
                    <div
                      key={member.id || `member-${member.userId}-${index}`}
                      onClick={() => {
                        startConversation(member);
                        // On mobile, hide members list when selecting
                        if (isMobile) {
                          setShowConversationsList(false);
                        }
                      }}
                      className="p-3 cursor-pointer flex items-center gap-3 rounded-lg mb-2"
                      style={{
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-bg-secondary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Avatar
                        icon={<RiUserLine />}
                        src={null}
                        className="bg-gray-300"
                      >
                        {member.fullName?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {member.fullName || "Usuario"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {member.roleName &&
                            (() => {
                              const roleConfig = getRoleConfig(member.roleName);
                              const RoleIcon = roleConfig.icon;
                              return (
                                <Tag
                                  color={roleConfig.color}
                                  icon={RoleIcon ? <RoleIcon /> : null}
                                  className="m-0"
                                >
                                  {t(
                                    `organizations.members.roles.${member.roleName}`,
                                    {
                                      defaultValue: member.roleName,
                                    }
                                  )}
                                </Tag>
                              );
                            })()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div
              className="pb-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <Empty
                    description={
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {searchTerm.trim()
                          ? t("chat.noConversationsFound")
                          : t("chat.noConversations")}
                      </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                filteredConversations.map((conversation, index) => {
                  const isRoleConv = conversation.type === "role";
                  const otherUser = isRoleConv
                    ? {
                        id: null,
                        name: getTranslatedRoleName(conversation.roleName) || conversation.otherUserName || "Rol",
                        avatar: null,
                      }
                    : getOtherUser(conversation);
                  const isSelected = conversation.isTemporary
                    ? selectedConversation?.isTemporary &&
                      selectedConversation?.otherUserId ===
                        conversation.otherUserId
                    : selectedConversation?.id === conversation.id;

                  return (
                    <div
                      key={
                        conversation.isTemporary
                          ? `temp-${conversation.otherUserId}`
                          : conversation.id ||
                            `conv-${conversation.otherUserId}-${index}`
                      }
                      onClick={() => {
                        setSelectedConversation(conversation);
                        // On mobile, hide conversations list when selecting
                        if (isMobile) {
                          setShowConversationsList(false);
                        }
                        // Clear temporary conversation when selecting a real one
                        if (
                          temporaryConversation &&
                          !conversation.isTemporary
                        ) {
                          setTemporaryConversation(null);
                        }
                      }}
                      className="p-4 cursor-pointer flex items-center gap-3"
                      style={{
                        backgroundColor: isSelected
                          ? "var(--color-primary-bg)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-bg-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <Avatar
                        icon={<RiUserLine />}
                        src={otherUser.avatar}
                        className="bg-gray-300"
                      >
                        {otherUser.name?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">
                              {otherUser.name}
                            </div>
                            {isRoleConv && conversation.roleName && (() => {
                              const roleConfig = getRoleConfig(conversation.roleName);
                              const RoleIcon = roleConfig.icon;
                              return (
                                <Tag
                                  color={roleConfig.color}
                                  icon={RoleIcon ? <RoleIcon /> : null}
                                  className="m-0"
                                  size="small"
                                >
                                  {t(
                                    `organizations.members.roles.${conversation.roleName}`,
                                    {
                                      defaultValue: conversation.roleName,
                                    }
                                  )}
                                </Tag>
                              );
                            })()}
                            {conversation.isReadOnly && (
                              <Tag color="orange" size="small">
                                Solo lectura
                              </Tag>
                            )}
                          </div>
                          {!conversation.isTemporary &&
                            conversation.unreadCount > 0 && (
                              <Badge
                                count={conversation.unreadCount}
                                size="small"
                                style={{
                                  backgroundColor: "var(--color-error)",
                                }}
                              />
                            )}
                        </div>
                        <div
                          className="text-sm truncate"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {conversation.isTemporary
                            ? t("chat.noMessages")
                            : conversation.lastMessage || ""}
                        </div>
                        {!conversation.isTemporary &&
                          conversation.lastMessageTime && (
                            <div
                              className="text-[10px] mt-1 italic opacity-70"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {formatTime(conversation.lastMessageTime)}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 flex flex-col ${
          isMobile && showConversationsList ? "hidden" : ""
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Header */}
            <div
              className="p-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              {(() => {
                const isRoleConv = selectedConversation?.type === "role";
                // For role conversations, determine what to display:
                // - If current user is the initiator: show their name (they're chatting with the role)
                // - If current user is a role member: show the translated role name (they're chatting as the role)
                const otherUser = isRoleConv
                  ? (() => {
                      const isInitiator = selectedConversation.userId === currentUser?.id;
                      if (isInitiator) {
                        // User is the initiator, show their name
                        return {
                          id: selectedConversation.userId,
                          name: selectedConversation.userName || "Usuario",
                          avatar: null,
                        };
                      } else {
                        // User is a role member, show the translated role name
                        return {
                          id: null,
                          name: getTranslatedRoleName(selectedConversation.roleName) || "Rol",
                          avatar: null,
                        };
                      }
                    })()
                  : getOtherUser(selectedConversation);
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button
                          type="text"
                          icon={<RiArrowLeftLine />}
                          onClick={() => {
                            setShowConversationsList(true);
                            setSelectedConversation(null);
                          }}
                          className="mr-2"
                        />
                      )}
                      <Avatar
                        icon={<RiUserLine />}
                        src={otherUser.avatar}
                        className="bg-gray-300"
                      >
                        {otherUser.name?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className="font-medium"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {otherUser.name}
                          </div>
                          {isRoleConv &&
                            selectedConversation.roleName &&
                            (() => {
                              const roleConfig = getRoleConfig(
                                selectedConversation.roleName
                              );
                              const RoleIcon = roleConfig.icon;
                              return (
                                <Tag
                                  color={roleConfig.color}
                                  icon={RoleIcon ? <RoleIcon /> : null}
                                  className="m-0"
                                  size="small"
                                >
                                  {t(
                                    `organizations.members.roles.${selectedConversation.roleName}`,
                                    {
                                      defaultValue:
                                        selectedConversation.roleName,
                                    }
                                  )}
                                </Tag>
                              );
                            })()}
                          {isRoleConv &&
                            selectedConversation.status &&
                            selectedConversation.status !== "active" && (
                              <Tag
                                color={
                                  selectedConversation.status === "resolved"
                                    ? "green"
                                    : "default"
                                }
                                className="m-0"
                                size="small"
                              >
                                {selectedConversation.status === "resolved"
                                  ? "Resuelta"
                                  : "Archivada"}
                              </Tag>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRoleConv && (
                        <ResolutionActions
                          conversation={selectedConversation}
                          organizationId={organizationId}
                          currentUserId={currentUser?.id}
                          onUpdate={() => {
                            // Refresh conversation details and role conversations list
                            if (selectedConversation.type === "role") {
                              fetch(
                                `/api/organizations/${organizationId}/chat/role-conversations/${selectedConversation.id}`
                              )
                                .then((res) => res.json())
                                .then((result) => {
                                  if (
                                    !result.error &&
                                    result.data?.conversation
                                  ) {
                                    setConversationDetails(
                                      result.data.conversation
                                    );
                                    setSelectedConversation((prev) => ({
                                      ...prev,
                                      status: result.data.conversation.status,
                                    }));
                                  }
                                })
                                .catch((err) => {
                                  console.error(
                                    "Error fetching conversation details:",
                                    err
                                  );
                                });
                              fetchRoleConversations();
                            }
                          }}
                        />
                      )}
                      {isAdmin && (
                        <Button
                          type="text"
                          icon={<RiUserSettingsLine className="text-lg" />}
                          onClick={() => setShowSettingsDrawer(true)}
                          title={t("chat.permissions.title")}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e0 #f7fafc",
              }}
            >
              {/* Resolution Request Banner */}
              {conversationDetails?.pendingResolutionRequests?.length > 0 &&
                conversationDetails.pendingResolutionRequests
                  .filter((req) => req.status === "pending")
                  .map((req) => (
                    <ResolutionRequestBanner
                      key={req.id}
                      resolutionRequest={req}
                      conversationId={selectedConversation.id}
                      organizationId={organizationId}
                      currentUserId={currentUser?.id}
                      onUpdate={() => {
                        // Refresh conversation details
                        if (selectedConversation.type === "role") {
                          fetch(
                            `/api/organizations/${organizationId}/chat/role-conversations/${selectedConversation.id}`
                          )
                            .then((res) => res.json())
                            .then((result) => {
                              if (!result.error && result.data?.conversation) {
                                setConversationDetails(
                                  result.data.conversation
                                );
                                setSelectedConversation((prev) => ({
                                  ...prev,
                                  status: result.data.conversation.status,
                                }));
                              }
                            })
                            .catch((err) => {
                              console.error(
                                "Error fetching conversation details:",
                                err
                              );
                            });
                          fetchRoleConversations();
                        }
                      }}
                    />
                  ))}
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <Empty
                    description={
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {t("chat.noMessages")}. {t("chat.sendFirstMessage")}
                      </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === currentUser?.id;
                  const isRoleConv = selectedConversation?.type === "role";
                  const senderName =
                    isRoleConv && !isOwn && messageSenderNames[msg.sender_id]
                      ? messageSenderNames[msg.sender_id]
                      : null;
                  return (
                    <div
                      key={msg.id || `msg-${msg.created_at}-${index}`}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className="max-w-[70%] rounded-lg px-4 py-2"
                        style={{
                          backgroundColor: isOwn
                            ? "var(--color-primary)"
                            : "var(--color-bg-secondary)",
                          color: isOwn
                            ? "var(--color-text-header)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {senderName && (
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{
                              color: isOwn
                                ? "rgba(255, 255, 255, 0.9)"
                                : "var(--color-text-primary)",
                            }}
                          >
                            {senderName}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                        <div
                          className="text-[10px] mt-1.5 italic opacity-70"
                          style={{
                            color: isOwn
                              ? "rgba(255, 255, 255, 0.7)"
                              : "var(--color-text-secondary)",
                          }}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-4 border-t"
              style={{ borderColor: "var(--color-border)" }}
            >
              {selectedConversation?.isReadOnly && (
                <div
                  className="mb-2 p-2 rounded"
                  style={{
                    backgroundColor: "var(--color-warning-bg)",
                    border: "1px solid var(--color-warning-border)",
                  }}
                >
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: "12px", color: "var(--color-warning)" }}
                  >
                    Solo puedes recibir mensajes en esta conversación
                  </Typography.Text>
                </div>
              )}
              <div className="flex gap-2">
                <TextArea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedConversation?.isReadOnly
                      ? "No puedes enviar mensajes en esta conversación"
                      : t("chat.typeMessage")
                  }
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={sending || selectedConversation?.isReadOnly}
                  className="flex-1"
                />
                <Button
                  type="primary"
                  icon={<RiSendPlaneLine />}
                  onClick={sendMessage}
                  disabled={
                    !messageContent.trim() ||
                    sending ||
                    selectedConversation?.isReadOnly
                  }
                  className="!w-12"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {isMobile ? (
              <Button
                type="primary"
                onClick={() => setShowConversationsList(true)}
              >
                {t("chat.selectConversation")}
              </Button>
            ) : (
              <Empty
                description={
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {t("chat.selectConversation")}
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        )}
      </div>

      {/* Settings Drawer */}
      <Drawer
        title={t("chat.permissions.title")}
        placement="right"
        onClose={() => setShowSettingsDrawer(false)}
        open={showSettingsDrawer}
        size={isMobile ? "large" : 600}
        destroyOnClose={false}
      >
        <ChatPermissionsSettings
          organizationId={organizationId}
          onPermissionChange={handlePermissionChange}
        />
      </Drawer>
    </div>
  );
}
