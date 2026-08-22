export function Button({ children, href, onClick, type = "button", disabled = false, className = "" }) {
  const base = "inline-flex items-center justify-center rounded-full px-6 py-3 font-bold transition ";

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={base + className}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={base + className}>
      {children}
    </button>
  );
}

// El "name" sirve para tres cosas: que el navegador pueda autocompletar y
// recordar lo escrito, que el campo tenga un id propio, y que un lector de
// pantalla lo anuncie. El placeholder no basta: desaparece al escribir.
export function FormInput({ value, onChange, placeholder, name }) {
  return (
    <input
      id={name ? `campo-${name}` : undefined}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl bg-white px-4 py-3 outline-none"
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

// El select no tiene placeholder, así que la etiqueta va aparte.
export function FormSelect({ value, onChange, children, name, label }) {
  return (
    <select
      id={name ? `campo-${name}` : undefined}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl bg-white px-4 py-3 outline-none"
      aria-label={label}
    >
      {children}
    </select>
  );
}
