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

export function FormInput({ value, onChange, placeholder }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl bg-white px-4 py-3 outline-none" placeholder={placeholder} />;
}

export function FormSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl bg-white px-4 py-3 outline-none">
      {children}
    </select>
  );
}
