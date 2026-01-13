export type Brand = {
  id: string;
  name: string;
  color: string;
  nivelSocioeconomico: string;
  segmentoTransversal: string;
  nucleoPublico: string;
  codigoCultural: string;
  tiempoEnVideo: number; // seconds inside the master reel
  costoBaseMinimo: number; // USD
};

export const brands: Brand[] = [
  {
    id: "paysandu-golf",
    name: "Paysandú Golf Club",
    color: "#34a853",
    nivelSocioeconomico: "Alto",
    segmentoTransversal: "Líderes ejecutivos",
    nucleoPublico: "Golfistas premium",
    codigoCultural: "Herencia deportiva",
    tiempoEnVideo: 28,
    costoBaseMinimo: 1800,
  },
  {
    id: "mamba-negra",
    name: "Mamba Negra",
    color: "#f06292",
    nivelSocioeconomico: "Medio-Alto",
    segmentoTransversal: "Estilo urbano",
    nucleoPublico: "Sneakerheads latam",
    codigoCultural: "Rebeldía urbana",
    tiempoEnVideo: 18,
    costoBaseMinimo: 1500,
  },
  {
    id: "paris-londres",
    name: "Paris Londres Beer House",
    color: "#f4b400",
    nivelSocioeconomico: "Medio",
    segmentoTransversal: "After office",
    nucleoPublico: "Profesionales millennials",
    codigoCultural: "Social + gourmet",
    tiempoEnVideo: 14,
    costoBaseMinimo: 1200,
  },
  {
    id: "aurora-bijou",
    name: "Aurora Bijou Atelier",
    color: "#8e67f7",
    nivelSocioeconomico: "Medio-Alto",
    segmentoTransversal: "Diseño independiente",
    nucleoPublico: "Compradoras boutique",
    codigoCultural: "Alta artesanía",
    tiempoEnVideo: 12,
    costoBaseMinimo: 1050,
  },
  {
    id: "delta-energy",
    name: "Delta Energy Lab",
    color: "#00bcd4",
    nivelSocioeconomico: "Medio",
    segmentoTransversal: "Innovación sostenible",
    nucleoPublico: "Consumidores eco-activos",
    codigoCultural: "Tecnología verde",
    tiempoEnVideo: 8,
    costoBaseMinimo: 980,
  },
];
