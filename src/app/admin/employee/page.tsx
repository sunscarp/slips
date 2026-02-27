"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../../components/adminnavbar";
import Footer from "@/components/footer";
import ChatWidget from "../../../components/ChatWidget";

export default function EmployeePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        const currentUser = await res.json();
        setUser(currentUser);
        if (currentUser?.email) {
          try {
            const salonRes = await fetch(`/api/salons?email=${encodeURIComponent(currentUser.email)}`);
            if (salonRes.ok) {
              const data = await salonRes.json();
              setSalon(data.salon ?? data);
            }
          } catch (err) {
            console.error('Error fetching salon:', err);
          }
        }
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} salonName={salon?.name} salon={salon} />
        <main className="flex-1 bg-gray-50 flex items-center justify-center font-sans">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-black text-lg">Laden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} salon={salon} />
        <main className="flex-1 bg-gray-50 flex items-center justify-center font-sans">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md mx-4">
            <h2 className="text-xl font-semibold text-black mb-2">Zugriff eingeschränkt</h2>
            <p className="text-black mb-4">Bitte melde dich an.</p>
            <a href="/login" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md inline-block">
              Anmelden
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        currentPath="/admin/employee"
        salonName={salon?.name}
        salon={salon}
      />
      <main className="flex-1 bg-gray-50 font-sans flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-lg w-full p-8 text-center">
          <h2 className="text-xl font-semibold text-black mb-4">
            Diese Funktion ist für den Marktplatz nicht verfügbar.
          </h2>
          <p className="text-gray-600 mb-6">
            Als Verkäufer verwaltest du dein Profil über die Profil-Seite.
          </p>
          <a
            href="/admin/salonprofile"
            className="inline-block bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
          >
            Zum Profil
          </a>
        </div>
      </main>
      <Footer />
      {salon && (
        <ChatWidget
          userUid={salon.uid}
          userName={user?.name || user?.username || salon.name || 'Verkäufer'}
          userRole="seller"
          salonUid={salon.uid}
        />
      )}
    </div>
  );
}
