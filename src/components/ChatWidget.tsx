"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiMessageSquare, FiSend, FiX, FiChevronLeft, FiAlertTriangle } from "react-icons/fi";

type Message = {
  _id?: string;
  bookingId: string;
  senderUid: string;
  senderName: string;
  senderRole: "buyer" | "seller";
  text: string;
  type: "text" | "payment_info" | "payment_confirmed" | "system";
  createdAt: string;
};

type ChatConversation = {
  bookingId: string;
  otherPartyName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: boolean;
  items?: string;
  status?: string;
};

type ChatWidgetProps = {
  userUid: string;
  userName: string;
  userRole: "buyer" | "seller";
  salonUid?: string; // for sellers
  // External control: open widget to a specific booking conversation
  openBookingId?: string | null;
  onExternalClose?: () => void;
  // Seller-specific extras
  onSendPaymentInfo?: (bookingId: string, text: string) => void;
  onConfirmPayment?: (bookingId: string) => void;
};

export default function ChatWidget({
  userUid,
  userName,
  userRole,
  salonUid,
  openBookingId,
  onExternalClose,
  onSendPaymentInfo,
  onConfirmPayment,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInput, setPaymentInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCountRef = useRef(0);
  const lastMsgIdRef = useRef<string | undefined>(undefined);

  const scrollToBottom = (instant = false) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (instant) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  // Handle external open request (e.g., from inline "Chat" button on a booking card)
  useEffect(() => {
    if (openBookingId) {
      prevMsgCountRef.current = 0;
      lastMsgIdRef.current = undefined;
      setIsOpen(true);
      setActiveBookingId(openBookingId);
      fetchMessages(openBookingId);
      fetchConversations();
    }
  }, [openBookingId]);

  // Fetch conversations (bookings with messages)
  const fetchConversations = async () => {
    setConvLoading(true);
    try {
      let url = "";
      if (userRole === "seller" && salonUid) {
        url = `/api/bookings?salonUid=${encodeURIComponent(salonUid)}`;
      } else {
        url = `/api/bookings?buyerUid=${encodeURIComponent(userUid)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.bookings) {
        // Only keep bookings that are active or have had some activity
        const convs: ChatConversation[] = data.bookings
          .filter((b: any) => !["cancelled"].includes(b.status))
          .map((b: any) => ({
            bookingId: b._id,
            otherPartyName:
              userRole === "seller"
                ? b.buyerName || b.customerName || "Käufer"
                : b.sellerName || b.salonInfo?.name || b.sellerInfo?.name || "Verkäufer",
            items: (b.items || b.services || []).map((s: any) => s.name).join(", "),
            status: b.status,
            lastMessage: "",
            lastMessageTime: b.updatedAt || b.createdAt,
          }));
        setConversations(convs);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setConvLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (bookingId: string, silent = false) => {
    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/messages?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json();
      const newMessages: Message[] = data.messages || [];
      if (silent) {
        // Only update state when something actually changed — avoids re-renders that reset scroll
        const latestId = newMessages[newMessages.length - 1]?._id;
        if (latestId !== lastMsgIdRef.current) {
          lastMsgIdRef.current = latestId;
          setMessages(newMessages);
        }
      } else {
        const latestId = newMessages[newMessages.length - 1]?._id;
        lastMsgIdRef.current = latestId;
        setMessages(newMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  // Send message
  const sendMessage = async (text: string, type: string = "text") => {
    if (!activeBookingId || !text.trim()) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activeBookingId,
          senderUid: userUid,
          senderName: userName,
          senderRole: userRole,
          text: text.trim(),
          type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        lastMsgIdRef.current = data.message?._id; // keep in sync so next poll doesn't cause a re-render
        setMessages((prev) => [...prev, data.message]);
        setChatInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendPaymentInfo = async () => {
    if (!activeBookingId || !paymentInput.trim()) return;
    await sendMessage(paymentInput.trim(), "payment_info");
    // Also update booking status
    await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: activeBookingId,
        status: "payment_pending",
        paymentInstructions: paymentInput.trim(),
      }),
    });
    if (onSendPaymentInfo) onSendPaymentInfo(activeBookingId, paymentInput.trim());
    setPaymentInput("");
    setShowPaymentForm(false);
  };

  const handleConfirmPayment = async () => {
    if (!activeBookingId) return;
    await sendMessage("Zahlung erhalten ✓", "payment_confirmed");
    await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: activeBookingId,
        status: "accepted",
      }),
    });
    if (onConfirmPayment) onConfirmPayment(activeBookingId);
  };

  // Open chat widget
  const handleOpen = () => {
    setIsOpen(true);
    fetchConversations();
  };

  // Open specific conversation
  const openConversation = (bookingId: string) => {
    prevMsgCountRef.current = 0;
    lastMsgIdRef.current = undefined;
    setActiveBookingId(bookingId);
    fetchMessages(bookingId);
  };

  // Go back to conversation list
  const goBack = () => {
    prevMsgCountRef.current = 0;
    lastMsgIdRef.current = undefined;
    setActiveBookingId(null);
    setMessages([]);
    setShowPaymentForm(false);
    // Stop polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      // instant on initial open (0 → N), smooth for new messages arriving during chat
      scrollToBottom(prevMsgCountRef.current === 0);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  // Poll for new messages when in a conversation
  useEffect(() => {
    if (activeBookingId && isOpen) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeBookingId, true); // silent: don't show loading spinner
      }, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [activeBookingId, isOpen]);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "pending": return "Ausstehend";
      case "accepted": return "Angenommen";
      case "payment_pending": return "Zahlung ausst.";
      case "shipped": return "Versendet";
      case "completed": return "Abgeschlossen";
      case "rejected": return "Abgelehnt";
      default: return status || "";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "payment_pending": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 bg-[#5C6F68] hover:bg-[#4a5a54] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Chat öffnen"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel (slides in from bottom-right) */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[550px] sm:max-h-[80vh] flex flex-col bg-white sm:rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#5C6F68] text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              {activeBookingId && (
                <button onClick={goBack} className="hover:bg-white/20 rounded p-1 transition">
                  <FiChevronLeft className="w-5 h-5" />
                </button>
              )}
              <FiMessageSquare className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {activeBookingId ? (conversations.find(c => c.bookingId === activeBookingId)?.otherPartyName || "Chat") : "Nachrichten"}
              </span>
            </div>
            <button
              onClick={() => { setIsOpen(false); setActiveBookingId(null); setMessages([]); setShowPaymentForm(false); if (pollRef.current) clearInterval(pollRef.current); if (onExternalClose) onExternalClose(); }}
              className="hover:bg-white/20 rounded p-1 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation List */}
          {!activeBookingId && (
            <div className="flex-1 overflow-y-auto">
              {convLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Laden...
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                  <FiMessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Keine Konversationen</p>
                  <p className="text-xs mt-1">Chats erscheinen hier, wenn Anfragen erstellt werden</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.bookingId}
                    onClick={() => openConversation(conv.bookingId)}
                    className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#E4DED5] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#5C6F68] font-bold text-sm">
                        {(conv.otherPartyName || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">{conv.otherPartyName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusColor(conv.status)}`}>
                          {getStatusLabel(conv.status)}
                        </span>
                      </div>
                      {conv.items && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.items}</p>
                      )}
                      {conv.lastMessageTime && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(conv.lastMessageTime).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Active Chat */}
          {activeBookingId && (() => {
            const activeConv = conversations.find(c => c.bookingId === activeBookingId);
            const activeStatus = activeConv?.status || "";
            const hasPaymentInfoMsg = messages.some(m => m.type === "payment_info");
            const hasPaymentConfirmedMsg = messages.some(m => m.type === "payment_confirmed");
            const paymentAlreadySent = hasPaymentInfoMsg || ["payment_pending", "shipped", "completed"].includes(activeStatus);
            const paymentAlreadyConfirmed = hasPaymentConfirmedMsg || ["shipped", "completed", "accepted"].includes(activeStatus);
            return (
            <>
              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatLoading ? (
                  <div className="text-center text-gray-400 py-8 text-sm">Nachrichten werden geladen...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <FiMessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Noch keine Nachrichten</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg._id || i}
                      className={`flex ${
                        msg.type === "system"
                          ? "justify-center"
                          : (msg.senderRole === userRole ? "justify-end" : "justify-start")
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.type === "system"
                            ? "bg-gray-100 text-gray-500 text-xs italic text-center"
                            : msg.type === "payment_info"
                            ? "bg-blue-50 text-blue-900 border border-blue-200"
                            : msg.type === "payment_confirmed"
                            ? "bg-green-50 text-green-900 border border-green-200"
                            : msg.senderRole === userRole
                            ? "bg-[#5C6F68] text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.type === "payment_info" && (
                          <div className="text-xs font-semibold mb-1 text-blue-700">💳 Zahlungsinformation</div>
                        )}
                        {msg.type === "payment_confirmed" && (
                          <div className="text-xs font-semibold mb-1 text-green-700">✓ Zahlungsbestätigung</div>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <div
                          className={`text-[10px] mt-1 ${
                            msg.type === "system"
                              ? "text-gray-400"
                              : msg.senderRole === userRole
                              ? "text-white/60"
                              : "text-gray-400"
                          }`}
                        >
                          {msg.senderName} ·{" "}
                          {new Date(msg.createdAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Seller: Payment Actions */}
              {userRole === "seller" && (!paymentAlreadySent || !paymentAlreadyConfirmed) && (
                <>
                  {showPaymentForm && !paymentAlreadySent && (
                    <div className="p-3 border-t border-blue-200 bg-blue-50 flex-shrink-0">
                      <label className="text-xs font-medium text-blue-800 block mb-1">
                        Zahlungsinformationen senden:
                      </label>
                      <textarea
                        value={paymentInput}
                        onChange={(e) => setPaymentInput(e.target.value)}
                        className="w-full p-2 border border-blue-300 rounded-md text-sm text-gray-900 mb-2"
                        rows={2}
                        placeholder="z.B. Bankverbindung, PayPal..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendPaymentInfo}
                          disabled={!paymentInput.trim()}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          Senden
                        </button>
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentInput("");
                          }}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-gray-300"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="px-3 py-1.5 border-t border-gray-100 flex gap-1 flex-wrap flex-shrink-0">
                    {!paymentAlreadySent && (
                      <button
                        onClick={() => setShowPaymentForm((v) => !v)}
                        className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 font-medium"
                      >
                        💳 Zahlungsinfo
                      </button>
                    )}
                    {!paymentAlreadyConfirmed && (
                      <button
                        onClick={handleConfirmPayment}
                        className="text-[11px] bg-green-50 text-green-700 px-2 py-1 rounded-md hover:bg-green-100 font-medium"
                      >
                        ✓ Zahlung erhalten
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-200 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(chatInput);
                    }
                  }}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C6F68]"
                />
                <button
                  onClick={() => sendMessage(chatInput)}
                  disabled={!chatInput.trim()}
                  className="bg-[#5C6F68] text-white px-3 py-2 rounded-md hover:bg-[#4a5a54] disabled:opacity-50 transition"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </>
            );
          })()}
        </div>
      )}
    </>
  );
}
