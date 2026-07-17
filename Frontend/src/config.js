export const API_BASE_URL = 'http://localhost:3000/api/v1';

export const getMediaUrl = (filename, type = 'image') => {
  if (!filename) return '';
  if (filename.startsWith('http') || filename.startsWith('data:')) return filename;
  
  let folder;
  if (type === 'video') {
    folder = 'videos/products';
  } else if (type === 'category') {
    folder = 'img/categories';
  } else {
    folder = 'img/products';
  }
  return `http://localhost:3000/${folder}/${filename}`;
};

export const formatPrice = (value, carPrice = null) => {
  if (value === undefined || value === null || value === '') return 'N/A';
  const numericVal = Number(value);
  if (isNaN(numericVal)) return value;

  // If carPrice is provided, use it to decide. Otherwise, check value magnitude.
  const isAlgerian = carPrice !== null ? carPrice < 5000 : numericVal < 5000;

  if (!isAlgerian) {
    return `$${Math.round(numericVal).toLocaleString()}`;
  }

  const lang = localStorage.getItem("lang") || "en";

  if (numericVal >= 1000) {
    const val = Number((numericVal / 1000).toFixed(2));
    if (lang === "ar") {
      return `${val} مليار`;
    } else if (lang === "fr") {
      return `${val} Milliard${val > 1 ? 's' : ''}`;
    } else {
      return `${val} Billion${val > 1 ? 's' : ''}`;
    }
  } else {
    const val = Number(numericVal.toFixed(2));
    if (lang === "ar") {
      return `${val} مليون`;
    } else if (lang === "fr") {
      return `${val} Million${val > 1 ? 's' : ''}`;
    } else {
      return `${val} Million${val > 1 ? 's' : ''}`;
    }
  }
};
