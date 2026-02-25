"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../../components/adminnavbar";
import Footer from "@/components/footer";

const COLORS = {
  primary: "#5C6F68",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#9DBE8D",
  lightGray: "#F8F9FA",
  border: "#E5E7EB",
  success: "#10B981",
  error: "#EF4444",
};

const WEEKDAYS = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
];

export default function SalonProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [salon, setSalon] = useState<{
    uid?: string;
    name: string;
    email: string;
    imageUrl?: string | null;
    imageUrls?: string[];
    description?: string;
    location?: string;
    contact?: string;
    googleMapsAddress?: string;
    gender?: string;
    workingDays?: { [key: string]: { open: boolean; start: string; end: string } };
    holidays?: string[];
  } | null>(null);
  const [viewingSalonUid, setViewingSalonUid] = useState<string | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean>(false);
  const [salonName, setSalonName] = useState("");
  const [salonDescription, setSalonDescription] = useState("");
  const [salonLocation, setSalonLocation] = useState("");
  const [salonContact, setSalonContact] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [googleMapsAddress, setGoogleMapsAddress] = useState<string>("");
  const [workingDays, setWorkingDays] = useState<{ [key: string]: { open: boolean; start: string; end: string } }>({});
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState<string>("");
  const [holidayRangeStart, setHolidayRangeStart] = useState<string>("");
  const [holidayRangeEnd, setHolidayRangeEnd] = useState<string>("");
  const [salonGender, setSalonGender] = useState<string>("");
  // googleMapsAddress, working days and holidays removed for marketplace flow

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        const currentUser = await res.json();
        setUser(currentUser);
        if (currentUser?.email) {
          setLoading(true);
          try {
            // Check if this is system admin viewing another salon's profile
            const urlParams = new URLSearchParams(window.location.search);
            const salonUidParam = urlParams.get('salonUid');
            const isSystemUser = currentUser.email === "system@gmail.com";
            setIsSystemAdmin(isSystemUser);

            if (salonUidParam && isSystemUser) {
              // System admin viewing specific salon profile
              setViewingSalonUid(salonUidParam);

              // Fetch the specific salon data
              const salonRes = await fetch(`/api/salons?uid=${encodeURIComponent(salonUidParam)}`);
              if (salonRes.ok) {
                const salonData = await salonRes.json();
                const s = salonData.salon;
                setSalon(s);
                setSalonName(s.name);
                setSalonDescription(s.description ?? "");
                setSalonLocation(s.location ?? "");
                setSalonContact(s.contact ?? "");
                setSalonGender(s.gender ?? "");
                setImagePreviews(
                  s.imageUrls || s.imageUrl
                    ? (s.imageUrls ?? [s.imageUrl]).filter(Boolean)
                    : []
                );
                setImageFiles([]);
                setWorkingDays(s.workingDays ?? Object.fromEntries(WEEKDAYS.map(day => [day, { open: day !== "Sonntag", start: "09:00", end: "18:00" }])));
                setHolidays(s.holidays ?? []);
              }
            } else {
              // Normal flow for salon users
              const salonRes = await fetch(`/api/salons?email=${encodeURIComponent(currentUser.email)}`);
              if (!salonRes.ok) throw new Error("Salon nicht gefunden.");
              const data = await salonRes.json();
              const salonData = data.salon ?? data;
              setSalon(salonData);
              setSalonName(salonData.name);
              setSalonDescription(salonData.description ?? "");
                setSalonLocation(salonData.location ?? "");
                setSalonContact(salonData.contact ?? "");
                setSalonGender(salonData.gender ?? "");
                setImagePreviews(
                  salonData.imageUrls || salonData.imageUrl
                    ? (salonData.imageUrls ?? [salonData.imageUrl]).filter(Boolean)
                    : []
                );
            }
          } catch (err) {
            setStatus("Fehler beim Laden des Salons.");
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch {
        window.location.href = '/login';
      }
    };
    init();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Adding images from salon profile is disabled — images come from products now.
    return;
  };

  const handleRemoveImage = async (idx: number) => {
    // Allow removing existing images if backend exposes them
    const url = imagePreviews[idx];
    const match = url.match(/\/api\/salons\/image\/([a-zA-Z0-9]+)/);
    const imageId = match ? match[1] : null;
    if (imageId && salon?.email) {
      await fetch("/api/salons/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: salon.email, imageId }),
      });
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setSalon(salon => salon ? {
      ...salon,
      imageUrls: (salon.imageUrls ?? []).filter((_, i) => i !== idx)
    } : salon);
  };

  const handleWorkingDayChange = (day: string, field: "open" | "start" | "end", value: any) => {
    setWorkingDays(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: field === "open" ? value : value }
    }));
  };

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays(prev => [...prev, newHoliday]);
      setNewHoliday("");
    }
  };

  const handleAddHolidayRange = () => {
    if (!holidayRangeStart || !holidayRangeEnd) return;
    const start = new Date(holidayRangeStart);
    const end = new Date(holidayRangeEnd);
    if (end < start) return;
    const dates: string[] = [];
    let d = new Date(start);
    while (d <= end) {
      const dateStr = d.toISOString().slice(0, 10);
      if (!holidays.includes(dateStr)) {
        dates.push(dateStr);
      }
      d.setDate(d.getDate() + 1);
    }
    if (dates.length > 0) {
      setHolidays(prev => [...prev, ...dates]);
    }
    setHolidayRangeStart("");
    setHolidayRangeEnd("");
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(prev => prev.filter(d => d !== date));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!salon) return;
    let imageUrls = imagePreviews.filter(src => src.startsWith("/api/salons/image/"));
    try {
      if (imageFiles.length > 0) {
        const base64s = await Promise.all(
          imageFiles.map(
            file =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
          )
        );
        }
      const res = await fetch("/api/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: salon.email,
          name: salonName,
          description: salonDescription,
          gender: salonGender,
          contact: salonContact,
          imageUrls,
        }),
      });
      if (!res.ok) throw new Error("Update fehlgeschlagen.");
      setStatus("Salon-Profil erfolgreich aktualisiert.");
      setSalon({
        ...salon,
        name: salonName,
        description: salonDescription,
        gender: salonGender,
        contact: salonContact,
        imageUrls,
        workingDays,
        holidays,
      });
      setImageFiles([]);
      setImagePreviews(imageUrls);
    } catch {
      setStatus("Fehler beim Aktualisieren des Salon-Profils.");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-black text-lg">Lade Salon-Profil...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar user={user} viewingSalonUid={viewingSalonUid} />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md mx-4">
            <h2 className="text-xl font-semibold text-black mb-2">Bitte einloggen</h2>
            <p className="text-black mb-4">Melden Sie sich an, um das Salon-Profil zu verwalten.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar
        user={user}
        currentPath="/admin/salonprofile"
        viewingSalonUid={viewingSalonUid}
        salonName={isSystemAdmin ? salon?.name : undefined}
        salon={salon} // Pass salon object for plan display
      />
      <main className="min-h-screen bg-gray-50 font-sans p-0">
        <div className="max-w-4xl mx-auto py-8 px-2 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Salon Profil
              {viewingSalonUid && isSystemAdmin && (
                <span className="text-lg text-gray-600 block mt-1">(System-Ansicht für {salon?.name})</span>
              )}
            </h1>
            <p className="text-black text-base sm:text-lg">
              Verwalten Sie Ihr Salon-Profil und aktualisieren Sie Ihre Informationen
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            {/* Salon Name Card */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary-600 text-white font-bold">S</span>
                Salon Information
              </h3>
              <label className="block text-black font-medium mb-2">
                Salonname
              </label>
              <input
                type="text"
                value={salonName ?? ""}
                onChange={e => setSalonName(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-gray-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 text-black text-base outline-none transition"
                required
              />
              <label className="block text-black font-medium mt-4 mb-2">
                Beschreibung
              </label>
              <textarea
                value={salonDescription}
                onChange={e => setSalonDescription(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-gray-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 text-black text-base outline-none transition"
                rows={3}
                placeholder="Beschreiben Sie Ihren Salon..."
              />
              <label className="block text-black font-medium mt-4 mb-2">
                Geschlecht
              </label>
              <select
                value={salonGender}
                onChange={e => setSalonGender(e.target.value)}
                required
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-gray-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 text-black text-base outline-none transition"
              >
                <option value="">Bitte wählen</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="other">Andere</option>
              </select>
              {/* Google Maps address removed for marketplace */}
              <label className="block text-black font-medium mt-4 mb-2">
                Kontaktinformation
              </label>
              <input
                type="text"
                value={salonContact}
                onChange={e => setSalonContact(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border border-gray-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 text-black text-base outline-none transition"
                placeholder="Telefon, E-Mail oder Webseite"
              />
            </div>

            {/* Image Gallery Card */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8"></span>
                Salon Bilder
              </h3>
              {/* Primary image */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-black uppercase mb-2">Hauptbild</div>
                <div className={`relative w-full h-40 sm:h-60 rounded-lg overflow-hidden border ${imagePreviews[0] ? "border-gray-200" : "border-dashed border-2 border-gray-200"} bg-white flex items-center justify-center`}>
                  {imagePreviews[0] ? (
                    <>
                      <img
                        src={imagePreviews[0]}
                        alt="Hauptbild des Salons"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(0)}
                        className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-red-600 font-semibold shadow hover:bg-red-50 transition"
                      >
                        Entfernen
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="primary-image-input"
                      />
                      <label
                        htmlFor="primary-image-input"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-black hover:text-green-600 transition"
                      >
                        <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center mb-3 text-3xl font-light">+</div>
                        <div className="font-semibold">Hauptbild hinzufügen</div>
                        <div className="text-xs text-gray-500 mt-1">Dies wird als Titelbild angezeigt</div>
                      </label>
                    </>
                  )}
                </div>
              </div>
              {/* Gallery images */}
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {imagePreviews.slice(1).map((src, idx) => (
                    <div
                      key={idx + 1}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                    >
                      <img
                        src={src}
                        alt={`Galeriebild ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx + 1)}
                        className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-red-600 font-bold shadow opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {/* Adding new gallery images disabled — images populate from products automatically */}
                </div>
              </div>
            </div>

            {/* Working days and holidays removed for marketplace flow */}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
              type="submit"
              className="hover:bg-green-500 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow transition min-w-[120px] sm:min-w-[140px]"
              style={{ backgroundColor: "#9DBE8D", color: "#000" }}
              >
              Speichern
              </button>
            </div>
          </form>

          {/* Status Message */}
          {status && (
            <div
              className={`mt-8 flex items-center gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base ${
                status.startsWith("Fehler")
                  ? "bg-red-50 text-black border border-red-200"
                  : "bg-green-50 text-black border border-green-200"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold ${
                status.startsWith("Fehler") ? "bg-red-600 text-white" : "bg-green-600 text-white"
              }`}>
                {status.startsWith("Fehler") ? "!" : "✓"}
              </span>
              {status}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
