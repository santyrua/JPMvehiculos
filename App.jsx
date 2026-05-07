import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const FALLBACK_ADMIN_PASSWORD = "JPMontoya1041692941@";

const emptyAdminForm = {
  name: "",
  type: "Camioneta",
  brand: "",
  model: "",
  version: "",
  year: "",
  price: "",
  km: "",
  fuel: "Gasolina",
  city: "Barranquilla",
  color: "",
  doors: "5",
  transmission: "Automática",
  motor: "",
  bodyType: "Camioneta",
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
  ["year", "Año"],
  ["version", "Versión"],
  ["price", "Precio"],
  ["km", "Kilómetros"],
  ["city", "Ciudad"],
  ["color", "Color"],
  ["fuel", "Tipo de combustible"],
  ["transmission", "Transmisión"],
  ["motor", "Motor"],
  ["doors", "Puertas"],
  ["bodyType", "Tipo de carrocería"],
  ["plateLastDigit", "Último dígito de la placa"],
  ["description", "Descripción"],
  ["status", "Estado"],
];

function cleanPrice(value) {
  return Number(String(value).replace(/[^0-9]/g, "")) || 0;
}

function money(value) {
  return "$" + new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

function validateVehicleForm(form, photos) {
  const emptyFields = requiredFields.filter(([key]) => !String(form[key] || "").trim());
  if (emptyFields.length > 0) {
    return {
      ok: false,
      message: "Completa estos campos: " + emptyFields.map(([, label]) => label).join(", ") + ".",
    };
  }

  if (cleanPrice(form.price) <= 0) {
    return { ok: false, message: "El precio debe ser mayor a $0." };
  }

  if (!photos || photos.length === 0) {
    return { ok: false, message: "Debes subir al menos una foto del vehículo." };
  }

  return { ok: true, message: "" };
}

function runTests() {
  const complete = {
    ...emptyAdminForm,
    name: "Chevrolet Equinox",
    brand: "Chevrolet",
    model: "Equinox",
    year: "2018",
    version: "1.5 Premier",
    price: "145.000.000",
    km: "40000",
    color: "Gris",
    motor: "1.5",
    plateLastDigit: "6",
    description: "Camioneta en buen estado.",
  };

  console.assert(validateVehicleForm(emptyAdminForm, []).ok === false, "Debe rechazar campos vacíos");
  console.assert(validateVehicleForm({ ...complete, price: "0" }, [{ url: "x" }]).ok === false, "Debe rechazar precio cero");
  console.assert(validateVehicleForm(complete, []).ok === false, "Debe exigir fotos");
  console.assert(validateVehicleForm(complete, [{ url: "x" }]).ok === true, "Debe aceptar datos completos");
  console.assert(cleanPrice("145.000.000") === 145000000, "Debe limpiar puntos del precio");
  console.assert(money(1000000) === "$1.000.000", "Debe formatear moneda");
}
runTests();

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
    { label: "Kilómetros", value: `${form.km} km` },
    { label: "Último dígito de la placa", value: form.plateLastDigit },
  ];
}

function vehicleFromRow(row) {
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
    km: String(row.km || "").replace(/ km/i, ""),
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
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
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
    <div className="logo-card">
      <svg viewBox="0 0 420 150" className="logo-svg" aria-label="Logo JPM Vehículos">
        <path d="M55 88 L93 88 L126 58 L220 58 L265 88 L342 94 Q367 96 367 117 L367 125 L347 125" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M55 88 L45 88 L45 112 L58 125" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="105" cy="125" r="25" fill="black" stroke="white" strokeWidth="10" />
        <circle cx="310" cy="125" r="25" fill="black" stroke="white" strokeWidth="10" />
        <line x1="150" y1="125" x2="260" y2="125" stroke="white" strokeWidth="10" strokeLinecap="round" />
      </svg>
      <h2>JPM VEHÍCULOS</h2>
      <p>Siempre marcando la diferencia</p>
    </div>
  );
}

