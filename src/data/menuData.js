import { apiUrl } from '../lib/api'

export const categories = [
  { id: 'all', name: 'All Menu', icon: 'All' },
  { id: 'rice-bowl', name: 'Rice Bowls', icon: 'Bowl' },
  { id: 'nasi', name: 'Rice Base', icon: 'Rice' },
  { id: 'risol', name: 'Risoles', icon: 'Snack' },
  { id: 'extras', name: 'Add-ons', icon: 'Plus' },
]

export const optimizeImageUrl = (url, size = 360) => {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('/uploads')) {
    return apiUrl(url)
  }
  if (!url.includes('images.unsplash.com')) return url

  try {
    const imageUrl = new URL(url)
    imageUrl.searchParams.set('w', String(size))
    imageUrl.searchParams.set('h', String(size))
    imageUrl.searchParams.set('fit', 'crop')
    imageUrl.searchParams.set('auto', 'format')
    imageUrl.searchParams.set('q', '75')
    return imageUrl.toString()
  } catch {
    return url
  }
}

export const cleanMenuName = (name = '') => name

export const menuItems = [
  // RICE BOWLS (Chicken & Meat toppings)
  {
    id: 1,
    name: 'Ayam Suwir Rice Bowl',
    description: 'Shredded chicken cooked in rich authentic Indonesian seasoning',
    price: 25000,
    originalPrice: 28000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.8,
    reviews: 142,
    isPopular: true,
    isNew: false,
    calories: 420,
    prepTime: '8 min',
    tags: ['Indonesian', 'Best Seller'],
  },
  {
    id: 2,
    name: 'Ayam Asam Manis Rice Bowl',
    description: 'Crispy chicken bites tossed in rich sweet and sour sauce with bell peppers',
    price: 26000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.6,
    reviews: 89,
    isPopular: false,
    isNew: false,
    calories: 450,
    prepTime: '10 min',
    tags: ['Sweet & Sour', 'Chicken'],
  },
  {
    id: 3,
    name: 'Ayam Teriyaki Rice Bowl',
    description: 'Tender chicken cubes glazed in sweet and savory Japanese teriyaki sauce',
    price: 26000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.7,
    reviews: 120,
    isPopular: true,
    isNew: false,
    calories: 460,
    prepTime: '10 min',
    tags: ['Teriyaki', 'Sweet'],
  },
  {
    id: 4,
    name: 'Ayam Lada Hitam Rice Bowl',
    description: 'Stir-fried chicken tossed in bold black pepper sauce and fresh onions',
    price: 26000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.7,
    reviews: 95,
    isPopular: false,
    isNew: false,
    calories: 430,
    prepTime: '10 min',
    tags: ['Black Pepper', 'Savory'],
  },
  {
    id: 5,
    name: 'Ayam Sambal Matah Rice Bowl',
    description: 'Crispy chicken pieces topped with aromatic fresh Balinese raw shallot salsa',
    price: 27000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.9,
    reviews: 168,
    isPopular: true,
    isNew: false,
    calories: 440,
    prepTime: '8 min',
    tags: ['Sambal Matah', 'Spicy', 'Fresh'],
  },
  {
    id: 6,
    name: 'Ayam Salted Egg Rice Bowl',
    description: 'Crispy deep-fried chicken glazed with creamy and aromatic salted egg yolk sauce',
    price: 29000,
    originalPrice: 32000,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.8,
    reviews: 154,
    isPopular: true,
    isNew: true,
    calories: 520,
    prepTime: '12 min',
    tags: ['Salted Egg', 'Creamy', 'Premium'],
  },
  {
    id: 7,
    name: 'Ayam Mentai Rice Bowl',
    description: 'Baked chicken covered in creamy, flame-torched Japanese Mentai sauce',
    price: 29000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.8,
    reviews: 110,
    isPopular: false,
    isNew: true,
    calories: 510,
    prepTime: '12 min',
    tags: ['Mentai', 'Baked', 'Trending'],
  },
  {
    id: 8,
    name: 'Kanzler Mercon Rice Bowl',
    description: 'Slices of premium Kanzler sausage cooked in blazing hot chili pepper sauce',
    price: 28000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.9,
    reviews: 187,
    isPopular: true,
    isNew: false,
    calories: 490,
    prepTime: '8 min',
    tags: ['Kanzler', 'Super Spicy', 'Must Try'],
  },
  {
    id: 9,
    name: 'Chicken Katsu Rice Bowl',
    description: 'Japanese style crispy golden breaded chicken breast served with sweet savory sauce',
    price: 25000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1598511726623-d73df53155ee?w=400&h=400&fit=crop',
    category: 'rice-bowl',
    rating: 4.7,
    reviews: 135,
    isPopular: false,
    isNew: false,
    calories: 480,
    prepTime: '10 min',
    tags: ['Katsu', 'Crispy'],
  },

  // NASI BASE (Rice options)
  {
    id: 10,
    name: 'Nasi Daun Jeruk',
    description: 'Fragrant and aromatic jasmine rice cooked with coconut milk and fresh lime leaves',
    price: 8000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
    category: 'nasi',
    rating: 4.9,
    reviews: 210,
    isPopular: true,
    isNew: false,
    calories: 180,
    prepTime: '3 min',
    tags: ['Lime Leaf', 'Aromatic'],
  },
  {
    id: 11,
    name: 'Nasi Bom Merah',
    description: 'Flavorful and spicy red seasoned jasmine rice for extra heat',
    price: 8000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    category: 'nasi',
    rating: 4.8,
    reviews: 175,
    isPopular: false,
    isNew: true,
    calories: 190,
    prepTime: '3 min',
    tags: ['Spicy Rice', 'Hot'],
  },
  {
    id: 12,
    name: 'Nasi Biasa',
    description: 'Steamed premium white jasmine rice, warm and simple',
    price: 6000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop',
    category: 'nasi',
    rating: 4.6,
    reviews: 90,
    isPopular: false,
    isNew: false,
    calories: 150,
    prepTime: '2 min',
    tags: ['Plain Rice', 'Classic'],
  },

  // RISOL
  {
    id: 13,
    name: 'Risol Sosis Mayo',
    description: 'Crispy rolled breadcrumb pastry filled with sliced premium sausage, egg, and creamy mayonnaise',
    price: 10000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
    category: 'risol',
    rating: 4.8,
    reviews: 132,
    isPopular: true,
    isNew: false,
    calories: 210,
    prepTime: '5 min',
    tags: ['Mayo', 'Snack', 'Best Seller'],
  },
  {
    id: 14,
    name: 'Risol Ayam Suwir',
    description: 'Crispy rolled breadcrumb pastry filled with spiced and savory shredded chicken filling',
    price: 10000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop',
    category: 'risol',
    rating: 4.7,
    reviews: 98,
    isPopular: false,
    isNew: false,
    calories: 200,
    prepTime: '5 min',
    tags: ['Chicken Risol', 'Savory'],
  },

  // TAMBAHAN / EXTRAS
  {
    id: 15,
    name: 'Scrambled Eggs',
    description: 'Soft, creamy, and perfectly seasoned fluffy scrambled eggs',
    price: 5000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=400&fit=crop',
    category: 'extras',
    rating: 4.7,
    reviews: 85,
    isPopular: false,
    isNew: false,
    calories: 120,
    prepTime: '4 min',
    tags: ['Add-on', 'Egg'],
  },
  {
    id: 16,
    name: 'Nugget Extra',
    description: 'Three pieces of crispy and savory golden chicken nuggets',
    price: 6000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
    category: 'extras',
    rating: 4.6,
    reviews: 64,
    isPopular: false,
    isNew: false,
    calories: 140,
    prepTime: '4 min',
    tags: ['Add-on', 'Nugget'],
  },
]

export const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const getMenuItems = async () => {
  try {
    const response = await fetch('/api/menu')
    if (!response.ok) throw new Error('Failed to fetch menu')
    const data = await response.json()
    // Map snake_case fields from API to camelCase for frontend
    return data.map(item => ({
      ...item,
      name: cleanMenuName(item.name),
      image: optimizeImageUrl(item.image),
      originalPrice: item.original_price,
      prepTime: item.prep_time,
      category: item.category_id,
      rating: parseFloat(item.rating) || 0,
    }))
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return menuItems // fallback to local data if API fails
  }
}

export const saveMenuItems = async (items) => {
  // Dalam kasus ini, AdminPage hanya bisa menambah item baru, jadi kita bisa ubah menjadi fungsi tambah.
  // Tapi untuk mempercepat, jika Anda mengirim array (seperti dari localStorage sebelumnya), 
  // kita cukup mengirim item terakhir yang baru ditambahkan jika itu logika di AdminPage.
  // Untuk sementara, kita tidak perlu ini jika di AdminPage nanti kita ubah untuk POST item per item.
  console.log('Use POST /api/menu to save new item');
}
