"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import { FiShoppingBag, FiMapPin, FiStar, FiLock } from "react-icons/fi";

const COLORS = {
  primary: "#5C6F68",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#9DBE8D",
};

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
  }[];
  items?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
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
  const router = useRouter();

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
      
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonUid: sellerUid,
          sellerUid: sellerUid,
          buyerUid: user.uid,
          buyerEmail: user.email || '',
          customerName: reviewingRequest.buyerName || reviewingRequest.customerName || user.name,
          rating: reviewRating,
          comment: reviewComment,
          serviceName: firstItem?.name || '',
          bookingId: reviewingRequest._id,
          requestId: reviewingRequest._id
        })
      });

      if (res.ok) {
        setReviewingRequest(null);
        setReviewRating(5);
        setReviewComment('');
        alert('Bewertung erfolgreich abgegeben!');
      } else {
        const data = await res.json();
        alert(data.error || 'Fehler beim Senden der Bewertung');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Fehler beim Senden der Bewertung');
    } finally {
      setSubmittingReview(false);
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
      case 'accepted': return '#9DBE8D';
      case 'payment_pending': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'completed': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      case 'confirmed': return '#9DBE8D';
      default: return '#6b7280';
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
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#5C6F68] rounded-full animate-spin"></div>
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
          <FiLock className="w-16 h-16 text-[#5C6F68] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anmeldung erforderlich</h2>
          <p className="text-gray-600 mb-6">Melde dich an, um deine Bestellungen zu sehen.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/login"
              className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-semibold py-3 px-6 rounded-lg transition inline-block"
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
            <FiShoppingBag className="mr-2 text-[#5C6F68]" /> Meine Anfragen
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
              href="/salons"
              className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-medium py-2 px-4 rounded-lg transition inline-block"
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
                        {salon?.name || 'Verkäufer'}
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
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  {/* Items with images */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Produkte:</h4>
                    <div className="space-y-2">
                      {items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover border border-gray-200" />
                            )}
                            <span className="text-gray-700 text-sm">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-900 text-sm">€{item.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                      <span className="font-medium text-gray-900">Gesamt:</span>
                      <span className="text-lg font-bold text-[#5C6F68]">€{request.total}</span>
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
                            {i > 0 && <div className={`flex-1 h-0.5 ${isActive ? 'bg-[#9DBE8D]' : isRejected ? 'bg-red-200' : 'bg-gray-200'}`} />}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-[#9DBE8D] text-white' : 
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
                        className="text-[#5C6F68] hover:text-[#4a5a54] font-medium text-sm flex items-center gap-1"
                      >
                        <FiStar className="w-4 h-4" /> Bewertung schreiben
                      </button>
                    </div>
                  )}
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
                          className={`w-8 h-8 ${star <= reviewRating ? 'text-[#9DBE8D] fill-current' : 'text-gray-300'}`} 
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
                    className="w-full p-3 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F]"
                    rows={4}
                    placeholder="Teile deine Erfahrung..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !reviewComment.trim()}
                    className="flex-1 bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
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
      </div>
      <Footer />
    </main>
  );
}