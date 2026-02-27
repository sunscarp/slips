"use client";
import React, { useEffect, useState, useRef, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiMapPin, FiPhone, FiClock, FiStar, FiArrowLeft, FiUser } from "react-icons/fi";
import { GiUnderwear } from "react-icons/gi";
import Footer from "@/components/footer";
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/navbar";

// Color palette (same as dashboard)
const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
  background: "#FAFAFA",
  card: "#fff",
  border: "#E4DED5"
};

type Salon = {
  _id: string;
  uid: string;
  name: string;
  contact: string;
  description: string;
  location: string;
  imageUrls: string[];
  googleMapsAddress?: string;
  height?: string;
  weight?: string;
  size?: string;
  hobbies?: string;
  serviceHours?: string;
  verified?: boolean;
};

type Service = {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  uid: string;
  salonName?: string;
  serviceType?: string;
  durationPrices?: { duration: number; price: number }[];
  selectedOption?: { duration: number; price: number };
  price?: number;
  duration?: number;
  timeWorn?: number;
  additionalServices?: { name: string; price: number }[];
  selectedAdditionalServices?: string[];
  wearDurationEnabled?: boolean;
  minWearDays?: number;
  maxWearDays?: number;
  pricePerDay?: number;       // legacy, kept for compat
  basePrice?: number;
  extraPricePerDay?: number;
  selectedWearDays?: number;
  requiresAddress?: boolean;
};

type Review = {
  _id: string;
  salonUid: string;
  salonName: string;
  customerUid: string;
  customerName: string;
  rating: number;
  comment: string;
  serviceName: string;
  employeeName: string;
  bookingId: string;
  createdAt: string;
  updatedAt: string;
};

