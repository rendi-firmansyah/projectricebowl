export const riceOptions = ['Nasi Daun Jeruk', 'Nasi Bom Merah', 'Nasi Biasa']

export const spiceOptions = ['Tidak Pedas', 'Pedas']

export const toppingOptions = [
  { id: 'nugget', name: 'Nugget', price: 6000 },
  { id: 'scrambled-eggs', name: 'Scrambled Eggs', price: 5000 },
]

export const isCustomizableBowl = (item) =>
  item.category === 'rice-bowl' || item.category_id === 'rice-bowl' || item.name?.toLowerCase().includes('rice bowl')

export const getDefaultCustomization = (item, options = {}) => {
  const includeDefaults = options.includeDefaults !== false

  return {
    rice: includeDefaults && isCustomizableBowl(item) ? 'Nasi Daun Jeruk' : '',
    spice: includeDefaults && isCustomizableBowl(item) ? 'Tidak Pedas' : '',
    toppings: [],
  }
}

export const getEmptyCustomization = (item) => ({
  rice: '',
  spice: '',
  toppings: [],
})

export const buildItemNote = (item) => {
  const details = []

  if (isCustomizableBowl(item)) {
    if (item.customization?.spice) details.push(`Level: ${item.customization.spice}`)

    const toppings = item.customization?.toppings || []
    if (toppings.length > 0) {
      details.push(`Topping: ${toppings.map(topping => topping.name).join(', ')}`)
    }
  }

  if (item.note) details.push(`Catatan: ${item.note}`)
  return details.join(' | ')
}
