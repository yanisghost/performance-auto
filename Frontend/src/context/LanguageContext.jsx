import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const useTranslation = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("lang") || "en";
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("lang", lang);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    if (language === "ar") {
      html.dir = "rtl";
      document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      html.dir = "ltr";
      document.body.style.fontFamily = "'Inter', sans-serif";
    }
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    // Header
    home: "Home",
    inventory: "Inventory",
    financing: "Financing",
    about: "About",
    contact: "Contact",
    searchPlaceholder: "Search premium vehicles by brand, model, year...",
    searchBtn: "Search",
    matchingVehicles: "Matching Showroom Vehicles",
    noVehiclesFound: "No matching vehicles found. Press Enter to search catalog.",
    
    // Home
    heroTitle: "Drive Your Dream Car Today",
    heroDesc: "Discover premium new and certified pre-owned vehicles at unbeatable prices. Engineered for those who demand technical excellence and heritage.",
    browseInventoryBtn: "Browse Inventory",
    contactUsBtn: "Contact Us",
    statsSold: "Cars Sold",
    statsCustomers: "Happy Customers",
    statsExperience: "Years Experience",
    statsAvailable: "Vehicles Available",
    featuredInventory: "Featured Inventory",
    curatedCollections: "Curated Collections",
    exploreCollection: "Explore Collection →",

    // Inventory
    inventoryTitle: "Our Inventory",
    inventorySubtitle: "Precision engineered, hand-selected, and ready for the track or the grand tour. Explore the ultimate collection of performance vehicles.",
    filtersTitle: "Inventory Filters",
    precisionSearch: "Precision Search",
    searchInventoryPlaceholder: "Search specs, model...",
    categoryLabel: "Category",
    brandLabel: "Brand",
    conditionLabel: "Condition",
    priceLabel: "Max Price",
    resetBtn: "Reset Filters",
    sorting: "Sort By",
    sortingNewest: "Newest",
    sortingPriceAsc: "Price: Low to High",
    sortingPriceDesc: "Price: High to Low",
    sortingName: "Name: A to Z",
    newArrivals: "New Arrivals",
    preOwned: "Pre-Owned",
    showingResults: "Showing {count} of {total} listings",
    noResults: "No vehicles match your query. Add a new listing or clear filters.",
    
    // Vehicle Details
    msrpLabel: "MSRP starting at",
    stockLabel: "Stock",
    specsTitle: "Vehicle Specifications",
    mileageLabel: "Mileage",
    fuelLabel: "Fuel Type",
    hpLabel: "Horsepower",
    transLabel: "Transmission",
    paintLabel: "Repainted (Raccord)",
    paintNo: "No (Original)",
    paintYes: "Yes (Repainted)",
    financeEstimator: "Finance Estimator",
    downPayment: "Down Payment",
    termLabel: "Term (Months)",
    monthlyPaymentLabel: "Estimated Monthly Payment",
    calculationNote: "*Calculated at 5.9% APR. Dealer fees not included.",
    contactBtn: "Contact",
    whatsappBtn: "WhatsApp",
    relatedVehicles: "Related Vehicles",
    months: "Months",

    // Footer
    footerDesc: "Algeria's premier source for high-performance and luxury automobiles. Engineered for absolute quality and driver legacy.",
    footerAddress: "Route de Chéraga, Hammamet, Algiers, Algeria",
    footerEmail: "contact@performanceauto.dz",
    footerPhone: "0550 81 23 32",
    copyright: "© 2026 Performance Auto. All rights reserved.",

    // General Words
    allCollections: "All Collections",
    allBrands: "All Brands",
    statusAvailable: "Available",
    statusSold: "Sold",
    statusReserved: "Reserved",
    transmissionManual: "Manuelle",
    transmissionAuto: "Automatique",
    fuelDiesel: "Diesel",
    fuelGasoline: "Gasoline",
    fuelElectric: "Electric",
    fuelHybrid: "Hybrid",
    favoritesTitle: "My Favorites",
    favoritesEmpty: "Your favorites list is empty.",
    favoritesExplore: "Explore Inventory",
    favoritesRemove: "Remove",
    aboutTitle: "About Performance Auto",
    aboutHeading: "Distinguished in the Automotive World",
    aboutIntro: "PERFORMANCE AUTO carefully selects its vehicles to offer a clear, elegant, and reassuring buying experience.",
    aboutVision: "With a luxurious vision, the showroom combines automotive passion with on-the-ground expertise and personalized support. Every car is presented transparently and benefits from a stylish and thoughtful presentation.",
    servicesTitle: "Our Services",
    serviceBuyTitle: "Buying",
    serviceBuyDesc: "A distinguished collection of cars with complete support every step of the way.",
    serviceSellTitle: "Selling",
    serviceSellDesc: "Professional presentation and high-quality advertising for your vehicle.",
    serviceTradeTitle: "Trade-in",
    serviceTradeDesc: "A quick appraisal and practical solution to facilitate your car change.",
    serviceConsultTitle: "Consultation",
    serviceConsultDesc: "Listening, guidance, and expertise to help you make the right decision."
  },
  fr: {
    // Header
    home: "Accueil",
    inventory: "Inventaire",
    financing: "Financement",
    about: "À Propos",
    contact: "Contact",
    searchPlaceholder: "Rechercher des véhicules par marque, modèle, année...",
    searchBtn: "Recherche",
    matchingVehicles: "Véhicules correspondants",
    noVehiclesFound: "Aucun véhicule trouvé. Appuyez sur Entrée pour rechercher.",

    // Home
    heroTitle: "Conduisez la Voiture de Vos Rêves Aujourd'hui",
    heroDesc: "Découvrez des véhicules neufs et d'occasion certifiés à des prix imbattables. Conçus pour ceux qui exigent l'excellence technique et l'héritage.",
    browseInventoryBtn: "Parcourir l'inventaire",
    contactUsBtn: "Contactez-nous",
    statsSold: "Voitures Vendues",
    statsCustomers: "Clients Satisfaits",
    statsExperience: "Années d'expérience",
    statsAvailable: "Véhicules Disponibles",
    featuredInventory: "Inventaire Vedette",
    curatedCollections: "Collections Sélectionnées",
    exploreCollection: "Explorer la collection →",

    // Inventory
    inventoryTitle: "Notre Inventaire",
    inventorySubtitle: "Conçus avec précision, sélectionnés avec soin et prêts pour la piste ou le grand voyage. Explorez l'ultime collection de véhicules de performance.",
    filtersTitle: "Filtres d'inventaire",
    precisionSearch: "Recherche de précision",
    searchInventoryPlaceholder: "Rechercher des specs, modèle...",
    categoryLabel: "Catégorie",
    brandLabel: "Marque",
    conditionLabel: "État",
    priceLabel: "Prix Max",
    resetBtn: "Réinitialiser",
    sorting: "Trier par",
    sortingNewest: "Nouveautés",
    sortingPriceAsc: "Prix : du moins cher",
    sortingPriceDesc: "Prix : du plus cher",
    sortingName: "Nom : de A à Z",
    newArrivals: "Nouveautés",
    preOwned: "Occasion certifiée",
    showingResults: "Affichage de {count} sur {total} annonces",
    noResults: "Aucun véhicule ne correspond à votre recherche. Modifiez vos filtres.",

    // Vehicle Details
    msrpLabel: "MSRP à partir de",
    stockLabel: "Stock",
    specsTitle: "Spécifications du Véhicule",
    mileageLabel: "Kilométrage",
    fuelLabel: "Carburant",
    hpLabel: "Puissance",
    transLabel: "Transmission",
    paintLabel: "Raccord de peinture",
    paintNo: "Non (D'origine)",
    paintYes: "Oui (Repeint)",
    financeEstimator: "Estimateur de crédit",
    downPayment: "Apport initial",
    termLabel: "Durée (Mois)",
    monthlyPaymentLabel: "Paiement Mensuel Estimé",
    calculationNote: "*Calculé à 5,9% TAEG. Frais de dossier non inclus.",
    contactBtn: "Contact",
    whatsappBtn: "WhatsApp",
    relatedVehicles: "Véhicules Similaires",
    months: "Mois",

    // Footer
    footerDesc: "La première source en Algérie pour les automobiles de luxe et de haute performance. Conçues pour une qualité absolue.",
    footerAddress: "Route de Chéraga, Hammamet, Alger, Algérie",
    footerEmail: "contact@performanceauto.dz",
    footerPhone: "0550 81 23 32",
    copyright: "© 2026 Performance Auto. Tous droits réservés.",

    // General Words
    allCollections: "Toutes les collections",
    allBrands: "Toutes les marques",
    statusAvailable: "Disponible",
    statusSold: "Vendu",
    statusReserved: "Réservé",
    transmissionManual: "Manuelle",
    transmissionAuto: "Automatique",
    fuelDiesel: "Diesel",
    fuelGasoline: "Essence",
    fuelElectric: "Électrique",
    fuelHybrid: "Hybride",
    favoritesTitle: "Mes Favoris",
    favoritesEmpty: "Votre liste de favoris est vide.",
    favoritesExplore: "Explorer l'Inventaire",
    favoritesRemove: "Supprimer",
    aboutTitle: "À Propos de Performance Auto",
    aboutHeading: "Distingué dans le Monde Automobile",
    aboutIntro: "PERFORMANCE AUTO sélectionne soigneusement ses véhicules pour offrir une expérience d'achat claire, élégante et rassurante.",
    aboutVision: "Avec une vision luxueuse, le showroom allie la passion automobile à l'expertise de terrain et à un accompagnement personnalisé. Chaque voiture est présentée de manière transparente et bénéficie d'une présentation soignée et réfléchie.",
    servicesTitle: "Nos Services",
    serviceBuyTitle: "Achat",
    serviceBuyDesc: "Une collection distinguée de voitures avec un accompagnement complet à chaque étape.",
    serviceSellTitle: "Vente",
    serviceSellDesc: "Présentation professionnelle et publicité de haute qualité pour votre véhicule.",
    serviceTradeTitle: "Reprise",
    serviceTradeDesc: "Une estimation rapide et une solution pratique pour faciliter votre changement de voiture.",
    serviceConsultTitle: "Consultation",
    serviceConsultDesc: "Écoute, conseils et expertise pour vous aider à prendre la bonne décision."
  },
  ar: {
    // Header
    home: "الرئيسية",
    inventory: "المخزون",
    financing: "التمويل",
    about: "من نحن",
    contact: "اتصل بنا",
    searchPlaceholder: "ابحث عن السيارات حسب العلامة التجارية، الموديل، السنة...",
    searchBtn: "بحث",
    matchingVehicles: "السيارات المطابقة في المعرض",
    noVehiclesFound: "لم يتم العثور على سيارات مطابقة. اضغط Enter للبحث في المعرض.",

    // Home
    heroTitle: "قُد سيارة أحلامك اليوم",
    heroDesc: "اكتشف تشكيلة مميزة من السيارات الجديدة والمستعملة المعتمدة بأسعار لا تقبل المنافسة. صُممت خصيصاً لمن يبحث عن التفوق التقني والأصالة.",
    browseInventoryBtn: "تصفح المخزون",
    contactUsBtn: "اتصل بنا",
    statsSold: "سيارة مباعة",
    statsCustomers: "عميل سعيد",
    statsExperience: "سنوات خبرة",
    statsAvailable: "سيارة متوفرة",
    featuredInventory: "أبرز السيارات المتوفرة",
    curatedCollections: "المجموعات المختارة",
    exploreCollection: "استكشف المجموعة ←",

    // Inventory
    inventoryTitle: "معرض السيارات",
    inventorySubtitle: "سيارات معدلة بدقة، مختارة بعناية، وجاهزة للحلبة أو للرحلات الطويلة. استكشف المجموعة المثالية للسيارات الرياضية الفاخرة.",
    filtersTitle: "تصفية النتائج",
    precisionSearch: "بحث دقيق",
    searchInventoryPlaceholder: "ابحث بالمواصفات، الموديل...",
    categoryLabel: "الفئة",
    brandLabel: "العلامة التجارية",
    conditionLabel: "الحالة",
    priceLabel: "أقصى سعر",
    resetBtn: "إعادة ضبط التصفية",
    sorting: "ترتيب حسب",
    sortingNewest: "الأحدث",
    sortingPriceAsc: "السعر: من الأقل للأعلى",
    sortingPriceDesc: "السعر: من الأعلى للأقل",
    sortingName: "الاسم: من أ إلى ي",
    newArrivals: "وصل حديثاً",
    preOwned: "مستعمل معتمد",
    showingResults: "عرض {count} من أصل {total} سيارة متوفرة",
    noResults: "لا توجد سيارات مطابقة لبحثك. يرجى تعديل خيارات التصفية.",

    // Vehicle Details
    msrpLabel: "السعر الأساسي يبدأ من",
    stockLabel: "رقم المخزون",
    specsTitle: "مواصفات السيارة التفصيلية",
    mileageLabel: "المسافة المقطوعة",
    fuelLabel: "نوع الوقود",
    hpLabel: "القوة الحصانية",
    transLabel: "ناقل الحركة",
    paintLabel: "طلاء معاد (رش)",
    paintNo: "لا (أصلي)",
    paintYes: "نعم (معاد طلاؤه)",
    financeEstimator: "حاسبة التمويل",
    downPayment: "الدفعة الأولى",
    termLabel: "مدة التمويل (بالأشهر)",
    monthlyPaymentLabel: "القسط الشهري المتوقع",
    calculationNote: "*محسوب على أساس نسبة 5.9% فائدة سنوية. لا تشمل الرسوم الإدارية.",
    contactBtn: "اتصل بنا",
    whatsappBtn: "واتساب",
    relatedVehicles: "سيارات ذات صلة",
    months: "أشهر",

    // Footer
    footerDesc: "المصدر الأول في الجزائر للسيارات الرياضية الفاخرة ذات الأداء العالي. صُممت لتحقيق الجودة المطلقة وإرضاء شغف القيادة.",
    footerAddress: "طريق الشراقة، الحمامات، الجزائر العاصمة، الجزائر",
    footerEmail: "contact@performanceauto.dz",
    footerPhone: "0550 81 23 32",
    copyright: "© 2026 Performance Auto. جميع الحقوق محفوظة.",

    // General Words
    allCollections: "كل المجموعات",
    allBrands: "كل الماركات",
    statusAvailable: "متوفر",
    statusSold: "مباع",
    statusReserved: "محجوز",
    transmissionManual: "يدوي",
    transmissionAuto: "أوتوماتيكي",
    fuelDiesel: "ديزل",
    fuelGasoline: "بنزين",
    fuelElectric: "كهربائي",
    fuelHybrid: "هجين",
    favoritesTitle: "المفضلة الخاصة بي",
    favoritesEmpty: "قائمة المفضلة فارغة.",
    favoritesExplore: "تصفح المعرض",
    favoritesRemove: "حذف",
    aboutTitle: "حول بيرفورمانس أوتو",
    aboutHeading: "متميزون في عالم السيارات",
    aboutIntro: "تختار بيرفورمانس أوتو سياراتها بعناية فائقة لتقدم تجربة شراء واضحة، أنيقة، ومطمئنة.",
    aboutVision: "من خلال رؤية فاخرة، يجمع المعرض بين شغف السيارات والخبرة الميدانية والدعم الشخصي. تُعرض كل سيارة بشفافية تامة وتستفيد من عرض أنيق ومدروس.",
    servicesTitle: "خدماتنا",
    serviceBuyTitle: "الشراء",
    serviceBuyDesc: "مجموعة متميزة من السيارات مع دعم كامل ومستمر في كل خطوة.",
    serviceSellTitle: "البيع",
    serviceSellDesc: "عرض احترافي وإعلانات عالية الجودة لسيارتك.",
    serviceTradeTitle: "الاستبدال",
    serviceTradeDesc: "تقييم سريع وحل عملي لتسهيل تغيير سيارتك.",
    serviceConsultTitle: "الاستشارات",
    serviceConsultDesc: "الاستماع، التوجيه، والخبرة لمساعدتك على اتخاذ القرار الصحيح."
  }
};
