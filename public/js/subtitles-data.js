export const SUBTITLES_DATA = {
  "the-beginning": {
    1: {
      en: [
        { start: 0.5, end: 2.6, text: "Five years ago, they took everything from my family." },
        { start: 2.9, end: 5.2, text: "They thought I was destroyed in the abyss..." },
        { start: 5.5, end: 7.8, text: "Today, the rightful heir returns to claim the city!" },
        { start: 8.1, end: 9.9, text: "Never cross someone who has nothing left to lose." }
      ],
      es: [
        { start: 0.5, end: 2.6, text: "Hace cinco años, le quitaron todo a mi familia." },
        { start: 2.9, end: 5.2, text: "Pensaron que había sido destruido en el abismo..." },
        { start: 5.5, end: 7.8, text: "¡Hoy, el legítimo heredero regresa para reclamar la ciudad!" },
        { start: 8.1, end: 9.9, text: "Nunca te metas con alguien que no tiene nada que perder." }
      ],
      id: [
        { start: 0.5, end: 2.6, text: "Lima tahun lalu, mereka merenggut segalanya dari keluargaku." },
        { start: 2.9, end: 5.2, text: "Mereka mengira aku telah hancur di jurang keputusasaan..." },
        { start: 5.5, end: 7.8, text: "Hari ini, pewaris sejati kembali untuk merebut kembali kota ini!" },
        { start: 8.1, end: 9.9, text: "Jangan pernah melawan orang yang tidak takut kehilangan apa pun." }
      ]
    }
  },
  "master-of-dragons": {
    1: {
      en: [
        { start: 0.5, end: 2.6, text: "The ancient seal of the Dragon Abyss has shattered!" },
        { start: 2.9, end: 5.2, text: "Who dares set foot in my sacred domain?" },
        { start: 5.5, end: 7.8, text: "Fools! You are standing before the Supreme Dragon King." },
        { start: 8.1, end: 9.9, text: "Pay for your insolence with your very life!" }
      ],
      es: [
        { start: 0.5, end: 2.6, text: "¡El antiguo sello del Abismo del Dragón se ha roto!" },
        { start: 2.9, end: 5.2, text: "¿Quién se atreve a poner un pie en mi dominio sagrado?" },
        { start: 5.5, end: 7.8, text: "¡Insensatos! Están ante el Supremo Rey Dragón." },
        { start: 8.1, end: 9.9, text: "¡Paguen por su insolencia con su propia vida!" }
      ],
      id: [
        { start: 0.5, end: 2.6, text: "Segel kuno Palung Naga akhirnya telah hancur!" },
        { start: 2.9, end: 5.2, text: "Siapa yang berani menginjakkan kaki di wilayah suciku?" },
        { start: 5.5, end: 7.8, text: "Bodoh! Kalian sedang berhadapan dengan Raja Naga Agung." },
        { start: 8.1, end: 9.9, text: "Bayar kelancangan kalian dengan nyawa kalian sendiri!" }
      ]
    }
  },
  "dragon-god": {
    1: {
      en: [
        { start: 0.5, end: 2.6, text: "Look at this lowly delivery boy thinking he belongs here." },
        { start: 2.9, end: 5.2, text: "Sign the divorce papers, Aris. You are unworthy." },
        { start: 5.5, end: 7.8, text: "You have no idea who built this entire empire." },
        { start: 8.1, end: 9.9, text: "When the Dragon Pavilion arrives, do not beg for mercy." }
      ],
      es: [
        { start: 0.5, end: 2.6, text: "Miren a este humilde repartidor creyendo que encaja aquí." },
        { start: 2.9, end: 5.2, text: "Firma el divorcio, Aris. No eres digno de nosotros." },
        { start: 5.5, end: 7.8, text: "No tienen idea de quién construyó este imperio entero." },
        { start: 8.1, end: 9.9, text: "Cuando llegue el Pabellón del Dragón, no supliquen piedad." }
      ],
      id: [
        { start: 0.5, end: 2.6, text: "Lihat kurir rendahan ini berlagak pantas berada di sini." },
        { start: 2.9, end: 5.2, text: "Tandatangani surat cerai ini, Aris. Kau tidak pantas." },
        { start: 5.5, end: 7.8, text: "Kalian tidak tahu siapa yang membangun seluruh kekaisaran ini." },
        { start: 8.1, end: 9.9, text: "Saat Paviliun Naga tiba, jangan memohon ampun." }
      ]
    }
  }
};

export function getSubtitleCues(seriesId, episodeId, lang) {
  if (lang === "off") return [];

  const seriesData = SUBTITLES_DATA[seriesId];
  if (seriesData && seriesData[episodeId] && seriesData[episodeId][lang]) {
    return seriesData[episodeId][lang];
  }

  // Fallback dramatic cues for any episode across all 9 catalog series
  const fallbacks = {
    en: [
      { start: 0.5, end: 2.6, text: "You think you've won, but the retribution has just begun." },
      { start: 2.9, end: 5.2, text: "Did you really believe your secrets were safe?" },
      { start: 5.5, end: 7.8, text: "From this moment on, every debt will be repaid in full." },
      { start: 8.1, end: 9.9, text: "Witness the true power you pushed into the shadows!" }
    ],
    es: [
      { start: 0.5, end: 2.6, text: "Crees que has ganado, pero la retribución apenas comienza." },
      { start: 2.9, end: 5.2, text: "¿De verdad creíste que tus secretos estaban a salvo?" },
      { start: 5.5, end: 7.8, text: "A partir de este momento, cada deuda será saldada." },
      { start: 8.1, end: 9.9, text: "¡Sean testigos del poder que intentaron enterrar!" }
    ],
    id: [
      { start: 0.5, end: 2.6, text: "Kau merasa sudah menang, tapi pembalasan baru saja dimulai." },
      { start: 2.9, end: 5.2, text: "Apakah kau benar-benar mengira rahasiamu aman?" },
      { start: 5.5, end: 7.8, text: "Mulai detik ini, setiap utang harus dibayar lunas." },
      { start: 8.1, end: 9.9, text: "Saksikanlah kekuatan sejati yang coba kalian singkirkan!" }
    ]
  };

  return fallbacks[lang] || fallbacks.en;
}
