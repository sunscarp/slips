"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import ChatWidget from "../../components/ChatWidget";
import { FiShoppingBag, FiMapPin, FiStar, FiLock, FiMessageSquare, FiSend, FiAlertTriangle } from "react-icons/fi";

const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type PurchaseRequest = {
  _id: string;
  salonId: string;
  salonUid: string;
  sellerId?: string;
  sellerUid?: string;
  buyerName?: string;
  customerName?: string;
  buyerEmail?: string;
  buyerUid?: string;
  services?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    selectedAdditionalServices?: string[];
    additionalServices?: { name: string; price: number }[];
  }[];
  items?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    selectedAdditionalServices?: string[];
    additionalServices?: { name: string; price: number }[];
  }[];
  total: number;
  specialNeeds?: string;
  shippingAddress?: {
    street: string;
    number: string;
    zip: string;
    city: string;
    country: string;
  };
  status: string;
  paymentInstructions?: string;
  createdAt: string;
  updatedAt: string;
};

type Salon = {
  _id: string;
  name: string;
  location: string;
  imageUrls: string[];
};

type User = {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  role: string;
};

export default function BuyerTrackingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [salons, setSalons] = useState<{[key: string]: Salon}>({});
  const [loading, setLoading] = useState(true);
  // Review state
  const [reviewingRequest, setReviewingRequest] = useState<PurchaseRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Chat state
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Ticket state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketBookingId, setTicketBookingId] = useState<string | null>(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [ticketDetailId, setTicketDetailId] = useState<string | null>(null);

  // Check auth and fetch orders
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Fetch orders by buyerUid
          await fetchRequests(data.uid);
          // Fetch user's tickets
          fetchMyTickets(data.uid);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchRequests = async (buyerUid: string) => {
    try {
      const res = await fetch(`/api/bookings?buyerUid=${encodeURIComponent(buyerUid)}`);
      const data = await res.json();
      
      if (data.bookings) {
        const sorted = data.bookings.sort((a: PurchaseRequest, b: PurchaseRequest) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setRequests(sorted);
        
        // Fetch seller details
        const salonUids = [...new Set(sorted.map((b: PurchaseRequest) => b.salonUid || b.sellerUid))] as string[];
        fetchSalons(salonUids);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchSalons = async (salonUids: string[]) => {
    try {
      const salonData: {[key: string]: Salon} = {};
      for (const uid of salonUids) {
        const res = await fetch(`/api/salons?uid=${encodeURIComponent(uid)}`);
        const data = await res.json();
        if (data.salon) {
          salonData[uid] = data.salon;
        }
      }
      setSalons(salonData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const submitReview = async () => {
    if (!reviewingRequest || !reviewComment.trim() || !user) return;
    setSubmittingReview(true);
    try {
      const sellerUid = reviewingRequest.sellerUid || reviewingRequest.salonUid;
      const items = reviewingRequest.items || reviewingRequest.services || [];
      const firstItem = items[0];
      const buyerEmail = reviewingRequest.buyerEmail || user.email || user.username || '';
      const itemName = firstItem?.name || items.map(i => i.name).filter(Boolean).join(', ') || 'Bestellung';
      
      if (!sellerUid || !buyerEmail) {
        showToast('Fehlende Daten: Verkäufer oder E-Mail nicht verfügbar.', 'error');
        setSubmittingReview(false);
        return;
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonUid: sellerUid,
          sellerUid: sellerUid,
          buyerUid: user.uid,
          buyerEmail: buyerEmail,
          buyerName: reviewingRequest.buyerName || reviewingRequest.customerName || user.name || user.username,
          customerName: reviewingRequest.buyerName || reviewingRequest.customerName || user.name || user.username,
          rating: reviewRating,
          comment: reviewComment,
          serviceName: itemName,
          itemName: itemName,
          bookingId: reviewingRequest._id,
          requestId: reviewingRequest._id
        })
      });

      if (res.ok) {
        setReviewingRequest(null);
        setReviewRating(5);
        setReviewComment('');
        showToast('Bewertung erfolgreich abgegeben!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Fehler beim Senden der Bewertung', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Fehler beim Senden der Bewertung', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Chat functions
  const openChat = async (bookingId: string) => {
    setChatBookingId(bookingId);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/messages?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!chatBookingId || !text.trim() || !user) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: chatBookingId,
          senderUid: user.uid,
          senderName: user.name || user.username || 'Käufer',
          senderRole: 'buyer',
          text: text.trim(),
          type: 'text'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, data.message]);
        setChatInput("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Ticket functions
  const submitTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim() || !user) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raisedByUid: user.uid,
          raisedByName: user.name || user.username || 'Käufer',
          raisedByEmail: user.email || '',
          raisedByRole: 'buyer',
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          bookingId: ticketBookingId || null
        })
      });
      if (res.ok) {
        setShowTicketForm(false);
        setTicketSubject("");
        setTicketDescription("");
        setTicketBookingId(null);
        showToast('Ticket wurde erfolgreich erstellt!', 'success');
        // Refresh tickets list
        if (user?.uid) fetchMyTickets(user.uid);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Fehler beim Erstellen des Tickets', 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'accepted': return 'Angenommen';
      case 'payment_pending': return 'Zahlung ausstehend';
      case 'shipped': return 'Versendet';
      case 'completed': return 'Abgeschlossen';
      case 'rejected': return 'Abgelehnt';
      case 'cancelled': return 'Storniert';
      case 'confirmed': return 'Bestätigt';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#F48FB1';
      case 'payment_pending': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'completed': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      case 'confirmed': return '#F48FB1';
      default: return '#6b7280';
    }
  };

  const getTicketStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in_progress': return 'In Bearbeitung';
      case 'resolved': return 'Gel\u00f6st';
      case 'closed': return 'Geschlossen';
      default: return status;
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'resolved': return '#22c55e';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const fetchMyTickets = async (uid: string) => {
    try {
      const res = await fetch(`/api/tickets?raisedByUid=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('bookme_user');
    localStorage.removeItem('userEmail');
    window.location.reload();
  };

  if (!authChecked || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#F48FB1] rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Laden...</p>
        </div>
      </main>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar user={undefined} onLogout={() => {}} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <FiLock className="w-16 h-16 text-[#F48FB1] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anmeldung erforderlich</h2>
          <p className="text-gray-600 mb-6">Melde dich an, um deine Bestellungen zu sehen.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/login"
              className="bg-[#F48FB1] hover:bg-[#EC407A] text-white font-semibold py-3 px-6 rounded-lg transition inline-block"
              style={{ textDecoration: "none" }}
            >
              Zum Login
            </a>
            <a
              href="/register"
              className="bg-[#E4DED5] hover:bg-[#d2cbb7] text-[#1F1F1F] font-semibold py-3 px-6 rounded-lg transition inline-block"
              style={{ textDecoration: "none" }}
            >
              Registrieren
            </a>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar user={{ email: user.email, username: user.username }} onLogout={handleLogout} />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FiShoppingBag className="mr-2 text-[#F48FB1]" /> Meine Anfragen
          </h1>
          <p className="text-gray-600">Verfolge den Status deiner Kaufanfragen, <strong>{user.name || user.username}</strong></p>
        </div>

        {/* Results */}
        {requests.length === 0 && (
          <div className="text-center py-16">
            <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Keine Anfragen</h2>
            <p className="text-gray-600 mb-6">Du hast noch keine Kaufanfragen gesendet.</p>
            <a
              href="/sellers"
              className="bg-[#F48FB1] hover:bg-[#EC407A] text-white font-medium py-2 px-4 rounded-lg transition inline-block"
              style={{ textDecoration: "none" }}
            >
              Marktplatz entdecken
            </a>
          </div>
        )}

        {requests.length > 0 && (
          <div className="space-y-6">
            {requests.map((request) => {
              const salon = salons[request.salonUid || request.sellerUid || ''];
              const items = request.items || request.services || [];
              return (
                <div
                  key={request._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <a
                          href={`/seller/${slugify(salon?.name || '')}`}
                          className="hover:underline hover:text-[#F48FB1] transition-colors"
                        >
                          {salon?.name || 'Verkäufer'}
                        </a>
                      </h3>
                      {salon?.location && (
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <FiMapPin className="w-4 h-4 mr-1" />
                          {salon.location}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('de-DE', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Items with images */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Produkte:</h4>
                    <div className="space-y-2">
                      {items.map((item: any, index: number) => {
                        const addons = item.selectedAdditionalServices || [];
                        const addonServices = item.additionalServices || [];
                        const addonsTotal = addons.reduce((sum: number, name: string) => {
                          const a = addonServices.find((x: any) => x.name === name);
                          return sum + (a?.price || 0);
                        }, 0);
                        const basePrice = item.price - addonsTotal;
                        return (
                        <div key={index}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover border border-gray-200" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-gray-700 text-sm">{item.name}</span>
                                {item.selectedWearDays && (
                                  <span className="text-xs text-[#F48FB1]">{item.selectedWearDays} {item.selectedWearDays === 1 ? 'Tag' : 'Tage'} getragen</span>
                                )}
                              </div>
                            </div>
                            <span className="font-medium text-gray-900 text-sm">€{addons.length > 0 ? basePrice : item.price}</span>
                          </div>
                          {addons.length > 0 && (
                            <div className="ml-[3.25rem] mt-1 space-y-0.5">
                              {addons.map((addonName: string, idx: number) => {
                                const addon = addonServices.find((a: any) => a.name === addonName);
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs text-gray-500">
                                    <span>+ {addonName}</span>
                                    {addon && <span className="text-green-700 font-medium">+€{addon.price}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                      <span className="font-medium text-gray-900">Gesamt:</span>
                      <span className="text-lg font-bold text-[#F48FB1]">€{request.total}</span>
                    </div>
                  </div>

                  {/* Special needs */}
                  {request.specialNeeds && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Besondere Wünsche:</span>
                      <p className="text-sm text-gray-700">{request.specialNeeds}</p>
                    </div>
                  )}

                  {/* Shipping address */}
                  {request.shippingAddress && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Lieferadresse:</span>
                      <p className="text-sm text-gray-700">
                        {request.shippingAddress.street} {request.shippingAddress.number}, {request.shippingAddress.zip} {request.shippingAddress.city}, {request.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {/* Payment instructions when accepted */}
                  {(request.status === 'accepted' || request.status === 'payment_pending') && request.paymentInstructions && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-1 text-sm">Zahlungsinformationen:</h4>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{request.paymentInstructions}</p>
                    </div>
                  )}

                  {/* Status timeline */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-xs">
                      {['pending', 'accepted', 'shipped', 'completed'].map((s, i) => {
                        const statusOrder = ['pending', 'accepted', 'shipped', 'completed'];
                        const currentIdx = statusOrder.indexOf(request.status);
                        const stepIdx = i;
                        const isActive = stepIdx <= currentIdx && !['rejected', 'cancelled'].includes(request.status);
                        const isRejected = ['rejected', 'cancelled'].includes(request.status);
                        return (
                          <React.Fragment key={s}>
                            {i > 0 && <div className={`flex-1 h-0.5 ${isActive ? 'bg-[#F48FB1]' : isRejected ? 'bg-red-200' : 'bg-gray-200'}`} />}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-[#F48FB1] text-white' : 
                              isRejected ? 'bg-red-200 text-red-600' : 
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {i + 1}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                      <span>Gesendet</span>
                      <span>Angenommen</span>
                      <span>Versendet</span>
                      <span>Fertig</span>
                    </div>
                  </div>

                  {/* Review button for completed orders */}
                  {(request.status === 'completed' || request.status === 'shipped') && (
                    <div className="mt-3">
                      <button
                        onClick={() => setReviewingRequest(request)}
                        className="text-[#F48FB1] hover:text-[#EC407A] font-medium text-sm flex items-center gap-1"
                      >
                        <FiStar className="w-4 h-4" /> Bewertung schreiben
                      </button>
                    </div>
                  )}

                  {/* Chat + Ticket buttons */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                    <button
                      onClick={() => openChat(request._id)}
                      className="flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
                    >
                      <FiMessageSquare className="w-4 h-4" /> Nachricht an Verkäufer
                    </button>
                    {(() => {
                      const existingTicket = myTickets.find((t: any) => t.bookingId === request._id);
                      if (existingTicket) {
                        return (
                          <button
                            onClick={() => setTicketDetailId(ticketDetailId === request._id ? null : request._id)}
                            className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                          >
                            <FiAlertTriangle className="w-4 h-4" />
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ background: getTicketStatusColor(existingTicket.status) }}
                            />
                            Ticket Status
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => { setShowTicketForm(true); setTicketBookingId(request._id); }}
                          className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                        >
                          <FiAlertTriangle className="w-4 h-4" /> Problem melden
                        </button>
                      );
                    })()}
                  </div>
                  {/* Ticket status detail */}
                  {(() => {
                    const existingTicket = myTickets.find((t: any) => t.bookingId === request._id);
                    if (ticketDetailId === request._id && existingTicket) {
                      return (
                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{existingTicket.subject}</h4>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                              style={{ background: getTicketStatusColor(existingTicket.status) }}
                            >
                              {getTicketStatusLabel(existingTicket.status)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{existingTicket.description}</p>
                          <p className="text-gray-400 text-xs mb-2">
                            Erstellt: {new Date(existingTicket.createdAt).toLocaleDateString('de-DE')} · {new Date(existingTicket.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {existingTicket.adminNotes && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                              <p className="text-xs font-medium text-blue-700 mb-1">Admin-Antwort:</p>
                              <p className="text-sm text-blue-900">{existingTicket.adminNotes}</p>
                            </div>
                          )}
                          {existingTicket.messages && existingTicket.messages.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {existingTicket.messages.map((msg: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`rounded-md p-2 text-sm ${
                                    msg.senderRole === 'admin'
                                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                                      : 'bg-white border border-gray-200 text-gray-800'
                                  }`}
                                >
                                  <span className="font-medium text-xs">
                                    {msg.senderRole === 'admin' ? 'Admin' : msg.senderName}:
                                  </span>{' '}
                                  {msg.text}
                                  <span className="text-xs text-gray-400 ml-2">
                                    {new Date(msg.createdAt).toLocaleDateString('de-DE')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* Review Modal */}
        {reviewingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">Bewertung schreiben</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F1F1F] mb-2">Bewertung</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <FiStar 
                          className={`w-8 h-8 ${star <= reviewRating ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F1F1F] mb-2">Deine Rezension</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-3 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#F48FB1] focus:border-transparent text-[#1F1F1F]"
                    rows={4}
                    placeholder="Teile deine Erfahrung..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !reviewComment.trim()}
                    className="flex-1 bg-[#F48FB1] hover:bg-[#EC407A] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {submittingReview ? 'Wird gesendet...' : 'Bewertung abschicken'}
                  </button>
                  <button
                    onClick={() => {
                      setReviewingRequest(null);
                      setReviewRating(5);
                      setReviewComment('');
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Ticket Modal */}
        {showTicketForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiAlertTriangle className="text-red-500" />
                  Problem melden
                </h3>
                <button
                  onClick={() => { setShowTicketForm(false); setTicketSubject(""); setTicketDescription(""); setTicketBookingId(null); }}
                  className="text-gray-400 hover:text-gray-700 text-xl"
                >×</button>
              </div>
              {ticketBookingId && (
                <p className="text-xs text-gray-500 mb-3">Bezogen auf Bestellung: {ticketBookingId}</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F48FB1]"
                    placeholder="Kurze Beschreibung des Problems"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea
                    value={ticketDescription}
                    onChange={e => setTicketDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F48FB1]"
                    rows={4}
                    placeholder="Beschreiben Sie das Problem im Detail..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitTicket}
                    disabled={ticketSubmitting || !ticketSubject.trim() || !ticketDescription.trim()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {ticketSubmitting ? 'Wird gesendet...' : 'Problem melden'}
                  </button>
                  <button
                    onClick={() => { setShowTicketForm(false); setTicketSubject(""); setTicketDescription(""); setTicketBookingId(null); }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 z-[200]"
          style={{ transform: 'translateX(-50%)', animation: 'toastSlideIn 0.3s ease-out' }}
        >
          <style>{`@keyframes toastSlideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border ${
            toast.type === 'success'
              ? 'bg-white border-[#F48FB1] text-[#1F1F1F]'
              : 'bg-white border-red-400 text-[#1F1F1F]'
          }`}>
            <span className={`text-lg ${
              toast.type === 'success' ? 'text-[#F48FB1]' : 'text-red-500'
            }`}>
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <Footer />
      {/* Floating Chat Widget */}
      {user && (
        <ChatWidget
          userUid={user.uid}
          userName={user.name || user.username || user.email || 'Käufer'}
          userRole="buyer"
          openBookingId={chatBookingId}
          onExternalClose={() => setChatBookingId(null)}
        />
      )}
    </main>
  );
}