export default function SalonPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [cartServices, setCartServices] = useState<Service[]>([]);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const servicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [detailsService, setDetailsService] = useState<Service | null>(null);
  const [serviceReviews, setServiceReviews] = useState<Review[]>([]);
  const [serviceAverageRating, setServiceAverageRating] = useState<number>(0);
  const [selectedDurations, setSelectedDurations] = useState<{ [serviceId: string]: { duration: number; price: number } }>({});
  const [selectedAdditionals, setSelectedAdditionals] = useState<{ [serviceId: string]: string[] }>({});
  const [selectedWearDays, setSelectedWearDays] = useState<{ [serviceId: string]: number }>({});
  const [currentUser, setCurrentUser] = useState<{ uid: string; name?: string; username?: string; email?: string } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Fetch current user for chat
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(u => setCurrentUser(u || null))
      .catch(() => setCurrentUser(null));
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("salon_cart_services") : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCartServices(parsed);
      } catch {}
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("salon_cart_services", JSON.stringify(cartServices));
    }
  }, [cartServices]);

  useEffect(() => {
    async function fetchSalonAndServices() {
      setLoading(true);
      // Fetch salon details by name
      const salonRes = await fetch(`/api/salons?name=${encodeURIComponent(slug as string)}`);
      const salonData = await salonRes.json();
      setSalon(salonData.salon);

      // Fetch services for this salon by uid
      if (salonData.salon?.uid) {
        const servicesRes = await fetch(`/api/services?uid=${encodeURIComponent(salonData.salon.uid)}`);
        const servicesData = await servicesRes.json();
        setServices(servicesData.services);
      } else {
        setServices([]);
      }

      setLoading(false);
    }
    if (slug) fetchSalonAndServices();
  }, [slug]);

  // Carousel scroll logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: "left" | "right") => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  // Group services by serviceType
  const serviceTypeMap: { [type: string]: Service[] } = {};
  services.forEach(service => {
    const type = service.serviceType || "Other";
    if (!serviceTypeMap[type]) serviceTypeMap[type] = [];
    serviceTypeMap[type].push(service);
  });
  const serviceTypes = Object.keys(serviceTypeMap);

  // Add "Alle Produkte" option
  const allServiceTypes = ["Alle Produkte", ...serviceTypes];

  useEffect(() => {
    if (serviceTypes.length > 0 && !selectedType) setSelectedType("Alle Produkte");
  }, [services]);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add/remove service from cart with selected duration/price and additional services
  const toggleServiceInCart = (service: Service, selectedOption?: { duration: number; price: number }) => {
    setCartServices(prev => {
      const exists = prev.find(s => s._id === service._id);
      if (exists) {
        return prev.filter(s => s._id !== service._id);
      } else {
        const addons = selectedAdditionals[service._id] || [];
        // Wear-duration slider pricing
        if (service.wearDurationEnabled) {
          const days = selectedWearDays[service._id] ?? service.minWearDays ?? 1;
          const bp = service.basePrice ?? service.pricePerDay ?? 0;
          const epd = service.extraPricePerDay ?? 0;
          const min = service.minWearDays ?? 1;
          const basePrice = bp + Math.max(0, days - min) * epd;
          const addonsTotal = addons.reduce((sum, name) => {
            const addon = service.additionalServices?.find(a => a.name === name);
            return sum + (addon?.price || 0);
          }, 0);
          return [...prev, {
            ...service,
            price: basePrice + addonsTotal,
            selectedWearDays: days,
            selectedAdditionalServices: addons,
          }];
        }
        const option = selectedOption || selectedDurations[service._id] || (service.durationPrices && service.durationPrices[0]) || (service.price ? { duration: 0, price: service.price } : undefined);
        const basePrice = option?.price || service.price || 0;
        const addonsTotal = addons.reduce((sum, name) => {
          const addon = service.additionalServices?.find(a => a.name === name);
          return sum + (addon?.price || 0);
        }, 0);
        return [...prev, { 
          ...service, 
          price: basePrice + addonsTotal,
          duration: option?.duration || 0,
          selectedOption: option,
          selectedAdditionalServices: addons,
        }];
      }
    });
  };

  // Proceed to purchase request with selected products
  const proceedToBooking = () => {
    if (cartServices.length > 0 && salon) {
      // Save seller details to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem("salon_booking_salon", JSON.stringify(salon));
      }
      // Pass selected product IDs as query param
      const ids = cartServices.map(s => s._id).join(",");
      router.push(`/seller/${slug}/book?serviceIds=${ids}`);
    }
  };

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      if (!salon?.uid) return;
      
      try {
        const reviewsRes = await fetch(`/api/reviews?salonUid=${salon.uid}`);
        const reviewsData = await reviewsRes.json();
        const fetchedReviews = reviewsData.reviews || [];
        setReviews(fetchedReviews);
        
        // Use API-provided values, or calculate locally as fallback
        if (fetchedReviews.length > 0) {
          const calcTotal = fetchedReviews.reduce((sum: number, r: Review) => sum + Number(r.rating || 0), 0);
          const calcAvg = Math.round((calcTotal / fetchedReviews.length) * 10) / 10;
          setAverageRating(reviewsData.averageRating || calcAvg);
          setTotalReviews(reviewsData.totalReviews || fetchedReviews.length);
        } else {
          setAverageRating(0);
          setTotalReviews(0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    }

    fetchReviews();
  }, [salon?.uid]);

  // Fetch reviews for a specific product
  const openServiceDetails = async (service: Service) => {
    setDetailsService(service);
    // Fetch reviews for this service in this salon
    if (salon?.uid) {
      try {
        const res = await fetch(`/api/reviews?salonUid=${salon.uid}&serviceName=${encodeURIComponent(service.name)}`);
        const data = await res.json();
        setServiceReviews(data.reviews || []);
        setServiceAverageRating(data.averageRating || 0);
      } catch {
        setServiceReviews([]);
        setServiceAverageRating(0);
      }
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Navbar user={currentUser ? { email: currentUser.email, username: currentUser.username } : undefined} />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F48FB1] mx-auto mb-4"></div>
          <p className="text-[#F48FB1] text-lg">Laden...</p>
        </div>
      </div>
    </main>
  );
  
  if (!salon) return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Navbar user={currentUser ? { email: currentUser.email, username: currentUser.username } : undefined} />
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verkäufer nicht gefunden</h2>
          <p className="text-gray-600 mb-4">Bitte überprüfe den Link oder versuche es erneut.</p>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen font-sans bg-[#FAFAFA]">
      {/* Navigation Bar */}
      <Navbar user={currentUser ? { email: currentUser.email, username: currentUser.username } : undefined} />

      {/* Main Content Container */}
      <div className="px-2 sm:px-4 lg:px-8 pt-6 pb-2 w-full max-w-6xl mx-auto">
        {/* Salon Name & Ratings */}
        <section className="w-full text-left mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#1F1F1F] mb-2 sm:mb-3 break-words flex items-center gap-2">
              {salon.name}
              {salon.verified && (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#2196F3" />
                  <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </h1>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={`w-5 h-5 sm:w-6 sm:h-6 ${i < Math.floor(averageRating) ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} />
              ))}
              <span className="text-gray-600 ml-2 font-medium text-base sm:text-lg">
                {averageRating.toFixed(1)} <span className="text-xs">({totalReviews} Bewertungen)</span>
              </span>
            </div>
          </div>
          {/* Buttons: smaller and side by side on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 mt-2 md:mt-0 w-full sm:w-auto">
            <button
              className="bg-[#F48FB1] hover:bg-[#EC407A] text-white font-semibold py-2 px-2 sm:py-3 sm:px-6 rounded-lg transition-all duration-200 text-xs sm:text-base"
              onClick={scrollToServices}
            >
              Produkte ansehen
            </button>
            <button
              className="bg-[#E4DED5] hover:bg-[#d2cbb7] text-[#1F1F1F] font-semibold py-2 px-2 sm:py-3 sm:px-6 rounded-lg transition-all duration-200 text-xs sm:text-base"
              onClick={scrollToAbout}
            >
              Über mich
            </button>
          </div>
        </section>

        {/* Image Carousel - Professional Layout */}
        <section className="w-full py-2 sm:py-4 mb-2">
          <div className="relative w-full">
            {salon.imageUrls && salon.imageUrls.length > 0 && (
              <>
                <button
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200"
                  onClick={() => scrollCarousel("left")}
                  aria-label="Scroll left"
                  style={{ display: salon.imageUrls.length > 1 ? "block" : "none" }}
                >
                  <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#F48FB1]" />
                </button>
                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto scroll-smooth rounded-xl sm:rounded-2xl gap-2 sm:gap-4"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {salon.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="min-w-0 w-full sm:min-w-[350px] sm:max-w-[600px] aspect-video sm:aspect-[16/10] flex-shrink-0 cursor-pointer"
                      style={{ scrollSnapAlign: "center" }}
                      onClick={() => setZoomedImage(url)}
                    >
                      <img
                        src={url}
                        alt={`${salon.name} - Image ${i + 1}`}
                        className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                        style={{
                          objectFit: "cover",
                          objectPosition: "center"
                        }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200"
                  onClick={() => scrollCarousel("right")}
                  aria-label="Scroll right"
                  style={{ display: salon.imageUrls.length > 1 ? "block" : "none" }}
                >
                  <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#F48FB1] rotate-180" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Location & Contact */}
        <section className="w-full text-left mb-2">
          <div className="flex flex-col gap-2">
            {salon.location && (
              <div className="flex items-center text-gray-700">
                <FiMapPin className="text-[#F48FB1] w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                <span className="font-medium text-base sm:text-lg break-words">{salon.location}</span>
              </div>
            )}
            {salon.contact && (
              <div className="flex items-center text-gray-700">
                <FiPhone className="text-[#F48FB1] w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                <span className="font-medium text-base sm:text-lg break-words">{salon.contact}</span>
              </div>
            )}
          </div>
        </section>

        {/* Services Section */}
        <section ref={servicesRef} className="bg-[#FAFAFA] py-8 sm:py-16 text-left">
          <div className="w-full">
            <div className="mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-2 sm:mb-4 tracking-tight">Meine Produkte</h2>
              <p className="text-gray-600 text-base sm:text-lg">Entdecke exklusive Produkte</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              {/* Left: Service Types */}
              <div className="w-full sm:min-w-[280px] sm:w-auto mb-4 sm:mb-0 overflow-x-auto">
                <ul className="flex sm:block gap-2 sm:gap-0 space-y-0 sm:space-y-1">
                  {allServiceTypes.map(type => (
                    <li key={type} className="flex-shrink-0 w-auto">
                      <button
                        className={`w-full text-left px-4 sm:px-6 py-2 sm:py-4 rounded-lg font-medium transition-colors flex items-center justify-between whitespace-nowrap text-sm sm:text-base ${
                          selectedType === type
                            ? "bg-[#F48FB1] text-white shadow-sm"
                            : "bg-white text-[#F48FB1] hover:bg-[#FCE4EC] hover:text-[#EC407A]"
                        }`}
                        onClick={() => setSelectedType(type)}
                      >
                        <div className="flex items-center">
                          <span className="font-semibold">{type}</span>
                          <span className="ml-2 text-xs sm:text-sm text-gray-500">
                            ({type === "Alle Produkte"
                              ? services.length
                              : serviceTypeMap[type]?.length || 0})
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Right: Services for selected type */}
              <div className="flex-1 w-full">
                {(selectedType === "Alle Produkte"
                  ? services.length > 0
                  : serviceTypeMap[selectedType ?? ""]?.length > 0) ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {(selectedType === "Alle Produkte"
                      ? services
                      : serviceTypeMap[selectedType ?? ""]
                    ).map(service => (
                      <div key={service._id} className="bg-white border border-[#E4DED5] rounded-lg hover:shadow-md transition-all duration-200 flex flex-col">
                        {service.imageUrl && (
                          <div className="w-full h-36 sm:h-44 overflow-hidden rounded-t-lg cursor-pointer" onClick={() => setZoomedImage(service.imageUrl!)}>
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-2 sm:p-3 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-1 gap-1">
                            <h3 className="text-sm sm:text-base font-semibold text-[#1F1F1F] leading-tight line-clamp-2">{service.name}</h3>
                          </div>
                          
                          {/* Price / Variants / Wear Duration Slider */}
                          {service.wearDurationEnabled && (service.basePrice ?? service.pricePerDay) && service.minWearDays && service.maxWearDays ? (
                            <div className="mt-auto pt-1">
                              {(() => {
                                const days = selectedWearDays[service._id] ?? service.minWearDays;
                                const bp = service.basePrice ?? service.pricePerDay ?? 0;
                                const epd = service.extraPricePerDay ?? 0;
                                const min = service.minWearDays!;
                                const computedPrice = bp + Math.max(0, days - min) * epd;
                                const inCart = cartServices.find(s => s._id === service._id);
                                const minPrice = bp;
                                const maxPrice = bp + (service.maxWearDays! - min) * epd;
                                return (
                                  <>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-500">Tage wählen:</span>
                                      <span className="text-sm font-bold text-[#1F1F1F]">
                                        {days} {days === 1 ? 'Tag' : 'Tage'} — <span className="text-[#F48FB1]">€{computedPrice.toFixed(2)}</span>
                                      </span>
                                    </div>
                                    {days > min && epd > 0 && (
                                      <p className="text-[10px] text-gray-400 mb-1">
                                        €{bp.toFixed(2)} + {days - min} × €{epd.toFixed(2)}
                                      </p>
                                    )}
                                    <input
                                      type="range"
                                      min={service.minWearDays}
                                      max={service.maxWearDays}
                                      step={1}
                                      value={days}
                                      disabled={!!inCart}
                                      onChange={e => {
                                        const newDays = Number(e.target.value);
                                        setSelectedWearDays(prev => ({ ...prev, [service._id]: newDays }));
                                      }}
                                      style={{ accentColor: '#F48FB1' }}
                                      className="w-full h-2 rounded-lg cursor-pointer disabled:opacity-50"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                      <span>{min}T — €{minPrice.toFixed(2)}</span>
                                      <span>{service.maxWearDays}T — €{maxPrice.toFixed(2)}</span>
                                    </div>
                                    <button
                                      className={`mt-2 w-full font-semibold py-1 px-2 rounded-md transition-all text-xs ${
                                        inCart ? 'bg-red-500 text-white' : 'bg-[#F48FB1] text-white hover:bg-[#EC407A]'
                                      }`}
                                      onClick={() => toggleServiceInCart(service)}
                                    >
                                      {inCart ? `✕ Entfernen (€${inCart.price.toFixed(2)})` : 'Hinzufügen'}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          ) : service.durationPrices && service.durationPrices.length > 0 ? (
                            <div className="space-y-1 mt-auto">
                              <div className="space-y-1">
                                {service.durationPrices.map((option: { duration: number; price: number }, index: number) => (
                                  <div
                                    key={index}
                                    className={`border rounded-md p-1.5 sm:p-2 cursor-pointer transition-colors text-xs ${
                                      selectedDurations[service._id]?.duration === option.duration
                                        ? 'border-[#F48FB1] bg-[#E4DED5]'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => {
                                      setSelectedDurations(prev => ({
                                        ...prev,
                                        [service._id]: option
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs text-gray-600">{option.duration} Min</span>
                                        <div className="text-sm font-bold text-[#1F1F1F]">€{option.price}</div>
                                      </div>
                                      <button
                                        className={`font-semibold py-1 px-2 rounded-md transition-all text-xs ${cartServices.find(s => s._id === service._id && s.selectedOption?.duration === option.duration) ? "bg-red-500 text-white" : "bg-[#F48FB1] text-white hover:bg-[#EC407A]"}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleServiceInCart(service, option);
                                        }}
                                      >
                                        {cartServices.find(s => s._id === service._id && s.selectedOption?.duration === option.duration) ? "✕" : "+"}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : service.price != null && service.price > 0 ? (
                            <div className="flex items-center justify-between mt-auto pt-1">
                              <div>
                                <div className="text-sm sm:text-base font-bold text-[#1F1F1F]">€{service.price}</div>
                                {service.timeWorn != null && service.timeWorn > 0 && (
                                  <span className="text-[10px] sm:text-xs text-gray-500">
                                    {service.timeWorn} {service.timeWorn === 1 ? "Tag" : "Tage"} getragen
                                  </span>
                                )}
                              </div>
                              <button
                                className={`font-semibold py-1 px-2 sm:px-3 rounded-md transition-all text-xs ${cartServices.find(s => s._id === service._id) ? "bg-red-500 text-white" : "bg-[#F48FB1] text-white hover:bg-[#EC407A]"}`}
                                onClick={() => {
                                  toggleServiceInCart(service, { duration: 0, price: service.price || 0 });
                                }}
                              >
                                {cartServices.find(s => s._id === service._id) ? "✕" : "Hinzufügen"}
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-1 text-gray-500 text-xs mt-auto">
                              Preis auf Anfrage
                            </div>
                          )}

                          {/* Additional Services */}
                          {service.additionalServices && service.additionalServices.length > 0 && (
                            <div className="mt-2 border border-[#E4DED5] rounded-md p-2">
                              <h4 className="text-[10px] sm:text-xs font-semibold text-[#1F1F1F] mb-1">Extras:</h4>
                              <div className="space-y-1">
                                {service.additionalServices.map((addon: { name: string; price: number }, idx: number) => {
                                  const isChecked = (selectedAdditionals[service._id] || []).includes(addon.name);
                                  return (
                                      <div key={idx} className="flex items-center gap-1.5 cursor-pointer text-xs">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                              setSelectedAdditionals(prev => {
                                                const current = prev[service._id] || [];
                                                const updated = isChecked
                                                  ? current.filter(n => n !== addon.name)
                                                  : [...current, addon.name];
                                                setCartServices(cartPrev => {
                                                  const inCart = cartPrev.find(s => s._id === service._id);
                                                  if (inCart) {
                                                    // determine base price
                                                    let basePrice: number;
                                                    if (service.wearDurationEnabled) {
                                                      const bp = service.basePrice ?? service.pricePerDay ?? 0;
                                                      const epd = service.extraPricePerDay ?? 0;
                                                      const min = service.minWearDays ?? 1;
                                                      const days = inCart.selectedWearDays ?? min;
                                                      basePrice = bp + Math.max(0, days - min) * epd;
                                                    } else {
                                                      basePrice = inCart.selectedOption?.price || service.price || 0;
                                                    }
                                                    const newAddonsTotal = updated.reduce((sum, name) => {
                                                      const a = service.additionalServices?.find(x => x.name === name);
                                                      return sum + (a?.price || 0);
                                                    }, 0);
                                                    return cartPrev.map(s => s._id === service._id ? {
                                                      ...s,
                                                      price: basePrice + newAddonsTotal,
                                                      selectedAdditionalServices: updated,
                                                    } : s);
                                                  }
                                                  return cartPrev;
                                                });
                                                return { ...prev, [service._id]: updated };
                                              });
                                            }}
                                            className="accent-[#F48FB1] w-3 h-3"
                                          />
                                          <span className="flex-1 text-[#1F1F1F] truncate">{addon.name}</span>
                                          <span className="text-green-700 font-semibold whitespace-nowrap">+€{addon.price}</span>
                                        </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Details button */}
                          <button
                            className="mt-2 w-full text-[#F48FB1] hover:text-[#EC407A] border border-[#E4DED5] rounded-md py-1 text-xs font-medium transition-colors"
                            onClick={() => openServiceDetails(service)}
                            type="button"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 sm:py-12">
                    <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm border border-[#E4DED5] max-w-xs sm:max-w-md mx-auto">
                      <GiUnderwear className="w-8 h-8 sm:w-12 sm:h-12 text-[#E4DED5] mb-2 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Keine Produkte verfügbar</h3>
                      <p className="text-gray-600 text-xs sm:text-base">Dieser Verkäufer hat noch keine Produkte hinzugefügt.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section ref={aboutRef} className="w-full py-4 sm:py-8 text-left mb-4 sm:mb-8">
          <div className="space-y-4 sm:space-y-8 w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] mb-2 sm:mb-3">Über mich</h2>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">{salon.description}</p>
              
              {/* Seller Profile Details */}
              {(salon.height || salon.weight || salon.size || salon.hobbies || salon.serviceHours) && (
                <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {salon.height && (
                    <div className="bg-white border border-[#E4DED5] rounded-lg p-3 sm:p-4">
                      <span className="text-xs sm:text-sm text-gray-500">Größe</span>
                      <p className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{salon.height}</p>
                    </div>
                  )}
                  {salon.weight && (
                    <div className="bg-white border border-[#E4DED5] rounded-lg p-3 sm:p-4">
                      <span className="text-xs sm:text-sm text-gray-500">Gewicht</span>
                      <p className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{salon.weight}</p>
                    </div>
                  )}
                  {salon.size && (
                    <div className="bg-white border border-[#E4DED5] rounded-lg p-3 sm:p-4">
                      <span className="text-xs sm:text-sm text-gray-500">Konfektionsgröße</span>
                      <p className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{salon.size}</p>
                    </div>
                  )}
                  {salon.hobbies && (
                    <div className="bg-white border border-[#E4DED5] rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-3">
                      <span className="text-xs sm:text-sm text-gray-500">Hobbys & Interessen</span>
                      <p className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{salon.hobbies}</p>
                    </div>
                  )}
                  {salon.serviceHours && (
                    <div className="bg-white border border-[#E4DED5] rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-3">
                      <span className="text-xs sm:text-sm text-gray-500">Erreichbar</span>
                      <p className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{salon.serviceHours}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Google Maps Embed */}
              {salon.googleMapsAddress && (
                <div className="mt-4 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-semibold text-[#1F1F1F] mb-1 sm:mb-2">Standort</h3>
                  <div className="rounded-lg overflow-hidden border border-[#E4DED5]">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(salon.googleMapsAddress)}&output=embed`}
                      width="100%"
                      height="200"
                      className="sm:h-[350px]"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps Location"
                    />
                  </div>
                  <div className="mt-1 sm:mt-2 text-gray-600 text-xs sm:text-sm">
                    {salon.googleMapsAddress}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section ref={reviewsRef} className="w-full py-8 sm:py-16 text-left">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-2 sm:mb-4 tracking-tight">Bewertungen & Rezensionen</h2>
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={`w-6 h-6 sm:w-8 sm:h-8 ${i < Math.floor(averageRating) ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#1F1F1F]">{averageRating.toFixed(1)}</span>
                <span className="text-[#1F1F1F] text-xs sm:text-base">({totalReviews} Bewertungen)</span>
              </div>
            </div>
            
            {/* Reviews are submitted from the order tracking page */}
          </div>

          {/* Reviews List */}
          <div className="space-y-4 sm:space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg border border-[#E4DED5] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4 gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E4DED5] rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-[#F48FB1]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1F1F1F] text-sm sm:text-base">{review.customerName}</h4>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < review.rating ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs sm:text-sm text-[#1F1F1F]">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#1F1F1F] mb-2 sm:mb-3 text-sm sm:text-base">{review.comment}</p>
                  {review.serviceName && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-[#1F1F1F]">
                      <span className="bg-[#E4DED5] px-2 sm:px-3 py-1 rounded-full">
                        Produkt: {review.serviceName}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg border border-[#E4DED5] p-4 sm:p-8 text-center">
                <FiStar className="w-8 h-8 sm:w-12 sm:h-12 text-[#E4DED5] mx-auto mb-2 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-[#1F1F1F] mb-1 sm:mb-2">Noch keine Bewertungen</h3>
                <p className="text-[#1F1F1F] text-xs sm:text-base">Seien Sie der Erste, der eine Erfahrung teilt!</p>
              </div>
            )}
          </div>
        </section>

        {/* Cart summary fixed popup */}
        {cartServices.length > 0 && (
          <div
            className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#E4DED5] border border-[#F48FB1] shadow-lg rounded-2xl px-6 sm:px-10 py-4 sm:py-6 w-[calc(100%-16px)] sm:max-w-md lg:max-w-lg flex flex-col items-center"
            style={{
              maxWidth: 'calc(100% - 16px)',
              width: '100%',
              ...(typeof window !== "undefined" && window.innerWidth >= 1024
                ? { width: '500px' }
                : {}),
            }}
          >
            <div className="w-full flex items-center justify-between">
              <div className="text-base sm:text-lg font-semibold text-[#1F1F1F]">
                Gesamt: €{cartServices.reduce((sum, s) => sum + (s.price || 0), 0)}
              </div>
              {/* Dropdown toggle */}
              <button
                className="ml-2 text-[#F48FB1] hover:text-[#1F1F1F] font-semibold px-1 sm:px-2 py-0 sm:py-1 rounded text-sm"
                onClick={() => setShowCartDropdown(v => !v)}
                aria-label="Ausgewählte Produkte anzeigen"
                type="button"
              >
                {showCartDropdown ? "▲" : "▼"}
              </button>
            </div>
            <div className="w-full text-xs sm:text-sm text-gray-700 mt-1 mb-2 text-center">
              {cartServices.length} Produkt{cartServices.length > 1 ? "e" : ""}
            </div>
            {/* Dropdown list */}
            {showCartDropdown && (
              <ul className="w-full mb-2 bg-white rounded-lg border border-[#E4DED5] shadow p-2 sm:p-2 max-h-[200px] overflow-y-auto">
                {cartServices.map(s => {
                  const addons = s.selectedAdditionalServices || [];
                  const addonsList = s.additionalServices || [];
                  const addonsTotal = addons.reduce((sum, name) => {
                    const a = addonsList.find(x => x.name === name);
                    return sum + (a?.price || 0);
                  }, 0);
                  const basePrice = (s.price || 0) - addonsTotal;
                  return (
                  <li key={`${s._id}-${s.selectedOption?.duration}`} className="py-1 text-[#1F1F1F] text-xs sm:text-sm border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-center">
                      <span>
                        {s.name}
                        {s.selectedOption && (
                          <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-gray-600">
                            ({s.selectedOption.duration} Min)
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 sm:gap-2">
                        €{addons.length > 0 ? basePrice : s.price}
                        <button
                          className="ml-1 sm:ml-2 text-[#FF6B6B] hover:text-red-700 text-base sm:text-lg font-bold px-1 sm:px-2"
                          aria-label={`Entfernen ${s.name}`}
                          onClick={() => toggleServiceInCart(s)}
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                    {addons.length > 0 && (
                      <div className="pl-2 mt-0.5 space-y-0.5">
                        {addons.map((addonName, idx) => {
                          const addon = addonsList.find(a => a.name === addonName);
                          return (
                            <div key={idx} className="flex justify-between text-[10px] sm:text-xs text-gray-500">
                              <span>+ {addonName}</span>
                              {addon && <span className="text-green-700">+€{addon.price}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
            <button
              className="bg-[#F48FB1] hover:bg-[#EC407A] text-white font-semibold py-2 sm:py-2 px-4 sm:px-6 rounded-lg transition-all duration-200 w-full text-sm sm:text-base"
              onClick={proceedToBooking}
            >
              Weiter zur Anfrage ({cartServices.length})
            </button>
          </div>
        )}

        {/* Service Details Popup */}
        {detailsService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailsService(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-2 p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button
                className="sticky top-0 float-right z-10 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors shadow-sm"
                onClick={() => setDetailsService(null)}
                aria-label="Schließen"
                type="button"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">{detailsService.name}</h2>
              {detailsService.imageUrl && (
                <div className="w-full h-64 sm:h-80 overflow-hidden rounded-lg mb-4 cursor-pointer" onClick={() => setZoomedImage(detailsService.imageUrl!)}>
                  <img
                    src={detailsService.imageUrl}
                    alt={detailsService.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={`w-5 h-5 ${i < Math.floor(serviceAverageRating) ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-base font-medium text-[#1F1F1F]">
                    {serviceAverageRating.toFixed(1)} <span className="text-xs text-gray-600">({serviceReviews.length} Bewertungen)</span>
                  </span>
                </div>
                <p className="text-gray-700 text-base">{detailsService.description}</p>
                {/* Price and Time Worn */}
                <div className="flex items-center gap-3 flex-wrap mt-3">
                  {detailsService.price != null && detailsService.price > 0 && (
                    <span className="text-xl font-bold text-[#1F1F1F]">€{detailsService.price}</span>
                  )}
                  {detailsService.timeWorn != null && detailsService.timeWorn > 0 && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {detailsService.timeWorn} {detailsService.timeWorn === 1 ? "Tag" : "Tage"} getragen
                    </span>
                  )}
                </div>

              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2">Bewertungen für dieses Produkt</h3>
                {serviceReviews.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {serviceReviews.map((review) => (
                      <div key={review._id} className="border border-[#E4DED5] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 bg-[#E4DED5] rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-[#F48FB1]" />
                          </div>
                          <span className="font-semibold text-sm text-[#1F1F1F]">{review.customerName}</span>
                          <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                          <div className="flex ml-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`w-3 h-3 ${i < review.rating ? 'text-[#F48FB1] fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="text-[#1F1F1F] text-sm">{review.comment}</div>
                        {review.employeeName && (
                          <div className="text-xs text-gray-600 mt-1">Produkt: {review.employeeName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Noch keine Bewertungen für dieses Produkt.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer outside main content for full width */}
      <Footer />
      {currentUser && (
        <ChatWidget
          userUid={currentUser.uid}
          userName={currentUser.name || currentUser.username || currentUser.email || 'Käufer'}
          userRole="buyer"
        />
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10 transition"
            onClick={() => setZoomedImage(null)}
            aria-label="Schließen"
          >
            ×
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}