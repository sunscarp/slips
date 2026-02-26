"use client";
import React, { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiScissors } from "react-icons/fi";
import Navbar from "@/components/adminnavbar";
import Footer from "@/components/footer";

// --- Helper to call server actions ---
async function callServerAction(action: string, payload: any) {
  const res = await fetch(`/api/services?action=${action}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

function ServiceStatCard({ count }: { count: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between font-inter">
      <div>
        <p className="text-sm font-medium text-black">Gesamt Produkte</p>
        <p className="mt-1 text-2xl font-semibold text-black">{count}</p>
      </div>
      <div className="p-3 rounded-full bg-primary-50 text-primary-600">
        <FiScissors size={24} color="black" />
      </div>
    </div>
  );
}

// --- Service Form Component ---
function ServiceForm({ initial, onSave, onCancel, loading }: any) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          serviceType: initial.serviceType || "",
          price: initial.price || 0,
          imageUrl: initial.imageUrl || "",
        }
      : {
          name: "",
          description: "",
          serviceType: "",
          price: 0,
          imageUrl: "",
        }
  );

  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f: any) => ({ ...f, imageUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    const price = Number(form.price || 0);
    if (!form.name || price <= 0) {
      alert("Bitte gib einen Namen und einen gültigen Preis an.");
      return;
    }
    if (!form.imageUrl) {
      alert("Bitte füge ein Bild für das Produkt hinzu (erforderlich).");
      return;
    }
    await onSave({
      ...form,
      price,
    });
  }

  // Service types for dropdown
  const serviceTypes = [
    "socks",
    "shoes",
    "bras",
    "tights",
    "bikinis",
    "miscellaneous",
    "swimwear",
    "sportswear",
    "panties",
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-sm space-y-4 mb-8 font-inter"
    >
      <h2 className="text-xl font-semibold text-black mb-2">
        {initial ? "Produkt bearbeiten" : "Neues Produkt hinzufügen"}
      </h2>
      {/* Service Type Dropdown */}
      <div>
        <label className="block text-sm font-medium text-black">Produktkategorie*</label>
        <select
          name="serviceType"
          value={form.serviceType}
          onChange={handleChange}
          required
          className="select select-bordered w-full mt-1 font-inter text-black border-gray-200 border-2 rounded-lg bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 py-2 text-base px-4"
        >
          <option value="">Kategorie auswählen</option>
          {serviceTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Name*</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="input input-bordered w-full mt-1 font-inter text-black border-gray-200 border-2 rounded-lg bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 py-2 text-base px-4"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Beschreibung</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="textarea textarea-bordered w-full mt-1 font-inter text-black border-gray-200 border-2 rounded-lg bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 py-2 text-base min-h-[2.5rem] px-4"
        />
      </div>
      
      {/* Price and Image for product */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Preis (€)*</label>
        <input
          name="price"
          type="number"
          min="0"
          step="0.50"
          value={form.price}
          onChange={handleChange}
          required
          className="input input-bordered w-full mt-1 font-inter text-black border-gray-200 border-2 rounded-lg bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 py-2 text-base px-4"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">Produktbild*</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={handleImageChange} ref={(el: HTMLInputElement | null) => { fileInputRef.current = el; }} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <FiPlus /> Bild hinzufügen
          </button>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
          disabled={loading}
        >
          {loading ? "Speichern..." : "Speichern"}
        </button>
        <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
          onClick={onCancel}
          disabled={loading}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// --- Main Page Component ---
type User = { uid: string; [key: string]: any };

// Helper to get price range for a salon's services
function getPriceRangeForUid(services: any[], uid: string) {
  const salonServices = services.filter((s) => s.uid === uid);
  const allPrices: number[] = [];
  salonServices.forEach((service) => {
    if (service.price && !isNaN(Number(service.price))) {
      allPrices.push(Number(service.price));
    }
  });
  if (allPrices.length === 0) return null;
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  if (minPrice === maxPrice) return `€${minPrice}`;
  return `€${minPrice} - €${maxPrice}`;
}

export default function ServicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [employees, setEmployees] = useState<
    { name: string; email?: string; schedule: { [key: string]: { open: boolean; start: string; end: string } }, holidays?: string[], services?: string[] }[]
  >([]);
  const [expandedEmployeeIdx, setExpandedEmployeeIdx] = useState<number | null>(null);
  const [salon, setSalon] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewingSalonUid, setViewingSalonUid] = useState<string | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const addServiceRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        const currentUser = await res.json();
        if (currentUser?.uid) {
          // Check if this is system admin viewing another salon's services
          const urlParams = new URLSearchParams(window.location.search);
          const salonUidParam = urlParams.get('salonUid');
          const isSystemUser = currentUser.email === "system@gmail.com";
          setIsSystemAdmin(isSystemUser);

          if (salonUidParam && isSystemUser) {
            // System admin viewing specific salon services
            setViewingSalonUid(salonUidParam);

            // Fetch the specific salon data
            try {
              const salonRes = await fetch(`/api/salons?uid=${encodeURIComponent(salonUidParam)}`);
              if (salonRes.ok) {
                const salonData = await salonRes.json();
                setSalon(salonData.salon);
                setEmployees(
                  (salonData.salon.employees ?? []).map((emp: any) => ({
                    ...emp,
                    holidays: emp.holidays ?? [],
                    services: emp.services ?? []
                  }))
                );

                // Set a mock user with the salon UID for service operations
                setUser({ uid: salonUidParam, email: currentUser.email });
              }
            } catch (err) {
              console.error('Failed to fetch salon data:', err);
            }
          } else {
            // Normal flow for salon users
            setUser(currentUser);

            if (currentUser.email) {
              try {
                const salonRes = await fetch(`/api/salons?email=${encodeURIComponent(currentUser.email)}`);
                if (salonRes.ok) {
                  const data = await salonRes.json();
                  const salonData = data.salon ?? data;
                  setSalon(salonData);
                  setEmployees(
                    (salonData.employees ?? []).map((emp: any) => ({
                      ...emp,
                      holidays: emp.holidays ?? [],
                      services: emp.services ?? []
                    }))
                  );
                }
              } catch (err) {
                console.error('Failed to fetch salon data:', err);
              }
            }
          }
        } else {
          window.location.href = '/login';
        }
      } catch {
        window.location.href = '/login';
      }
    };
    init();
  }, []);

  async function fetchServices() {
    if (!user?.uid) return;
    setLoading(true);
    const res = await fetch(`/api/services?action=list&uid=${user.uid}`);
    const data = await res.json();
    setServices((data.services || []).filter((s: any) => s.uid === user.uid));
    setLoading(false);
  }

  useEffect(() => {
    if (user?.uid) fetchServices();
    // eslint-disable-next-line
  }, [user?.uid]);

  async function handleSave(form: any) {
    if (!user?.uid) {
      alert("User ID is missing. Please log in again.");
      console.error("User ID missing, cannot save service.");
      return;
    }
    setLoading(true);
    try {
      let response;
      if (editService) {
        response = await callServerAction("edit", { ...form, _id: editService._id, uid: user.uid });
      } else {
        response = await callServerAction("add", { ...form, uid: user.uid });
      }
      if (response.error) {
        alert('Error saving service: ' + response.error);
        setLoading(false);
        return;
      }
      setShowForm(false);
      setEditService(null);
      await fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user?.uid) return;
    setLoading(true);
    await callServerAction("delete", { _id: id, uid: user.uid });
    setDeleteId(null);
    await fetchServices();
    setLoading(false);
  }

  const handleEmployeeServiceToggle = async (empIdx: number, serviceId: string) => {
    const updatedEmployees = [...employees];
    const emp = { ...updatedEmployees[empIdx] };
    if (!emp.services) emp.services = [];
    
    if (emp.services.includes(serviceId)) {
      emp.services = emp.services.filter(id => id !== serviceId);
    } else {
      emp.services = [...emp.services, serviceId];
    }
    updatedEmployees[empIdx] = emp;
    setEmployees(updatedEmployees);

    // Save to backend
    if (salon?.email && salon?.name) {
      try {
        const res = await fetch("/api/salons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: salon.email,
            name: salon.name, // PATCH requires name
            employees: updatedEmployees
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to update employee services:', errorText);
        }
      } catch (error) {
        console.error('Error updating employee services:', error);
      }
    } else {
      console.error('Missing salon email or name for PATCH');
    }
  };

  const handleExpandEmployee = (idx: number) => {
    setExpandedEmployeeIdx(expandedEmployeeIdx === idx ? null : idx);
  };

  // Product types for dropdown
  const serviceTypes = [
    "All",
    "socks",
    "shoes",
    "bras",
    "tights",
    "bikinis",
    "miscellaneous",
    "swimwear",
    "sportswear",
    "panties",
  ];

  // Filter services by selected type
  const filteredServices =
    selectedType === "All"
      ? services
      : services.filter((s) => s.serviceType === selectedType);

  return (
    <>
      <Navbar 
        user={user ? { email: user.email ?? null } : undefined} 
        viewingSalonUid={viewingSalonUid}
        salonName={isSystemAdmin ? salon?.name : undefined}
        salon={salon}
      />
      {/* Blur overlay for modals if needed */}
      <main className="min-h-screen bg-gray-50 font-sans p-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto py-8 px-2 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 font-inter">
              Produkte verwalten
              {viewingSalonUid && isSystemAdmin && (
                <span className="text-lg text-gray-600 block mt-1">(System-Ansicht für {salon?.name})</span>
              )}
            </h1>
            <p className="text-black text-base sm:text-lg font-inter">
              Füge Produkte hinzu, bearbeite oder entferne sie aus deinem Sortiment.
            </p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ServiceStatCard count={services.length} />
          </div>
          {/* Add/Edit Service Form (Desktop only) */}
          {!isMobile && showForm && user && (
            <div className="mb-6">
              <ServiceForm
                initial={editService}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditService(null);
                }}
                loading={loading}
              />
            </div>
          )}
          {/* Employee Service Assignment */}
          {employees.length > 0 && (
            <section className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3
                  className="text-lg font-semibold text-black mb-4 flex items-center gap-2 font-inter"
                  style={{ marginLeft: 2, textAlign: "left" }}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary-600 text-white font-bold">M</span>
                  <span style={{ marginLeft: 0 }}>Mitarbeiter-Produktzuordnung</span>
                </h3>
                {employees.map((emp, idx) => (
                  <div key={idx} className="mb-4 border rounded-lg p-4 bg-gray-50 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleExpandEmployee(idx)}>
                      <div>
                        <span className="font-semibold text-black font-inter">{emp.name}</span>
                        {emp.email && (
                          <span className="ml-2 text-xs text-black font-inter">({emp.email})</span>
                        )}
                        <span className="ml-2 text-xs text-gray-600 font-inter">
                          ({emp.services?.length || 0} Produkte zugeordnet)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded-md border border-gray-300 bg-white shadow-sm font-inter text-black"
                      >
                        {expandedEmployeeIdx === idx ? "Schließen" : "Produkte verwalten"}
                      </button>
                    </div>
                    {expandedEmployeeIdx === idx && (
                      <div className="mt-4">
                        <div className="mb-3 font-semibold text-black font-inter">Zugeordnete Produkte</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {services.length === 0 ? (
                            <div className="text-black text-sm font-inter">
                              Keine Produkte verfügbar. Erstelle zuerst welche.
                            </div>
                          ) : (
                            services.map(service => (
                              <label key={service._id} className="flex items-center gap-2 text-black cursor-pointer hover:bg-gray-100 p-2 rounded-md transition font-inter">
                                <input
                                  type="checkbox"
                                  checked={emp.services?.includes(service._id) ?? false}
                                  onChange={() => handleEmployeeServiceToggle(idx, service._id)}
                                  className="accent-primary-600 w-4 h-4"
                                />
                                <div className="flex-1">
                                  <span className="select-none font-medium">{service.name}</span>
                                  <div className="text-xs text-gray-600">
                                    {service.price !== undefined && service.price !== null
                                        ? `€${service.price}`
                                        : 'Keine Preisinformation'
                                      }
                                  </div>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Services List */}
          <section className="mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-xl font-semibold text-black flex items-center font-inter">
                    <FiScissors className="mr-2" /> Ihre Produkte
                  </h2>
                  {/* On mobile, button on right side of heading */}
                  <div className="flex-shrink-0 ml-2 sm:ml-0">
                    <button
                      className="flex items-center justify-center rounded-full bg-black hover:bg-gray-900 transition-colors w-10 h-10 shadow-md disabled:opacity-50"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      onClick={() => {
                        if (!user?.uid) {
                          alert("Benutzer-ID fehlt. Bitte erneut einloggen.");
                          return;
                        }
                        setShowForm(true);
                        setEditService(null);
                        setTimeout(() => {
                          if (isMobile && addServiceRef.current) {
                            addServiceRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }, 100);
                      }}
                      disabled={!user?.uid}
                      aria-label="Neues Produkt hinzufügen"
                      title="Neues Produkt hinzufügen"
                    >
                      <FiPlus size={22} color="white" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Service Type Dropdown */}
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="text-black font-inter font-medium">Nach Art filtern:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="select select-bordered font-inter text-black border-gray-200 border-2 rounded-lg bg-gray-50 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 py-2 text-base px-4 w-full sm:w-48"
                >
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>{type === "All" ? "Alle" : type}</option>
                  ))}
                </select>
              </div>
              {/* Price Range */}
              {user?.uid && (
                  <div className="mb-4">
                  <div className="font-bold text-black mb-2">Ihr Produktpreisbereich:</div>
                  <div className="text-black font-inter">
                    {getPriceRangeForUid(services, user.uid) || "Keine Preisinformation"}
                  </div>
                </div>
              )}
              {/* Services List */}
              <div className="grid grid-cols-1 gap-6">
                {filteredServices.length === 0 && (
                  <div className="col-span-full text-center text-black py-8 bg-white rounded-lg shadow-sm font-inter">
                    Keine Produkte gefunden. Klicke auf <span className="inline-flex items-center gap-1 font-semibold"><FiPlus /> Hinzufügen</span>, um eines zu erstellen.
                  </div>
                )}
                {filteredServices.map((s) => (
                  <React.Fragment key={s._id}>
                    <div
                      className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center p-4 font-inter text-black border border-gray-200"
                    >
                      {s.imageUrl && (
                        <img
                          src={s.imageUrl}
                          alt={s.name}
                          className="h-16 w-16 object-cover rounded mr-0 sm:mr-4 mb-2 sm:mb-0 border"
                        />
                      )}
                      <div className="flex-1 text-black w-full">
                        <div className="text-base sm:text-lg font-medium sm:font-bold text-black font-inter mb-1">
                          {s.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 font-inter mb-1">
                          {s.description}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm font-inter text-black">
                          {s.price !== undefined && s.price !== null ? (
                            <span className="text-black">
                              <span className="inline-block mr-3 px-2 py-1 bg-gray-100 rounded font-mono text-xs sm:text-sm text-black border border-gray-200">
                                <span className="text-green-700">€{s.price}</span>
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">Keine Preisinformation</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 ml-0 sm:ml-4 mt-2 sm:mt-0">
                        {deleteId === s._id ? (
                          <div className="flex flex-col gap-2 items-end bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="mb-1 text-black font-inter text-xs text-right">
                              <span className="font-semibold text-red-600">Produkt löschen?</span>
                              <br />
                              <span className="text-gray-500">Diese Aktion kann nicht rückgängig gemacht werden.</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-inter text-xs font-medium shadow transition-colors"
                                onClick={() => handleDelete(s._id)}
                                disabled={loading}
                              >
                                Ja, löschen
                              </button>
                              <button
                                className="px-3 py-1 rounded-md bg-white border border-gray-300 hover:bg-gray-100 text-black font-inter text-xs font-medium shadow transition-colors"
                                onClick={() => setDeleteId(null)}
                                disabled={loading}
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              className="btn btn-xs btn-outline flex items-center gap-1 font-inter text-black"
                              onClick={() => {
                                setEditService(s);
                                setShowForm(true);
                              }}
                            >
                              <FiEdit2 /> <span className="text-black">Bearbeiten</span>
                            </button>
                            <button
                              className="btn btn-xs btn-error flex items-center gap-1 font-inter text-black"
                              onClick={() => setDeleteId(s._id)}
                            >
                              <FiTrash2 /> <span className="text-black">Löschen</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Edit Service Form below the service on both mobile and desktop */}
                    {showForm && editService?._id === s._id && user && (
                      <div className="mt-2 mb-4">
                        <ServiceForm
                          initial={editService}
                          onSave={handleSave}
                          onCancel={() => {
                            setShowForm(false);
                            setEditService(null);
                          }}
                          loading={loading}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* On mobile, show add form at bottom if not editing */}
              {isMobile && showForm && !editService && user && (
                <div className="mt-4" ref={addServiceRef}>
                  <ServiceForm
                    initial={null}
                    onSave={handleSave}
                    onCancel={() => {
                      setShowForm(false);
                      setEditService(null);
                    }}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </>
  );
}