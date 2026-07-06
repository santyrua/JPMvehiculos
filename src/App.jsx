import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import { Button } from "./ui.jsx";
import { compressImage } from "./imageCompression.js";

const AdminPanel = lazy(() => import("./AdminPanel.jsx"));
const AdminLogin = lazy(() => import("./AdminLogin.jsx"));
const Tramites = lazy(() => import("./Tramites.jsx"));
const Credito = lazy(() => import("./Credito.jsx"));
const Seguros = lazy(() => import("./Seguros.jsx"));

const viteEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL || "";
const supabaseKey = viteEnv.VITE_SUPABASE_ANON_KEY || viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const hcaptchaSiteKey = viteEnv.VITE_HCAPTCHA_SITE_KEY || "";

const FALLBACK_ADMIN_PASSWORD = "JPMontoya1041692941@";
const VEHICLES_PER_PAGE = 9;

const emptyForm = {
  name: "",
  type: "Camioneta",
  brand: "",
  model: "",
  version: "",
  year: "",
  price: "",
  km: "",
  fuel: "Gasolina",
  city: "",
  color: "",
  doors: "5",
  transmission: "Automática",
  motor: "",
  bodyType: "",
  reverseCamera: "Sí",
  plateLastDigit: "",
  description: "",
  status: "Disponible",
};

const requiredFields = [
  ["name", "Nombre completo del vehículo"],
  ["type", "Tipo de vehículo"],
  ["brand", "Marca"],
  ["model", "Modelo"],
  ["version", "Versión"],
  ["year", "Año"],
  ["price", "Precio"],
  ["km", "Kilómetros"],
  ["fuel", "Tipo de combustible"],
  ["city", "Ciudad"],
  ["color", "Color"],
  ["doors", "Puertas"],
  ["transmission", "Transmisión"],
  ["motor", "Motor"],
  ["bodyType", "Tipo de carrocería"],
  ["plateLastDigit", "Último dígito de la placa"],
  ["description", "Descripción"],
  ["status", "Estado"],
];

function cleanNumber(value) {
  return Number(String(value).replace(/[^0-9]/g, "")) || 0;
}

function cleanPrice(value) {
  return cleanNumber(value);
}