function Button({ children, href, onClick, type = "button", className = "", disabled = false }) {
  if (href) {
    return (
      <a className={`button ${className}`} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`button ${className}`}>
      {children}
    </button>
  );
}

function FieldInput({ value, onChange, placeholder }) {
  return <input className="field" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

function FieldSelect({ value, onChange, children }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState(starterVehicles);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleType, setVehicleType] = useState("Todos");
  const [price, setPrice] = useState(1000000000);
  const [sortOption, setSortOption] = useState("recientes");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [footerClicks, setFooterClicks] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminForm, setAdminForm] = useState({ ...emptyAdminForm });
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

    setVehicles((data || []).map(vehicleFromRow));
  }

  useEffect(() => {
    fetchVehicles();

    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsAdminLoggedIn(true);
    });
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = vehicleType === "Todos" || vehicle.type === vehicleType;
      const matchesPrice = vehicle.priceNumber <= price;
      const isAvailable = vehicle.status !== "Vendido";
      return matchesSearch && matchesType && matchesPrice && isAvailable;
    });
  }, [vehicles, searchTerm, vehicleType, price]);

  const sortedVehicles = useMemo(() => {
    const getKmNumber = (vehicle) => Number(String(vehicle.km || "").replace(/[^0-9]/g, "")) || 0;

    return [...filteredVehicles].sort((a, b) => {
      if (sortOption === "precio-menor") return a.priceNumber - b.priceNumber;
      if (sortOption === "precio-mayor") return b.priceNumber - a.priceNumber;
      if (sortOption === "anio-nuevo") return Number(b.year) - Number(a.year);
      if (sortOption === "anio-antiguo") return Number(a.year) - Number(b.year);
      if (sortOption === "km-menor") return getKmNumber(a) - getKmNumber(b);
      return 0;
    });
  }, [filteredVehicles, sortOption]);

  function updateAdminField(field, value) {
    setAdminError("");
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAdminPhotos(event) {
    setAdminError("");
    const files = Array.from(event.target.files || []);

    const photos = await Promise.all(
      files.map(
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

  async function uploadPhotosToSupabase(photos) {
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
      km: String(vehicle.km || "").replace(/ km/i, ""),
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
    setAdminForm({ ...emptyAdminForm });
    setAdminPhotos([]);
    setAdminError("");
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
      photoUrls = await uploadPhotosToSupabase(adminPhotos);
    } catch (error) {
      console.error(error);
      setAdminError("No se pudieron subir las fotos. Revisa el bucket vehicle-photos y sus permisos.");
      setIsSaving(false);
      return;
    }

    const newVehicle = {
      name: adminForm.name,
      type: adminForm.type,
      priceNumber,
      year: adminForm.year,
      km: `${adminForm.km} km`,
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
        km: `${adminForm.km} km`,
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
      const request = vehicleToEdit?.dbId
        ? supabase.from("vehicles").update(payload).eq("id", vehicleToEdit.dbId)
        : supabase.from("vehicles").insert(payload);

      const { error } = await request;

      if (error) {
        console.error(error);
        setAdminError("No se pudo guardar en Supabase. Revisa las políticas de la tabla vehicles.");
        setIsSaving(false);
        return;
      }

      await fetchVehicles();
    } else {
      if (editingIndex !== null) {
        setVehicles((current) => current.map((vehicle, index) => (index === editingIndex ? newVehicle : vehicle)));
      } else {
        setVehicles((current) => [newVehicle, ...current]);
      }
    }

    setEditingIndex(null);
    setAdminForm({ ...emptyAdminForm });
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

      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error) {
        console.error(error);
        alert("Correo o contraseña incorrectos.");
        return;
      }
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

  return (
    <div className="page">
      <header className="topbar">
        <a href="#inicio" className="brand">
          <strong>JPM</strong>
          <span>Vehículos</span>
        </a>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <a href="#vehiculos" onClick={() => setMenuOpen(false)}>Vehículos</a>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#vender" onClick={() => setMenuOpen(false)}>Contáctanos y vende tu vehículo</a>
          <Button href={whatsappUrl} className="mobile-whatsapp">Escribir por WhatsApp</Button>
        </nav>

        <div className="slogan">Marcando La Diferencia</div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div className="hero-text">
            <h1>Encuentra tu próximo vehículo con confianza.</h1>
            <p>En JPM Vehículos te ayudamos a comprar o vender tu carro de manera rápida, clara y segura, con atención personalizada y opciones seleccionadas.</p>
            <div className="hero-actions">
              <Button href="#vehiculos" className="primary">Ver vehículos</Button>
              <Button href="#vender" className="secondary">Quiero vender mi carro</Button>
            </div>

            <div className="stats">
              <div><strong>+25 mil</strong><span>Seguidores</span></div>
              <div><strong>24h</strong><span>Respuesta rápida</span></div>
              <div><strong>100%</strong><span>Asesoría directa</span></div>
            </div>
          </div>

          <LogoCard />
        </section>

        <section className="search-box">
          <div className="search-grid">
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por marca o modelo" />
            <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Carro">Carro</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Moto">Moto</option>
            </select>

            <div className="range-box">
              <div className="range-label"><span>Precio</span><strong>${formattedPrice}</strong></div>
              <input type="range" min="0" max="1000000000" step="1000000" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
              <div className="range-minmax"><span>$0</span><span>$1.000.000.000</span></div>
            </div>

            <select value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
              <option value="recientes">Ordenar</option>
              <option value="precio-menor">Menor precio</option>
              <option value="precio-mayor">Mayor precio</option>
              <option value="anio-nuevo">Año más nuevo</option>
              <option value="anio-antiguo">Año más antiguo</option>
              <option value="km-menor">Menor kilometraje</option>
            </select>

            <button className="search-button" onClick={() => document.getElementById("vehiculos")?.scrollIntoView({ behavior: "smooth" })}>Buscar</button>
          </div>
        </section>

        <section id="vehiculos" className="catalog">
          <div className="section-title">
            <span>Catálogo</span>
            <h2>Vehículos disponibles</h2>
            <p>{filteredVehicles.length} resultado{filteredVehicles.length === 1 ? "" : "s"} encontrado{filteredVehicles.length === 1 ? "" : "s"}</p>
          </div>

          <div className="cards">
            {sortedVehicles.map((vehicle, index) => (
              <article key={(vehicle.dbId || vehicle.name) + index} className="vehicle-card" onClick={() => setSelectedVehicle(vehicle)}>
                <div className="vehicle-image">
                  <img src={vehicle.image} alt={vehicle.name} />
                  <span className={`status ${vehicle.status === "Vendido" ? "sold" : "available"}`}>{vehicle.status || "Disponible"}</span>
                </div>
                <div className="vehicle-info">
                  <div className="vehicle-head">
                    <div>
                      <h3>{vehicle.name}</h3>
                      <p>📍 {vehicle.city}</p>
                    </div>
                    <strong>{vehicle.price}</strong>
                  </div>
                  <div className="vehicle-specs">
                    <div>📅<br />{vehicle.year}</div>
                    <div>⏱<br />{vehicle.km}</div>
                    <div>⛽<br />{vehicle.fuel}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="empty">No encontramos vehículos con esos filtros. Prueba con otra marca, tipo o sube el precio.</div>
          )}
        </section>

        <section id="nosotros" className="about">
          <div>
            <span>Por qué elegirnos</span>
            <h2>Una compraventa pensada para hacerlo fácil.</h2>
            <p>JPM Vehículos nace para conectar compradores y vendedores con un proceso más claro, visual y directo. La idea es que cada persona pueda encontrar información confiable antes de tomar una decisión.</p>
          </div>

          <div className="benefits">
            <div><strong>✓</strong><h3>Compra segura</h3><p>Vehículos con información clara, fotos visibles y asesoría durante todo el proceso.</p></div>
            <div><strong>$</strong><h3>Buenas ofertas</h3><p>Opciones seleccionadas para que encuentres carros según tu presupuesto.</p></div>
            <div><strong>☎</strong><h3>Atención rápida</h3><p>Contacto directo por WhatsApp para resolver dudas o agendar una visita.</p></div>
          </div>
        </section>

        <section id="vender" className="contact-section">
          <span>Contacta y vende</span>
          <h2>Habla con nosotros y vende tu vehículo.</h2>
          <p>En un solo lugar puedes enviarnos los datos de tu vehículo, pedir asesoría, consultar disponibilidad o agendar una visita con JPM Vehículos.</p>

          <div className="contact-card">
            <h3>Contacto directo</h3>
            <p>☎ +57 317 579 2923</p>
            <p>📸 IG @jpmvehiculos</p>
            <p>📘 Facebook @JPM vehiculos</p>
            <p>✉️ BiecesJPM@gmail.com</p>
            <p>📍 Barranquilla, Colombia</p>
            <Button href={whatsappUrl} className="white">Escribir por WhatsApp</Button>
          </div>
        </section>

        {isAdminLoggedIn && (
          <section id="admin" className="admin-section">
            <div className="admin-intro">
              <span>Panel admin</span>
              <h2>{editingIndex !== null ? "Editar publicación" : "Agregar vehículos al catálogo"}</h2>
              <p>Desde aquí puedes cargar o editar un vehículo con sus fotos y datos. Si Supabase está conectado, los cambios quedan guardados en la base de datos.</p>
              {!supabase && <p className="warning">Supabase no está conectado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.</p>}
            </div>

            <div className="admin-grid">
              <form className="admin-form" onSubmit={saveVehicle}>
                <div className="admin-form-head">
                  <h3>{editingIndex !== null ? "Editando vehículo" : "Datos del vehículo"}</h3>
                  {editingIndex !== null && <button type="button" onClick={cancelEdit}>Cancelar edición</button>}
                </div>

                {adminError && <div className="error">{adminError}</div>}

                <div className="form-grid">
                  <FieldInput value={adminForm.name} onChange={(value) => updateAdminField("name", value)} placeholder="Nombre completo del vehículo" />
                  <FieldSelect value={adminForm.type} onChange={(value) => updateAdminField("type", value)}><option>Carro</option><option>Camioneta</option><option>Moto</option></FieldSelect>
                  <FieldSelect value={adminForm.status} onChange={(value) => updateAdminField("status", value)}><option>Disponible</option><option>Vendido</option></FieldSelect>
                  <FieldInput value={adminForm.brand} onChange={(value) => updateAdminField("brand", value)} placeholder="Marca" />
                  <FieldInput value={adminForm.model} onChange={(value) => updateAdminField("model", value)} placeholder="Modelo" />
                  <FieldInput value={adminForm.year} onChange={(value) => updateAdminField("year", value)} placeholder="Año" />
                  <FieldInput value={adminForm.version} onChange={(value) => updateAdminField("version", value)} placeholder="Versión" />
                  <FieldInput value={adminForm.price} onChange={(value) => updateAdminField("price", value)} placeholder="Precio sin puntos" />
                  <FieldInput value={adminForm.km} onChange={(value) => updateAdminField("km", value)} placeholder="Kilómetros" />
                  <FieldInput value={adminForm.city} onChange={(value) => updateAdminField("city", value)} placeholder="Ciudad" />
                  <FieldInput value={adminForm.color} onChange={(value) => updateAdminField("color", value)} placeholder="Color" />
                  <FieldSelect value={adminForm.fuel} onChange={(value) => updateAdminField("fuel", value)}><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></FieldSelect>
                  <FieldSelect value={adminForm.transmission} onChange={(value) => updateAdminField("transmission", value)}><option>Automática</option><option>Mecánica</option><option>Por confirmar</option></FieldSelect>
                  <FieldInput value={adminForm.motor} onChange={(value) => updateAdminField("motor", value)} placeholder="Motor" />
                  <FieldInput value={adminForm.doors} onChange={(value) => updateAdminField("doors", value)} placeholder="Puertas" />
                  <FieldInput value={adminForm.bodyType} onChange={(value) => updateAdminField("bodyType", value)} placeholder="Tipo de carrocería" />
                  <FieldInput value={adminForm.plateLastDigit} onChange={(value) => updateAdminField("plateLastDigit", value)} placeholder="Último dígito de la placa" />
                </div>

                <textarea value={adminForm.description} onChange={(event) => updateAdminField("description", event.target.value)} placeholder="Descripción del vehículo" />

                <div className="photo-box">
                  <label>Fotos del vehículo</label>
                  <input type="file" accept="image/*" multiple onChange={handleAdminPhotos} />
                  <small>Puedes seleccionar varias fotos. La primera será la principal.</small>

                  {adminPhotos.length > 0 && (
                    <div>
                      <div className="photo-top">
                        <strong>{adminPhotos.length} foto{adminPhotos.length === 1 ? "" : "s"} cargada{adminPhotos.length === 1 ? "" : "s"}</strong>
                        <button type="button" onClick={() => setAdminPhotos([])}>Borrar fotos</button>
                      </div>
                      <div className="photo-preview">
                        {adminPhotos.map((photo, index) => (
                          <img key={index} src={photo.url || photo} alt="Vista previa" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button className="save-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Guardando..." : editingIndex !== null ? "Actualizar publicación" : "Guardar vehículo"}
                </button>
              </form>

              <aside className="loaded-list">
                <h3>Vehículos cargados</h3>
                {vehicles.map((vehicle, index) => (
                  <div key={(vehicle.dbId || vehicle.name) + index} className="loaded-item">
                    <span>{vehicle.status || "Disponible"}</span>
                    <strong>{vehicle.name}</strong>
                    <p>{vehicle.price} · {vehicle.year}</p>
                    <div>
                      <button onClick={() => editVehicle(vehicle, index)}>Editar</button>
                      <button onClick={() => deleteVehicle(vehicle, index)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </aside>
            </div>

            <button className="close-admin" onClick={closeAdmin}>Cerrar panel admin</button>
          </section>
        )}

        {showAdminLogin && (
          <div className="modal-backdrop high">
            <form className="login-modal" onSubmit={loginAdmin}>
              <h3>Acceso administrador</h3>
              <p>{supabase ? "Ingresa tu correo y contraseña de Supabase Auth." : "Supabase no está conectado. Usa la contraseña temporal."}</p>
              {supabase && <input type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="Correo admin" autoFocus />}
              <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Contraseña" autoFocus={!supabase} />
              <div className="login-actions">
                <button type="submit">Entrar</button>
                <button type="button" onClick={() => setShowAdminLogin(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {selectedVehicle && (
          <div className="modal-backdrop">
            <div className="vehicle-modal">
              <button className="modal-close" onClick={() => setSelectedVehicle(null)}>×</button>
              <div className="modal-grid">
                <div className="modal-gallery">
                  <div className="main-photo-wrap">
                    <img src={selectedVehicle.image} alt={selectedVehicle.name} className="main-photo" />
                    <span className={`status ${selectedVehicle.status === "Vendido" ? "sold" : "available"}`}>{selectedVehicle.status || "Disponible"}</span>
                  </div>
                  <div className="thumbs">
                    {selectedVehicle.photos.map((photo, index) => (
                      <img key={index} src={photo} alt={selectedVehicle.name} />
                    ))}
                  </div>
                </div>
                <div className="modal-info">
                  <span>Detalle del vehículo</span>
                  <h3>{selectedVehicle.name}</h3>
                  <strong>{selectedVehicle.price}</strong>
                  <p>{selectedVehicle.description}</p>
                  <div className="detail-table">
                    {selectedVehicle.details?.map((item, index) => (
                      <div key={item.label} className={index % 2 === 0 ? "even" : "odd"}>
                        <b>{item.label}</b>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <button onClick={openAdminLogin}>© 2026 JPM Vehículos. Compra y venta de vehículos.</button>
      </footer>
    </div>
  );
}
