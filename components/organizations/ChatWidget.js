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

const { TextArea } = Input;

export default function ChatWidget({ organizationId }) {
  const t = useTranslations();
  const { message } = App.useApp();
  const { data: currentUser } = useUser();
  const isMobile = useIsMobile();
  const { isAdmin } = useOrganizationAuth();
  const supabase = useMemo(() => createClient(), []);

  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [temporaryConversation, setTemporaryConversation] = useState(null);
  const [showConversationsList, setShowConversationsList] = useState(!isMobile);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

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
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
        message.error(error.message || "Error al obtener los mensajes");
      } finally {
        setLoadingMessages(false);
      }
    },
    [organizationId, currentUser?.id, supabase, message, scrollToBottom]
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
            conv.id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        // Silently fail - don't show error for background operation
        console.error("Error marking conversation as read:", error);
      }
    },
    [organizationId, currentUser?.id]
  );

  // Send message
  const sendMessage = useCallback(async () => {
    if (!messageContent.trim() || !selectedConversation || sending) return;

    const recipientId = selectedConversation.otherUserId;
    if (!recipientId) return;

    const isTemporary = selectedConversation.isTemporary;
    const contentToSend = messageContent.trim();
    const tempMessageId = `temp-${Date.now()}`;

    // Optimistic update: add message immediately to UI
    const optimisticMessage = {
      id: tempMessageId,
      sender_id: currentUser?.id,
      recipient_id: recipientId,
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
      const response = await fetch(
        `/api/organizations/${organizationId}/chat/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientId,
            content: contentToSend,
          }),
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
        // Use silent fetch to get the new conversation without showing spinner
        setTimeout(async () => {
          const response = await fetch(
            `/api/organizations/${organizationId}/chat/conversations?limit=50&offset=0`
          );
          const updatedConvs = await response.json();

          const newConv = updatedConvs.data?.conversations?.find(
            (conv) => conv.otherUserId === recipientId
          );

          if (newConv) {
            setSelectedConversation(newConv);
            await fetchMessages(newConv.id);
          }
        }, 500);
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

  // Set up realtime subscription for messages
  useEffect(() => {
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
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new;
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
                  msg.recipient_id === newMessage.recipient_id &&
                  msg.content === newMessage.content
              );
              if (optimisticIndex !== -1) {
                // Replace optimistic message with real one
                const updated = [...prev];
                updated[optimisticIndex] = formattedMessage;
                return updated;
              }
              // If no optimistic message found but we have one with same content, don't add duplicate
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
    scrollToBottom,
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
        (payload) => {
          const newMessage = payload.new;
          // Only update conversations if the message involves the current user
          if (
            newMessage.sender_id === currentUser.id ||
            newMessage.recipient_id === currentUser.id
          ) {
            // Update conversations list in-place without showing spinner
            setConversations((prev) => {
              // Find the conversation that this message belongs to
              const otherUserId =
                newMessage.sender_id === currentUser.id
                  ? newMessage.recipient_id
                  : newMessage.sender_id;

              const existingIndex = prev.findIndex(
                (conv) => conv.otherUserId === otherUserId
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
  }, [organizationId, currentUser?.id, supabase, fetchConversationsSilently]);

  // Initial load
  useEffect(() => {
    if (organizationId && currentUser?.id) {
      fetchConversations();
      fetchMembers();
    }
  }, [organizationId, currentUser?.id, fetchConversations, fetchMembers]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && !selectedConversation?.isTemporary) {
      fetchMessages(selectedConversation.id);
      // Mark all unread messages as read when conversation is opened
      markConversationAsRead(selectedConversation.id);
    } else if (selectedConversation?.isTemporary) {
      setMessages([]);
    } else {
      setMessages([]);
    }
  }, [
    selectedConversation?.id,
    selectedConversation?.isTemporary,
    fetchMessages,
    markConversationAsRead,
  ]);

  // Clean up temporary conversation when user is deselected
  useEffect(() => {
    if (!selectedConversation && temporaryConversation) {
      setTemporaryConversation(null);
    }
  }, [selectedConversation, temporaryConversation]);

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
          {showMembers ? (
            <div
              className="pb-4"
              style={{ borderColor: "var(--color-border)" }}
            >
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
                    className="p-4 cursor-pointer flex items-center gap-3"
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
                  const otherUser = getOtherUser(conversation);
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
                          <div className="font-medium truncate">
                            {otherUser.name}
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
                const otherUser = getOtherUser(selectedConversation);
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
                        <div
                          className="font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {otherUser.name}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        type="text"
                        icon={<RiUserSettingsLine className="text-lg" />}
                        onClick={() => setShowSettingsDrawer(true)}
                        title={t("chat.permissions.title")}
                      />
                    )}
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
              <div className="flex gap-2">
                <TextArea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t("chat.typeMessage")}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  type="primary"
                  icon={<RiSendPlaneLine />}
                  onClick={sendMessage}
                  disabled={!messageContent.trim() || sending}
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
        <ChatPermissionsSettings organizationId={organizationId} />
      </Drawer>
    </div>
  );
}
