// Vocabulario compartido entre el formulario del público (MisVehiculos) y el
// del admin (AdminPanel). Está aquí y no en App.jsx para que no existan dos
// listas que se desincronicen: cuando una solicitud se pasa al formulario de
// publicación, los valores tienen que entrar tal cual, sin traducir nada.

export const VEHICLE_TYPES = ["Carro", "Camioneta", "Moto"];

export const FUELS = ["Gasolina", "Diésel", "Híbrido", "Eléctrico"];

export const TRANSMISSIONS = ["Automática", "Mecánica", "Por confirmar"];

// Carrocerías válidas según el tipo de vehículo. Los tipos que no estén aquí
// (Moto) dejan el campo como texto libre.
export const bodyTypesByVehicleType = {
  Carro: ["Sedán", "Hatchback", "Coupé", "Convertible", "Wagon"],
  Camioneta: ["SUV", "Wagon", "Platón", "Panel", "Furgón"],
};