function money(value) {
  return "$" + new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

function formatKm(value) {
  return new Intl.NumberFormat("es-CO").format(cleanNumber(value));
}

function validateVehicleForm(form, photos) {
  const empty = requiredFields.filter(([key]) => !String(form[key] || "").trim());

  if (empty.length > 0) {
    return {
      ok: false,
      message: "Completa estos campos: " + empty.map(([, label]) => label).join(", ") + ".",
    };
  }

  if (cleanPrice(form.price) <= 0) return { ok: false, message: "El precio debe ser mayor a $0." };
  if (cleanNumber(form.km) <= 0) return { ok: false, message: "El kilometraje debe ser mayor a 0." };
  if (!photos || photos.length === 0) return { ok: false, message: "Debes subir al menos una foto del vehículo." };

  return { ok: true, message: "" };
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return [];

  const visiblePages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const pages = [...visiblePages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];
  let previousPage = 0;

  for (const page of pages) {
    if (page - previousPage === 2) items.push(previousPage + 1);
    if (page - previousPage > 2) items.push(`ellipsis-${page}`);
    items.push(page);
    previousPage = page;
  }

  return items;
}

function runSelfTests() {
  const completeForm = {
    ...emptyForm,
    name: "Mazda 3 Touring MHEV",
    brand: "Mazda",
    model: "3",
    version: "Touring MHEV",
    year: "2026",
    price: "94900000",
    km: "40000",
    city: "Barranquilla",
    color: "Blanco",
    motor: "2.0",
    bodyType: "Sedán",
    plateLastDigit: "6",
    description: "Vehículo en excelente estado.",
  };

  console.assert(validateVehicleForm(emptyForm, []).ok === false, "Debe rechazar formulario vacío");
  console.assert(validateVehicleForm({ ...completeForm, price: "0" }, [{ url: "x" }]).ok === false, "Debe rechazar precio cero");
  console.assert(validateVehicleForm({ ...completeForm, km: "0" }, [{ url: "x" }]).ok === false, "Debe rechazar kilometraje cero");
  console.assert(validateVehicleForm(completeForm, []).ok === false, "Debe exigir al menos una foto");
  console.assert(validateVehicleForm(completeForm, [{ url: "x" }]).ok === true, "Debe aceptar formulario completo");
  console.assert(cleanPrice("94.900.000") === 94900000, "Debe limpiar puntos del precio");
  console.assert(cleanNumber("40.000 km") === 40000, "Debe limpiar puntos y texto del kilometraje");
  console.assert(formatKm("40000") === "40.000", "Debe formatear kilometraje colombiano");
  console.assert(money(1000000) === "$1.000.000", "Debe formatear pesos colombianos");
  console.assert(JSON.stringify(getPaginationItems(1, 1)) === JSON.stringify([]), "No debe paginar una sola página");
  console.assert(JSON.stringify(getPaginationItems(1, 3)) === JSON.stringify([1, 2, 3]), "Debe mostrar páginas continuas cortas");
  console.assert(JSON.stringify(getPaginationItems(5, 10)) === JSON.stringify([1, "ellipsis-4", 4, 5, 6, "ellipsis-10", 10]), "Debe mostrar elipsis en paginación larga");
}
runSelfTests();

function setMetaTag(name, content) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonicalUrl(url) {
  if (typeof document === "undefined") return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function detailsFromForm(form) {
  return [
    { label: "Marca", value: form.brand },
    { label: "Modelo", value: form.model },
    { label: "Año", value: form.year },
    { label: "Versión", value: form.version },
    { label: "Color", value: form.color },
    { label: "Tipo de combustible", value: form.fuel },
    { label: "Puertas", value: form.doors },
    { label: "Transmisión", value: form.transmission },
    { label: "Motor", value: form.motor },
    { label: "Tipo de carrocería", value: form.bodyType },
    { label: "Con cámara de reversa", value: form.reverseCamera },
    { label: "Kilómetros", value: `${formatKm(form.km)} km` },
    { label: "Último dígito de la placa", value: form.plateLastDigit },
  ];
}

function vehicleFromSupabase(row) {
  const formLike = {
    brand: row.brand,
    model: row.model,
    year: row.year,
    version: row.version,
    color: row.color,
    fuel: row.fuel,
    doors: row.doors,
    transmission: row.transmission,
    motor: row.motor,
    bodyType: row.body_type,
    reverseCamera: row.reverse_camera,
    km: String(row.km || "").replace(/[^0-9]/g, ""),
    plateLastDigit: row.plate_last_digit,
  };

  return {
    dbId: row.id,
    name: row.name,
    type: row.type,
    priceNumber: Number(row.price_number),
    year: row.year,
    km: row.km,
    fuel: row.fuel,
    price: money(row.price_number),
    city: row.city,
    image: row.image,
    photos: row.photos || [],
    description: row.description,
    status: row.status || "Disponible",
    details: detailsFromForm(formLike),
  };
}

const starterVehicles = [
  {
    name: "Chevrolet Equinox 1.5 Premier",
    type: "Camioneta",
    priceNumber: 145000000,
    year: "2018",
    km: "40.000 km",
    fuel: "Gasolina",
    price: "$145.000.000",
    city: "Barranquilla",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511918984145-48de785d4c4e?q=80&w=1200&auto=format&fit=crop",
    ],
    description: "Camioneta gris automática, cómoda y bien equipada. Una opción ideal para ciudad o carretera, con cámara de reversa y motor 1.5.",
    status: "Disponible",
    details: [
      { label: "Marca", value: "Chevrolet" },
      { label: "Modelo", value: "Equinox" },
      { label: "Año", value: "2018" },
      { label: "Versión", value: "1.5 Premier" },
      { label: "Color", value: "Gris" },
      { label: "Tipo de combustible", value: "Gasolina" },
      { label: "Puertas", value: "5" },
      { label: "Transmisión", value: "Automática" },
      { label: "Motor", value: "1.5" },
      { label: "Tipo de carrocería", value: "Camioneta" },
      { label: "Con cámara de reversa", value: "Sí" },
      { label: "Kilómetros", value: "40.000 km" },
      { label: "Último dígito de la placa", value: "6" },
    ],
  },
];

function LogoCard() {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-black shadow-2xl">
      <img
        src="/jpm-logo.jpeg.jpg"
        alt="JPM Vehículos - Siempre marcando la diferencia"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function VehicleCard({ vehicle, onOpen }) {
  return (
    <article onClick={() => onOpen(vehicle)} className="cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 text-white shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.14]">
      <div className="relative">
        <img src={vehicle.image} alt={vehicle.name} loading="lazy" decoding="async" className="h-64 w-full object-cover" />
        <span className={"absolute left-4 top-4 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-lg " + (vehicle.status === "Vendido" ? "bg-red-600 text-white" : "bg-emerald-400 text-zinc-950")}>
          {vehicle.status || "Disponible"}
        </span>
      </div>
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold">{vehicle.name}</h3>
            <p className="mt-2 text-base text-zinc-300">📍 {vehicle.city}</p>
          </div>
          <p className="text-right text-2xl font-black text-amber-300">{vehicle.price}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-zinc-950/70 p-4 text-base text-zinc-200">
          <div className="text-center font-medium">📅<br />{vehicle.year}</div>
          <div className="text-center font-medium">⏱<br />{vehicle.km}</div>
          <div className="text-center font-medium">{vehicle.fuel === "Híbrido" ? "🌿" : vehicle.fuel === "Eléctrico"? "⚡": "⛽"}<br />{vehicle.fuel}</div>
        </div>
      </div>
    </article>
  );
}

export default function JPMVehiculosWeb() {
  function isEcoVehicle(vehicle) {
    const fuel = String(vehicle.fuel || "").toLowerCase();

    return (
      fuel === "híbrido" ||
      fuel === "hibrido" ||
      fuel === "eléctrico" ||
      fuel === "electrico"
    );
  }
  const [vehicles, setVehicles] = useState(starterVehicles);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCatalog, setShowCatalog] = useState(() => typeof window !== "undefined" && window.location.pathname.startsWith("/vehiculo"));
  const [showTramites, setShowTramites] = useState(() => typeof window !== "undefined" && window.location.pathname.startsWith("/tramites"));
  const [showCredito, setShowCredito] = useState(() => typeof window !== "undefined" && window.location.pathname.startsWith("/credito"));
  const [showSeguros, setShowSeguros] = useState(() => typeof window !== "undefined" && window.location.pathname.startsWith("/seguros"));
  const [pendingShortId, setPendingShortId] = useState(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname;
    if (path.startsWith("/vehiculo/")) return path.slice("/vehiculo/".length).replace(/\/+$/, "").split("-").pop() || null;
    return null;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleType, setVehicleType] = useState("Todos");
  const [price, setPrice] = useState(1000000000);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState("recientes");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activePhoto, setActivePhoto] = useState("");
  const [footerClicks, setFooterClicks] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const [adminVehicleSearch, setAdminVehicleSearch] = useState("");
  const [adminForm, setAdminForm] = useState({ ...emptyForm });
  const [adminPhotos, setAdminPhotos] = useState([]);
  const [adminError, setAdminError] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const whatsappUrl = "https://wa.me/573175792923?text=" + encodeURIComponent("Hola, estoy interesado en un vehículo de JPM Vehículos.");
  const formattedPrice = new Intl.NumberFormat("es-CO").format(price);

  async function fetchVehicles() {
    if (!supabase) return;

    const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setVehicles((data || []).map(vehicleFromSupabase));
  }

  useEffect(() => {
    document.title = "JPM Vehículos | Compra y venta de vehículos en Barranquilla";
    setMetaTag("description", "JPM Vehículos es una compraventa de vehículos en Barranquilla. Encuentra carros, camionetas y motos disponibles con asesoría directa por WhatsApp.");
    setMetaTag("keywords", "JPM Vehículos, jpmvehiculos, jpmvehiculos.com, compra de carros en Barranquilla, venta de vehículos en Barranquilla, carros usados Barranquilla");
    setCanonicalUrl("https://jpmvehiculos.com/");
  }, []);

  useEffect(() => {
    fetchVehicles();

    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsAdminLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    applyLocationToState();
    window.addEventListener("popstate", applyLocationToState);
    return () => window.removeEventListener("popstate", applyLocationToState);
  }, []);

  useEffect(() => {
    if (!pendingShortId) return;
    const match = vehicles.find((vehicle) => vehicle.dbId && String(vehicle.dbId).slice(0, 8) === pendingShortId);
    if (match) {
      setSelectedVehicle(match);
      setPendingShortId(null);
    }
  }, [pendingShortId, vehicles]);

  useEffect(() => {
    if (selectedVehicle) document.title = `${selectedVehicle.name} | JPM Vehículos`;
    else if (showSeguros) document.title = "Seguro Todo Riesgo Vehicular en Barranquilla | JPM Vehículos";
    else if (showCredito) document.title = "Crédito vehicular en Barranquilla | JPM Vehículos";
    else if (showTramites) document.title = "Trámites vehiculares en Barranquilla | JPM Vehículos";
    else if (showCatalog) document.title = "Vehículos disponibles | JPM Vehículos";
    else document.title = "JPM Vehículos | Compra y venta de vehículos en Barranquilla";
  }, [selectedVehicle, showCatalog, showTramites, showCredito, showSeguros]);

  useEffect(() => {
    if (selectedVehicle) setActivePhoto(selectedVehicle.photos?.[0] || selectedVehicle.image || "");
  }, [selectedVehicle]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vehicleType, price, sortOption]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = vehicle.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesType = vehicleType === "Todos" || vehicle.type === vehicleType;
      const matchesPrice = vehicle.priceNumber <= price;
      const matchesEco = sortOption !== "eco" || isEcoVehicle(vehicle);

      return matchesSearch && matchesType && matchesPrice && matchesEco;
    });
  }, [vehicles, searchTerm, vehicleType, price, sortOption]);

  const sortedVehicles = useMemo(() => {
    const getKm = (vehicle) => cleanNumber(vehicle.km);

    const isEco = (vehicle) => {
     const fuel = String(vehicle.fuel || "").toLowerCase();
     return fuel === "híbrido" || fuel === "hibrido" || fuel === "eléctrico" || fuel === "electrico";
   };

   return [...filteredVehicles].sort((a, b) => {
     const aIsSold = a.status === "Vendido";
     const bIsSold = b.status === "Vendido";

     if (aIsSold && !bIsSold) return 1;
     if (!aIsSold && bIsSold) return -1;
     if (sortOption === "precio-menor") return a.priceNumber - b.priceNumber;
     if (sortOption === "precio-mayor") return b.priceNumber - a.priceNumber;
     if (sortOption === "anio-nuevo") return Number(b.year) - Number(a.year);
     if (sortOption === "anio-antiguo") return Number(a.year) - Number(b.year);
     if (sortOption === "km-menor") return getKm(a) - getKm(b);

     return 0;
   });
 }, [filteredVehicles, sortOption]);

  const totalPages = Math.ceil(sortedVehicles.length / VEHICLES_PER_PAGE);
  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const firstVisibleVehicle = sortedVehicles.length === 0 ? 0 : (currentPage - 1) * VEHICLES_PER_PAGE + 1;
  const lastVisibleVehicle = Math.min(currentPage * VEHICLES_PER_PAGE, sortedVehicles.length);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * VEHICLES_PER_PAGE;
    const end = start + VEHICLES_PER_PAGE;
    return sortedVehicles.slice(start, end);
  }, [sortedVehicles, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const adminFilteredVehicles = useMemo(() => {
    const term = adminVehicleSearch.trim().toLowerCase();
    const vehicleItems = vehicles.map((vehicle, index) => ({ vehicle, index }));

    if (!term) return vehicleItems;

    return vehicleItems.filter(({ vehicle }) => {
      const detailsText = vehicle.details?.map((item) => `${item.label} ${item.value}`).join(" ") || "";
      const searchableText = [vehicle.name, vehicle.type, vehicle.price, vehicle.year, vehicle.km, vehicle.fuel, vehicle.city, vehicle.status, detailsText].join(" ").toLowerCase();
      return searchableText.includes(term);
    });
  }, [vehicles, adminVehicleSearch]);

  function updateAdminField(field, value) {
    setAdminError("");
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAdminPhotos(event) {
    setAdminError("");
    const files = Array.from(event.target.files || []);

    let compressedFiles;
    try {
      compressedFiles = await Promise.all(files.map((file) => compressImage(file)));
    } catch (error) {
      console.error(error);
      setAdminError("No se pudo procesar una de las fotos. Intenta con otra imagen.");
      event.target.value = "";
      return;
    }

    const photos = await Promise.all(
      compressedFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: reader.result, file });
            reader.onerror = () => reject(new Error("No se pudo cargar la imagen"));
            reader.readAsDataURL(file);
          })
      )
    );

    setAdminPhotos((current) => [...current, ...photos]);
    event.target.value = "";
  }

  async function uploadPhotos(photos) {
    if (!supabase) return photos.map((photo) => photo.url || photo);

    const urls = [];

    for (const photo of photos) {
      if (!photo.file) {
        urls.push(photo.url || photo);
        continue;
      }

      const safeName = photo.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
      const { error } = await supabase.storage.from("vehicle-photos").upload(filePath, photo.file, { upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("vehicle-photos").getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  function getDetailValue(vehicle, label) {
    return vehicle.details?.find((item) => item.label === label)?.value || "";
  }

  function editVehicle(vehicle, index) {
    setEditingIndex(index);
    setAdminError("");
    setAdminForm({
      name: vehicle.name || "",
      type: vehicle.type || "Camioneta",
      brand: getDetailValue(vehicle, "Marca"),
      model: getDetailValue(vehicle, "Modelo"),
      version: getDetailValue(vehicle, "Versión"),
      year: vehicle.year || "",
      price: String(vehicle.priceNumber || cleanPrice(vehicle.price)),
      km: String(vehicle.km || "").replace(/[^0-9]/g, ""),
      fuel: vehicle.fuel || "Gasolina",
      city: vehicle.city || "Barranquilla",
      color: getDetailValue(vehicle, "Color"),
      doors: getDetailValue(vehicle, "Puertas") || "5",
      transmission: getDetailValue(vehicle, "Transmisión") || "Automática",
      motor: getDetailValue(vehicle, "Motor"),
      bodyType: getDetailValue(vehicle, "Tipo de carrocería") || "Camioneta",
      reverseCamera: getDetailValue(vehicle, "Con cámara de reversa") || "Sí",
      plateLastDigit: getDetailValue(vehicle, "Último dígito de la placa"),
      description: vehicle.description || "",
      status: vehicle.status || "Disponible",
    });
    setAdminPhotos(vehicle.photos?.length ? vehicle.photos.map((url) => ({ url, file: null })) : []);
    document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingIndex(null);
    setAdminForm({ ...emptyForm });
    setAdminPhotos([]);
    setAdminError("");
  }

  function removeAdminPhoto(indexToRemove) {
    setAdminPhotos((current) => current.filter((_, index) => index !== indexToRemove));
  }

  async function saveVehicle(event) {
    event.preventDefault();
    const validation = validateVehicleForm(adminForm, adminPhotos);
    const priceNumber = cleanPrice(adminForm.price);

    if (!validation.ok) {
      setAdminError(validation.message);
      return;
    }

    setIsSaving(true);
    setAdminError("");

    let photoUrls = [];
    try {
      photoUrls = await uploadPhotos(adminPhotos);
    } catch (error) {
      console.error(error);
      setAdminError("No se pudieron subir las fotos. Revisa el bucket vehicle-photos y sus permisos.");
      setIsSaving(false);
      return;
    }

    const formattedKm = `${formatKm(adminForm.km)} km`;
    const newVehicle = {
      name: adminForm.name,
      type: adminForm.type,
      priceNumber,
      year: adminForm.year,
      km: formattedKm,
      fuel: adminForm.fuel,
      price: money(priceNumber),
      city: adminForm.city,
      image: photoUrls[0],
      photos: photoUrls,
      description: adminForm.description,
      status: adminForm.status,
      details: detailsFromForm(adminForm),
    };

    if (supabase && isAdminLoggedIn) {
      const payload = {
        name: adminForm.name,
        type: adminForm.type,
        brand: adminForm.brand,
        model: adminForm.model,
        version: adminForm.version,
        year: adminForm.year,
        price_number: priceNumber,
        km: formattedKm,
        fuel: adminForm.fuel,
        city: adminForm.city,
        color: adminForm.color,
        doors: adminForm.doors,
        transmission: adminForm.transmission,
        motor: adminForm.motor,
        body_type: adminForm.bodyType,
        reverse_camera: adminForm.reverseCamera,
        plate_last_digit: adminForm.plateLastDigit,
        description: adminForm.description,
        status: adminForm.status,
        image: photoUrls[0],
        photos: photoUrls,
      };

      const vehicleToEdit = editingIndex !== null ? vehicles[editingIndex] : null;
      const request = vehicleToEdit?.dbId ? supabase.from("vehicles").update(payload).eq("id", vehicleToEdit.dbId) : supabase.from("vehicles").insert(payload);
      const { error } = await request;

      if (error) {
        console.error(error);
        setAdminError("No se pudo guardar en Supabase. Revisa las políticas de la tabla vehicles.");
        setIsSaving(false);
        return;
      }

      await fetchVehicles();
    } else if (editingIndex !== null) {
      setVehicles((current) => current.map((vehicle, index) => (index === editingIndex ? newVehicle : vehicle)));
    } else {
      setVehicles((current) => [newVehicle, ...current]);
    }

    setEditingIndex(null);
    setAdminForm({ ...emptyForm });
    setAdminPhotos([]);
    setAdminError("");
    setIsSaving(false);
    document.getElementById("vehiculos")?.scrollIntoView({ behavior: "smooth" });
  }

  async function deleteVehicle(vehicle, indexToDelete) {
    if (supabase && vehicle.dbId) {
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.dbId);

      if (error) {
        console.error(error);
        setAdminError("No se pudo eliminar en Supabase. Revisa las políticas de la tabla vehicles.");
        return;
      }

      await fetchVehicles();
      return;
    }

    setVehicles((current) => current.filter((_, index) => index !== indexToDelete));
  }

  function openAdminLogin() {
    const nextClicks = footerClicks + 1;
    setFooterClicks(nextClicks);
    if (nextClicks >= 7) {
      setShowAdminLogin(true);
      setFooterClicks(0);
    }
  }

  async function loginAdmin(event) {
    event.preventDefault();

    if (supabase) {
      if (!adminEmail.trim() || !adminPassword.trim()) {
        alert("Escribe el correo y la contraseña del admin.");
        return;
      }

      if (hcaptchaSiteKey && !captchaToken) {
        alert("Completa el captcha para continuar.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
        options: hcaptchaSiteKey ? { captchaToken } : undefined,
      });

      if (error) {
        console.error(error);
        // El token de hCaptcha es de un solo uso: reinícialo para permitir otro intento.
        setCaptchaToken("");
        captchaRef.current?.resetCaptcha();
        alert("Correo o contraseña incorrectos.");
        return;
      }

      setCaptchaToken("");
    } else if (adminPassword !== FALLBACK_ADMIN_PASSWORD) {
      alert("Contraseña incorrecta");
      return;
    }

    setIsAdminLoggedIn(true);
    setShowAdminLogin(false);
    setAdminPassword("");
    setTimeout(() => document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function closeAdmin() {
    if (supabase) await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
  }

  function pushPath(path) {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[áàâä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function vehiclePath(vehicle) {
    const shortId = vehicle?.dbId ? String(vehicle.dbId).slice(0, 8) : "";
    const slug = slugify(vehicle?.name);
    return "/vehiculo/" + (shortId ? `${slug}-${shortId}` : slug);
  }

  function applyLocationToState() {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    if (path.startsWith("/vehiculo/")) {
      const last = path.slice("/vehiculo/".length).replace(/\/+$/, "").split("-").pop();
      setShowCatalog(true);
      setShowTramites(false);
      setShowCredito(false);
      setShowSeguros(false);
      setPendingShortId(last || null);
    } else if (path.startsWith("/vehiculos")) {
      setShowCatalog(true);
      setShowTramites(false);
      setShowCredito(false);
      setShowSeguros(false);
      setSelectedVehicle(null);
      setPendingShortId(null);
    } else if (path.startsWith("/tramites")) {
      setShowTramites(true);
      setShowCatalog(false);
      setShowCredito(false);
      setShowSeguros(false);
      setSelectedVehicle(null);
      setPendingShortId(null);
    } else if (path.startsWith("/credito")) {
      setShowCredito(true);
      setShowCatalog(false);
      setShowTramites(false);
      setShowSeguros(false);
      setSelectedVehicle(null);
      setPendingShortId(null);
    } else if (path.startsWith("/seguros")) {
      setShowSeguros(true);
      setShowCatalog(false);
      setShowTramites(false);
      setShowCredito(false);
      setSelectedVehicle(null);
      setPendingShortId(null);
    } else {
      setShowCatalog(false);
      setShowTramites(false);
      setShowCredito(false);
      setShowSeguros(false);
      setSelectedVehicle(null);
      setPendingShortId(null);
    }
  }

  function openCatalog() {
    setShowCatalog(true);
    setShowTramites(false);
    setShowCredito(false);
    setShowSeguros(false);
    setSelectedVehicle(null);
    setMenuOpen(false);
    pushPath("/vehiculos");
    window.scrollTo({ top: 0 });
  }

  function closeCatalog() {
    setShowCatalog(false);
    setSelectedVehicle(null);
    pushPath("/");
  }

  function openVehicle(vehicle) {
    setShowCatalog(true);
    setSelectedVehicle(vehicle);
    pushPath(vehiclePath(vehicle));
  }

  function closeVehicle() {
    setSelectedVehicle(null);
    pushPath("/vehiculos");
  }

  function openTramites() {
    setShowTramites(true);
    setShowCatalog(false);
    setShowCredito(false);
    setShowSeguros(false);
    setSelectedVehicle(null);
    setMenuOpen(false);
    pushPath("/tramites");
    window.scrollTo({ top: 0 });
  }

  function closeTramites() {
    setShowTramites(false);
    pushPath("/");
  }

  function openCredito() {
    setShowCredito(true);
    setShowCatalog(false);
    setShowTramites(false);
    setShowSeguros(false);
    setSelectedVehicle(null);
    setMenuOpen(false);
    pushPath("/credito");
    window.scrollTo({ top: 0 });
  }

  function closeCredito() {
    setShowCredito(false);
    pushPath("/");
  }

  function openSeguros() {
    setShowSeguros(true);
    setShowCatalog(false);
    setShowTramites(false);
    setShowCredito(false);
    setSelectedVehicle(null);
    setMenuOpen(false);
    pushPath("/seguros");
    window.scrollTo({ top: 0 });
  }

  function closeSeguros() {
    setShowSeguros(false);
    pushPath("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#inicio" className="flex items-center">
            <div>
              <p className="text-xl font-black tracking-tight">JPM</p>
              <p className="-mt-1 text-xs uppercase tracking-[0.32em] text-zinc-400">Vehículos</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
            <button onClick={openCatalog} className="transition hover:text-white">Vehículos</button>
            <button onClick={openTramites} className="transition hover:text-white">Trámites</button>
            <button onClick={openCredito} className="transition hover:text-white">Créditos</button>
            <button onClick={openSeguros} className="transition hover:text-white">Seguros</button>
            <a className="transition hover:text-white" href="#nosotros">Nosotros</a>
            <a className="transition hover:text-white" href="#vender">Contáctanos y vende tu vehículo</a>
          </nav>

          <div className="hidden rounded-full bg-white px-6 py-3 font-semibold text-zinc-950 md:inline-flex">Marcando La Diferencia</div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl border border-white/10 px-3 py-2 text-xl md:hidden">{menuOpen ? "×" : "☰"}</button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-zinc-950 px-5 pb-5 md:hidden">
            <div className="flex flex-col gap-4 pt-4 text-zinc-300">
              <button onClick={openCatalog} className="text-left">Vehículos</button>
              <button onClick={openTramites} className="text-left">Trámites</button>
              <button onClick={openCredito} className="text-left">Créditos</button>
              <button onClick={openSeguros} className="text-left">Seguros</button>
              <a onClick={() => setMenuOpen(false)} href="#nosotros">Nosotros</a>
              <a onClick={() => setMenuOpen(false)} href="#vender">Contáctanos y vende tu vehículo</a>
              <Button href={whatsappUrl} className="w-full bg-white text-zinc-950 hover:bg-zinc-200">Escribir por WhatsApp</Button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden bg-white pt-28 text-zinc-950">
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div className="text-left">
              <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight md:text-7xl">JPM Vehículos: compra y venta de vehículos en Barranquilla.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">En JPM Vehículos te acompañamos en cada paso para comprar o vender tus vehículos de forma rápida y segura. Nuestro compromiso es brindarte una atención personalizada y un proceso confiable, para que vivas una experiencia ágil y sin complicaciones. Te esperamos para hacer de tu próxima negociación una experiencia de confianza. </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button onClick={openCatalog} className="bg-zinc-950 text-white hover:bg-zinc-800">Ver vehículos</Button>
                <Button onClick={openTramites} className="border border-black/20 bg-white text-zinc-950 hover:bg-zinc-100">Ver trámites</Button>
                <Button onClick={openCredito} className="bg-zinc-950 text-white hover:bg-zinc-800">Créditos</Button>
                <Button onClick={openSeguros} className="border border-black/20 bg-white text-zinc-950 hover:bg-zinc-100">Ver seguros</Button>
                <Button href="#vender" className="bg-zinc-950 text-white hover:bg-zinc-800">Quiero vender mi carro</Button>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                <div><p className="text-3xl font-black">+25 mil</p><p className="text-sm text-zinc-500">Seguidores</p></div>
                <div><p className="text-3xl font-black">24h</p><p className="text-sm text-zinc-500">Respuesta rápida</p></div>
                <div><p className="text-3xl font-black">100%</p><p className="text-sm text-zinc-500">Asesoría directa</p></div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end lg:translate-x-10 xl:translate-x-16"><LogoCard /></div>
          </div>
        </section>

        {showCatalog && (
          <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950 text-white">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                <button onClick={closeCatalog} className="text-left transition hover:opacity-80">
                  <p className="text-xl font-black tracking-tight">JPM</p>
                  <p className="-mt-1 text-xs uppercase tracking-[0.32em] text-zinc-400">Vehículos</p>
                </button>
                <button onClick={closeCatalog} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  ← Volver al inicio
                </button>
              </div>
            </div>

        <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white p-4 text-zinc-950 shadow-xl">
            <div className="grid gap-3 md:grid-cols-[1.25fr_0.85fr_1.25fr_1fr_auto]">
              <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3">
                <span className="text-zinc-500">🔎</span>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent outline-none placeholder:text-zinc-500" placeholder="Buscar por marca o modelo" />
              </div>
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 outline-none">
                <option value="Todos">Todos</option>
                <option value="Carro">Carro</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Moto">Moto</option>
              </select>
              <div className="rounded-2xl bg-zinc-100 px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-zinc-700">Precio</span>
                  <span className="font-bold text-zinc-950">${formattedPrice}</span>
                </div>
                <input type="range" min="0" max="1000000000" step="1000000" value={price} onChange={(event) => setPrice(Number(event.target.value))} className="w-full accent-zinc-950" />
                <div className="mt-2 flex justify-between text-xs text-zinc-500"><span>$0</span><span>$1.000.000.000</span></div>
              </div>
              <select value={sortOption} onChange={(event) => setSortOption(event.target.value)} className="rounded-2xl bg-zinc-100 px-4 py-3 font-semibold outline-none">
                <option value="recientes">Ordenar</option>
                <option value="eco">Híbrido / Eléctrico</option>
                <option value="precio-menor">Menor precio</option>
                <option value="precio-mayor">Mayor precio</option>
                <option value="anio-nuevo">Año más nuevo</option>
                <option value="anio-antiguo">Año más antiguo</option>
                <option value="km-menor">Menor kilometraje</option>
              </select>
              <button onClick={() => document.getElementById("vehiculos")?.scrollIntoView({ behavior: "smooth" })} className="rounded-2xl bg-zinc-950 px-8 py-3 font-semibold text-white hover:bg-zinc-800">Buscar</button>
            </div>
          </div>
        </section>

        <section id="vehiculos" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Catálogo</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Vehículos disponibles</h2>
            <p className="mt-3 text-zinc-400">{filteredVehicles.length} resultado{filteredVehicles.length === 1 ? "" : "s"} encontrado{filteredVehicles.length === 1 ? "" : "s"}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {paginatedVehicles.map((vehicle, index) => <VehicleCard key={(vehicle.dbId || vehicle.name) + index} vehicle={vehicle} onOpen={openVehicle} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Catálogo paginado</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Mostrando <span className="font-bold text-white">{firstVisibleVehicle}-{lastVisibleVehicle}</span> de <span className="font-bold text-white">{sortedVehicles.length}</span> vehículos
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="hidden h-11 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex sm:items-center">
                    « Primero
                  </button>
                  <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="inline-flex h-11 items-center rounded-full border border-white/10 bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35">
                    ← Anterior
                  </button>

                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1">
                    {paginationItems.map((item) =>
                      typeof item === "string" ? (
                        <span key={item} className="flex h-10 min-w-10 items-center justify-center px-2 text-sm font-black text-zinc-500">…</span>
                      ) : (
                        <button key={item} onClick={() => setCurrentPage(item)} className={"h-10 min-w-10 rounded-full px-3 text-sm font-black transition " + (currentPage === item ? "bg-amber-300 text-zinc-950 shadow-lg shadow-amber-300/20" : "text-zinc-300 hover:bg-white/10 hover:text-white")}>
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="inline-flex h-11 items-center rounded-full border border-white/10 bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35">
                    Siguiente →
                  </button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="hidden h-11 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex sm:items-center">
                    Último »
                  </button>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-300 transition-all duration-300" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
              </div>
            </div>
          )}

          {filteredVehicles.length === 0 && <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center text-zinc-300">No encontramos vehículos con esos filtros. Prueba con otra marca, tipo o sube el precio.</div>}
        </section>
          </div>
        )}

        <section id="nosotros" className="bg-white py-20 text-zinc-950">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Por qué elegirnos?</p>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">Una compraventa pensada para hacerlo fácil.</h2>
              <p className="mt-5 text-lg leading-8 text-zinc-600">Con sede en Barranquilla, JPM Vehículos es una empresa especializada en la compra y venta de vehiculos. Nos distinguimos por ofrecer una experiencia respaldada por la transparencia, la atención personalizada y un servicio profesional en cada negociación.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-zinc-100 p-6"><h3 className="text-xl font-bold">Compra segura</h3><p className="text-sm leading-6 text-zinc-600">Información clara, fotos visibles y asesoría.</p></div>
              <div className="rounded-[2rem] bg-zinc-100 p-6"><h3 className="text-xl font-bold">Buenas ofertas</h3><p className="text-sm leading-6 text-zinc-600">Opciones seleccionadas para tu presupuesto.</p></div>
              <div className="rounded-[2rem] bg-zinc-100 p-6"><h3 className="text-xl font-bold">Atención rápida</h3><p className="text-sm leading-6 text-zinc-600">Contacto directo por WhatsApp.</p></div>
            </div>
          </div>
        </section>

        <section id="vender" className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Contacta y vende</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Habla con nosotros y vende tu vehículo.</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">Da el primer paso hoy. Cuéntanos qué vehículo deseas vender o buscar, y nosotros nos encargaremos de acompañarte durante todo el proceso.</p>
          <div id="contacto" className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
            <h3 className="mb-4 text-2xl font-bold">Contacto directo</h3>
            <div className="space-y-4 text-zinc-300">
              <div>☎ +57 317 579 2923</div>
              <div>📸 IG @jpmvehiculos</div>
              <div>📘 Facebook @JPM vehiculos</div>
              <div>✉️ BiecesJPM@gmail.com</div>
              <div>📍 Barranquilla, Colombia</div>
            </div>
            <Button href={whatsappUrl} className="mt-6 w-full bg-white text-zinc-950 hover:bg-zinc-200">Escribir por WhatsApp</Button>
          </div>
        </section>

        {showTramites && (
          <Suspense fallback={null}>
            <Tramites onClose={closeTramites} />
          </Suspense>
        )}

        {showCredito && (
          <Suspense fallback={null}>
            <Credito onClose={closeCredito} />
          </Suspense>
        )}

        {showSeguros && (
          <Suspense fallback={null}>
            <Seguros onClose={closeSeguros} />
          </Suspense>
        )}

        {isAdminLoggedIn && (
          <Suspense fallback={null}>
            <AdminPanel
              hasSupabase={!!supabase}
              editingIndex={editingIndex}
              cancelEdit={cancelEdit}
              adminError={adminError}
              adminForm={adminForm}
              updateAdminField={updateAdminField}
              handleAdminPhotos={handleAdminPhotos}
              adminPhotos={adminPhotos}
              removeAdminPhoto={removeAdminPhoto}
              saveVehicle={saveVehicle}
              isSaving={isSaving}
              adminVehicleSearch={adminVehicleSearch}
              setAdminVehicleSearch={setAdminVehicleSearch}
              adminFilteredVehicles={adminFilteredVehicles}
              vehiclesCount={vehicles.length}
              editVehicle={editVehicle}
              deleteVehicle={deleteVehicle}
              closeAdmin={closeAdmin}
            />
          </Suspense>
        )}

        {showAdminLogin && (
          <Suspense fallback={null}>
            <AdminLogin
              hasSupabase={!!supabase}
              adminEmail={adminEmail}
              setAdminEmail={setAdminEmail}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              loginAdmin={loginAdmin}
              onCancel={() => {
                setShowAdminLogin(false);
                setCaptchaToken("");
              }}
              hcaptchaSiteKey={hcaptchaSiteKey}
              captchaToken={captchaToken}
              setCaptchaToken={setCaptchaToken}
              captchaRef={captchaRef}
            />
          </Suspense>
        )}

        {selectedVehicle && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-5 py-8 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white text-zinc-950 shadow-2xl">
              <button
                onClick={closeVehicle}
                className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black text-2xl font-bold text-white"
              >
                ×
              </button>

              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="bg-zinc-100 p-5">
                  <div className="relative">
                    <img
                      src={activePhoto || selectedVehicle.image}
                      alt={selectedVehicle.name}
                      className="h-[360px] w-full rounded-[1.5rem] object-contain bg-zinc-100"
                    />

                    <span
                      className={
                        "absolute left-4 top-4 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-lg " +
                        (selectedVehicle.status === "Vendido"
                          ? "bg-red-600 text-white"
                          : "bg-emerald-400 text-zinc-950")
                      }
                    >
                      {selectedVehicle.status || "Disponible"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {(selectedVehicle.photos?.length
                      ? selectedVehicle.photos
                      : [selectedVehicle.image]
                    ).map((photo, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActivePhoto(photo)}
                        className={
                          "overflow-hidden rounded-2xl border-2 transition " +
                          (activePhoto === photo
                            ? "border-amber-400"
                            : "border-transparent hover:border-zinc-300")
                        }
                      >
                        <img
                          src={photo}
                          alt={`${selectedVehicle.name} ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <p className="mb-2 text-sm font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Detalle del vehículo
                  </p>

                  <h3 className="text-4xl font-black tracking-tight">
                    {selectedVehicle.name}
                  </h3>

                  <p className="mt-3 text-3xl font-black text-amber-500">
                    {selectedVehicle.price}
                  </p>

                  <p className="mt-5 text-lg leading-8 text-zinc-600">
                    {selectedVehicle.description}
                  </p>

                  {selectedVehicle.status !== "Vendido" && (
                    <a
                      href={"https://wa.me/573175792923?text=" + encodeURIComponent(`Hola, estoy interesado en el ${selectedVehicle.name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-lg font-bold text-white transition hover:bg-zinc-800"
                    >
                      Preguntar por este carro
                    </a>
                  )}

                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-200">
                    {selectedVehicle.details?.map((item, index) => (
                      <div
                        key={item.label}
                        className={
                          "grid grid-cols-2 gap-4 px-5 py-4 " +
                          (index % 2 === 0 ? "bg-zinc-100" : "bg-white")
                        }
                      >
                        <p className="font-bold text-zinc-950">{item.label}</p>
                        <p className="text-zinc-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-zinc-500">
        <button onClick={openAdminLogin} className="cursor-default select-none">
          © 2026 JPM Vehículos. Compra y venta de vehículos.
        </button>
      </footer>

      <Analytics />
    </div>
  );
}
