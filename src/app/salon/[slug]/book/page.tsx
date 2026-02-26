"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiMapPin, FiArrowLeft, FiShoppingBag, FiLock } from "react-icons/fi";
import Footer from "@/components/footer";

type Salon = {
  _id: string;
  uid: string;
  name: string;
  contact: string;
  description: string;
  location: string;
  imageUrls: string[];
};

type Service = {
  _id: string;
  name: string;
  imageUrl?: string;
  uid: string;
  salonName?: string;
  serviceType?: string;
  durationPrices?: { duration: number; price: number }[];
  price?: number;
  duration?: number;
  selectedOption?: { duration: number; price: number };
};

type User = {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  role: string;
};

export default function PurchaseRequestPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [requestId, setRequestId] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Buyer form fields
  const [buyerName, setBuyerName] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  // Shipping address
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setBuyerName(data.name || data.username || '');
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    let loadedSalon = false;
    let loadedServices = false;

    async function fetchSalon() {
      let salonFromStorage: Salon | null = null;
      if (typeof window !== "undefined") {
        const savedSalon = window.localStorage.getItem("salon_booking_salon");
        if (savedSalon) {
          try {
            salonFromStorage = JSON.parse(savedSalon);
          } catch {}
        }
      }
      if (salonFromStorage) {
        setSalon(salonFromStorage);
        loadedSalon = true;
        if (loadedServices) setLoading(false);
        return;
      }

      const res = await fetch(`/api/salons?name=${encodeURIComponent(slug as string)}`);
      const data = await res.json();
      setSalon(data.salon || null);
      loadedSalon = true;
      if (loadedServices) setLoading(false);
    }

    function fetchServices() {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("salon_cart_services") : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setServices(parsed);
        } catch {}
      }
      loadedServices = true;
      if (loadedSalon) setLoading(false);
    }

    setLoading(true);
    fetchSalon();
    fetchServices();
  }, [slug]);

  const removeService = (serviceId: string) => {
    setServices(prev => {
      const updated = prev.filter(s => s._id !== serviceId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("salon_cart_services", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const total = services.reduce((sum, s) => sum + (s.price || 0), 0);

  const isFormValid = buyerName.trim() !== '' && street.trim() !== '' && zip.trim() !== '' && city.trim() !== '' && user !== null;

  async function submitPurchaseRequest() {
    if (!salon || !services.length || !isFormValid || !user) return;

    setSubmitting(true);
    try {
      const requestData = {
        salonId: salon._id,
        sellerId: salon._id,
        salonUid: salon.uid,
        sellerUid: salon.uid,
        services: services.map(s => ({
          id: s._id,
          name: s.name,
          price: s.price || 0,
          imageUrl: s.imageUrl || '',
          selectedOption: s.selectedOption
        })),
        items: services.map(s => ({
          id: s._id,
          name: s.name,
          price: s.price || 0,
          imageUrl: s.imageUrl || '',
          selectedOption: s.selectedOption
        })),
        buyerName,
        customerName: buyerName,
        buyerUid: user.uid,
        buyerEmail: user.email || `${user.username}@buyer.local`,
        shippingAddress: {
          street: street.trim(),
          number: houseNumber.trim(),
          zip: zip.trim(),
          city: city.trim(),
          country: country.trim(),
        },
        specialNeeds,
        total,
        status: 'pending'
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await res.json();
      if (result.ok) {
        setRequestId(result.bookingId || result.requestId || '');
        setStep('confirmation');
        // Clear cart
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("salon_cart_services");
          window.localStorage.removeItem("salon_booking_salon");
        }
      } else {
        alert('Fehler beim Senden der Anfrage: ' + (result.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Purchase request error:', error);
      alert('Fehler beim Senden der Anfrage. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#5C6F68] rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Laden...</p>
        </div>
      </main>
    );
  }

  // Require login
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-center max-w-md px-4">
          <FiLock className="w-12 h-12 text-[#5C6F68] mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2 text-gray-900">Anmeldung erforderlich</h2>
          <p className="text-gray-600 mb-6">Du musst angemeldet sein, um eine Kaufanfrage zu senden.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white px-6 py-3 text-sm font-medium transition-colors rounded-lg"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('bookme_redirect_after_login', window.location.pathname);
                }
                router.push('/login');
              }}
            >
              Zum Login
            </button>
            <button
              className="bg-[#E4DED5] hover:bg-[#d2cbb7] text-[#1F1F1F] px-6 py-3 text-sm font-medium transition-colors rounded-lg"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('bookme_redirect_after_login', window.location.pathname);
                }
                router.push('/register');
              }}
            >
              Registrieren
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!salon || services.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-center max-w-md">
          <FiShoppingBag className="w-12 h-12 text-[#E4DED5] mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-4 text-gray-900">Keine Produkte ausgewählt</h2>
          <p className="text-gray-600 mb-6">Bitte wähle zuerst Produkte aus, bevor du eine Anfrage sendest.</p>
          <button
            className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white px-6 py-3 text-sm font-medium transition-colors rounded-lg"
            onClick={() => router.push("/salons")}
          >
            Zum Marktplatz
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-[#E4DED5] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex items-center h-16">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-[#5C6F68] hover:text-[#4a5a54] transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Zurück
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 lg:px-8">
        {step === 'form' && (
          <>
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Kaufanfrage senden</h1>
              <p className="text-gray-600">an <span className="font-semibold">{salon.name}</span></p>
              {salon.location && (
                <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
                  <FiMapPin className="w-3 h-3" />
                  <span>{salon.location}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
              {/* Products Summary */}
              <div className="lg:col-span-3">
                <div className="bg-white border border-[#E4DED5] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#1F1F1F] mb-4">Ausgewählte Produkte</h2>
                  <div className="space-y-3">
                    {services.map(service => (
                      <div key={service._id} className="flex items-center justify-between py-3 border-b border-[#E4DED5] last:border-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {service.imageUrl && (
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-[#E4DED5]"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="font-medium text-[#1F1F1F] text-sm sm:text-base truncate">{service.name}</h3>
                            {service.selectedOption && (
                              <span className="text-xs sm:text-sm text-gray-500">
                                Variante: {service.selectedOption.duration} Min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="font-semibold text-[#1F1F1F]">€{service.price}</span>
                          <button
                            className="text-red-400 hover:text-red-600 text-lg font-bold px-2"
                            onClick={() => removeService(service._id)}
                            aria-label={`Entfernen ${service.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E4DED5] flex justify-between items-center">
                    <span className="font-semibold text-[#1F1F1F]">Gesamt</span>
                    <span className="text-xl font-bold text-[#1F1F1F]">€{total}</span>
                  </div>
                </div>
              </div>

              {/* Buyer Form */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-[#E4DED5] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#1F1F1F] mb-4">Deine Daten</h2>
                  <div className="space-y-4">
                    <div className="bg-[#E4DED5]/30 rounded-lg p-3 text-sm text-[#5C6F68]">
                      Angemeldet als <strong>{user?.name || user?.username}</strong>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1F1F1F] mb-1">Name *</label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F]"
                        placeholder="Dein Name"
                        required
                      />
                    </div>

                    {/* Shipping address */}
                    <div className="pt-2 border-t border-[#E4DED5]">
                      <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3">Lieferadresse *</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Straße</label>
                            <input
                              type="text"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F] text-sm"
                              placeholder="Musterstraße"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Nr.</label>
                            <input
                              type="text"
                              value={houseNumber}
                              onChange={(e) => setHouseNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F] text-sm"
                              placeholder="12a"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">PLZ</label>
                            <input
                              type="text"
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                              className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F] text-sm"
                              placeholder="10115"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Stadt</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F] text-sm"
                              placeholder="Berlin"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Land</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F] text-sm"
                            placeholder="Deutschland"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1F1F1F] mb-1">Besondere Wünsche</label>
                      <textarea
                        value={specialNeeds}
                        onChange={(e) => setSpecialNeeds(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E4DED5] rounded-lg focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent text-[#1F1F1F]"
                        rows={3}
                        placeholder="Optionale Nachricht an den Verkäufer..."
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={submitPurchaseRequest}
                      disabled={submitting || !isFormValid}
                      className="w-full bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {submitting ? 'Wird gesendet...' : 'Kaufanfrage senden'}
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Deine Anfrage wird an den Verkäufer gesendet. Du kannst den Status unter &quot;Meine Anfragen&quot; verfolgen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Confirmation */}
        {step === 'confirmation' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white border border-[#E4DED5] rounded-xl p-8 sm:p-12">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: '#9DBE8D' }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] mb-4">Anfrage gesendet!</h2>
              <p className="text-gray-600 mb-6">
                Deine Kaufanfrage wurde erfolgreich an <strong>{salon.name}</strong> gesendet.
                Du kannst den Status jederzeit unter &quot;Meine Anfragen&quot; verfolgen.
              </p>
              {requestId && (
                <div className="bg-[#E4DED5] rounded-lg p-4 mb-6 inline-block">
                  <p className="text-sm text-[#1F1F1F]">
                    Anfrage-ID: <strong>{requestId}</strong>
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-8 text-left">
                <h3 className="font-semibold text-[#1F1F1F] mb-3">So geht es weiter:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="bg-[#5C6F68] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                    Der Verkäufer prüft deine Anfrage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-[#5C6F68] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                    Du erhältst die Zahlungsinformationen
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-[#5C6F68] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                    Nach Zahlungseingang wird deine Bestellung versendet
                  </li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white px-6 py-3 font-semibold transition-colors rounded-lg"
                  onClick={() => router.push('/bookings')}
                >
                  Meine Anfragen verfolgen
                </button>
                <button
                  className="bg-[#E4DED5] hover:bg-[#d2cbb7] text-[#1F1F1F] px-6 py-3 font-semibold transition-colors rounded-lg"
                  onClick={() => router.push('/salons')}
                >
                  Weiter stöbern
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}