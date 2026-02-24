import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getConversations, getMessages, sendMessage, createConversation, searchUsers,
} from "../services/api";
import { Conversation, Message } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { firestore } from "../config/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import "./Messages.css";

const Messages: React.FC = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // New conversation modal
  const [showNew, setShowNew] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group">("dm");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        const convs = await getConversations();
        setConversations(convs);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Real-time messages listener
  const subscribeToMessages = useCallback((conversationId: string) => {
    // Cleanup previous listener
    if (unsubRef.current) unsubRef.current();

    try {
      const messagesRef = collection(firestore, "conversations", conversationId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
      unsubRef.current = unsub;
    } catch {
      // Fallback to API polling if Firestore direct access fails
      getMessages(conversationId).then(setMessages).catch(() => {});
    }
  }, []);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    subscribeToMessages(conv.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      await sendMessage(activeConv.id, msgText.trim());
      setMsgText("");
      // Update conversation list
      const convs = await getConversations();
      setConversations(convs);
    } catch {}
    setSending(false);
  };

  // User search for new conversation
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleUser = (user: any) => {
    if (selectedUsers.find((u) => u.uid === user.uid)) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;
    if (newType === "group" && !groupName.trim()) return;
    setCreating(true);
    setNewError("");
    try {
      const conv = await createConversation({
        type: newType,
        name: newType === "group" ? groupName.trim() : undefined,
        participantUids: selectedUsers.map((u) => u.uid),
      });
      const convs = await getConversations();
      setConversations(convs);
      openConversation(conv);
      setShowNew(false);
      setSelectedUsers([]);
      setGroupName("");
      setSearchQuery("");
      setNewError("");
    } catch (err: any) {
      setNewError(err.message || "Failed to create conversation");
    }
    setCreating(false);
  };

  const getConvName = (conv: Conversation) => {
    if (conv.type === "group") return conv.name || "Group Chat";
    const otherId = conv.participants.find((uid) => uid !== currentUser?.uid);
    return otherId ? conv.participantNames[otherId] || "User" : "Chat";
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === "group") return "👥";
    const otherId = conv.participants.find((uid) => uid !== currentUser?.uid);
    if (otherId && conv.participantPhotos[otherId]) return null; // has photo
    const name = getConvName(conv);
    return name.charAt(0).toUpperCase();
  };

  const getConvPhoto = (conv: Conversation) => {
    if (conv.type === "group") return "";
    const otherId = conv.participants.find((uid) => uid !== currentUser?.uid);
    return otherId ? conv.participantPhotos[otherId] || "" : "";
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  if (loading) {
    return <div className="msg-loading"><span className="bounce-ball">🏓</span><p>Loading messages...</p></div>;
  }

  return (
    <div className="messages-page">
      {/* Conversation list */}
      <div className="msg-sidebar">
        <div className="msg-sidebar-header">
          <h2>Messages</h2>
          <button className="msg-new-btn" onClick={() => setShowNew(true)}>✏️</button>
        </div>

        {conversations.length === 0 ? (
          <div className="msg-sidebar-empty">
            <p>No conversations yet</p>
            <button className="btn-app btn-app-filled btn-sm" onClick={() => setShowNew(true)}>
              <span className="btn-ball">🏓</span>
              Start a Chat
            </button>
          </div>
        ) : (
          <div className="msg-conv-list">
            {conversations.map((conv) => {
              const photo = getConvPhoto(conv);
              const avatar = getConvAvatar(conv);
              return (
                <button
                  key={conv.id}
                  className={`msg-conv-item ${activeConv?.id === conv.id ? "msg-conv-active" : ""}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="msg-conv-avatar">
                    {photo ? <img src={photo} alt="" /> : <span>{avatar}</span>}
                  </div>
                  <div className="msg-conv-info">
                    <span className="msg-conv-name">{getConvName(conv)}</span>
                    {conv.lastMessage && (
                      <span className="msg-conv-preview">
                        {conv.lastMessageBy === currentUser?.uid ? "You: " : ""}
                        {conv.lastMessage}
                      </span>
                    )}
                  </div>
                  {conv.lastMessageAt && (
                    <span className="msg-conv-time">{timeAgo(conv.lastMessageAt)}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="msg-chat">
        {!activeConv ? (
          <div className="msg-chat-empty">
            <span>💬</span>
            <h3>Select a conversation</h3>
            <p>Choose a conversation or start a new one</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="msg-chat-header">
              <div className="msg-chat-header-info">
                <div className="msg-conv-avatar msg-conv-avatar-sm">
                  {getConvPhoto(activeConv) ? <img src={getConvPhoto(activeConv)} alt="" /> : <span>{getConvAvatar(activeConv)}</span>}
                </div>
                <div>
                  <span className="msg-chat-name">{getConvName(activeConv)}</span>
                  <span className="msg-chat-participants">
                    {activeConv.type === "group"
                      ? `${activeConv.participants.length} members`
                      : activeConv.participantNames[activeConv.participants.find((uid) => uid !== currentUser?.uid) || ""] || ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-messages">
              {messages.length === 0 ? (
                <div className="msg-messages-empty">
                  <p>No messages yet. Say hello! 🏓</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                  return (
                    <div key={msg.id} className={`msg-bubble-row ${isMe ? "msg-bubble-me" : "msg-bubble-them"}`}>
                      {!isMe && (
                        <div className="msg-bubble-avatar">
                          {showAvatar ? (
                            msg.senderPhotoURL ? <img src={msg.senderPhotoURL} alt="" /> : <span>{msg.senderName.charAt(0).toUpperCase()}</span>
                          ) : <div className="msg-bubble-avatar-spacer" />}
                        </div>
                      )}
                      <div className="msg-bubble-content">
                        {showAvatar && !isMe && activeConv.type === "group" && (
                          <span className="msg-bubble-sender">{msg.senderName}</span>
                        )}
                        <div className={`msg-bubble ${isMe ? "msg-bubble-mine" : "msg-bubble-theirs"}`}>
                          {msg.text}
                        </div>
                        <span className="msg-bubble-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="msg-input-bar" onSubmit={handleSend}>
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Type a message..."
                autoFocus
              />
              <button type="submit" disabled={sending || !msgText.trim()} className="msg-send-btn">
                🏓
              </button>
            </form>
          </>
        )}
      </div>

      {/* New conversation modal */}
      {showNew && (
        <div className="msg-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-header">
              <h3>New Conversation</h3>
              <button className="msg-modal-close" onClick={() => setShowNew(false)}>✕</button>
            </div>

            <div className="msg-modal-type">
              <button
                className={`msg-type-btn ${newType === "dm" ? "msg-type-active" : ""}`}
                onClick={() => setNewType("dm")}
              >
                💬 Direct Message
              </button>
              <button
                className={`msg-type-btn ${newType === "group" ? "msg-type-active" : ""}`}
                onClick={() => setNewType("group")}
              >
                👥 Group Chat
              </button>
            </div>

            {newType === "group" && (
              <input
                type="text"
                className="msg-modal-input"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            )}

            <input
              type="text"
              className="msg-modal-input"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="msg-selected-users">
                {selectedUsers.map((u) => (
                  <span key={u.uid} className="msg-selected-chip" onClick={() => toggleUser(u)}>
                    {u.displayName} ✕
                  </span>
                ))}
              </div>
            )}

            {/* Search results */}
            <div className="msg-search-results">
              {searchResults.map((user) => {
                const isSelected = selectedUsers.find((u) => u.uid === user.uid);
                return (
                  <button
                    key={user.uid}
                    className={`msg-search-item ${isSelected ? "msg-search-selected" : ""}`}
                    onClick={() => toggleUser(user)}
                  >
                    <div className="msg-search-avatar">
                      {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{user.displayName?.charAt(0).toUpperCase() || "?"}</span>}
                    </div>
                    <div className="msg-search-info">
                      <span className="msg-search-name">{user.displayName}</span>
                      <span className="msg-search-role">{user.role === "vendor" ? "🏆 Instructor" : "🎓 Student"}</span>
                    </div>
                    {isSelected && <span className="msg-search-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {newError && <div className="msg-modal-error">{newError}</div>}

            <button
              className="btn-app btn-app-filled msg-modal-create"
              onClick={handleCreateConversation}
              disabled={creating || selectedUsers.length === 0 || (newType === "group" && !groupName.trim())}
            >
              <span className="btn-ball">🏓</span>
              {creating ? "Creating..." : newType === "dm" ? "Start Chat" : "Create Group"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
