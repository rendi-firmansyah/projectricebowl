import { createContext, useContext, useReducer, useEffect } from 'react'
import { getDefaultCustomization } from '../data/orderOptions'

const CartContext = createContext()

const STORAGE_KEY = 'couple-bowl-cart'

const loadCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveCart = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

const getOptionKey = (item) => {
  const customization = {
    ...getDefaultCustomization(item),
    ...item.customization,
  }
  const toppings = (customization.toppings || [])
    .map(topping => topping.id || topping.name)
    .sort()
    .join(',')
  return [
    customization.rice || '',
    customization.spice || '',
    toppings,
    (item.note || '').trim().toLowerCase(),
  ].join('|')
}

const getItemKey = (item) =>
  item.cartKey || `${item.id}::${getOptionKey(item)}`

const getToppingTotal = (item) =>
  (item.customization?.toppings || []).reduce((sum, topping) => sum + Number(topping.price || 0), 0)

const getItemUnitPrice = (item) => Number(item.price || 0) + getToppingTotal(item)

const getItemLineTotal = (item) => getItemUnitPrice(item) * Number(item.quantity || 0)

const withCartKey = (item) => ({
  ...item,
  cartKey: getItemKey({ ...item, cartKey: undefined }),
  note: item.note || '',
  customization: {
    ...getDefaultCustomization(item),
    ...item.customization,
    toppings: Array.isArray(item.customization?.toppings) ? item.customization.toppings : [],
  },
})

const cartReducer = (state, action) => {
  let newState
  switch (action.type) {
    case 'ADD_ITEM': {
      const payload = withCartKey(action.payload)
      const existing = state.find((item) => getItemKey(item) === payload.cartKey)
      if (existing) {
        newState = state.map((item) =>
          getItemKey(item) === payload.cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newState = [...state, { ...payload, quantity: 1 }]
      }
      break
    }
    case 'REMOVE_ITEM':
      newState = state.filter((item) => getItemKey(item) !== action.payload)
      break
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        newState = state.filter((item) => getItemKey(item) !== action.payload.key)
      } else {
        newState = state.map((item) =>
          getItemKey(item) === action.payload.key
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
      break
    }
    case 'UPDATE_NOTE':
      newState = state.map((item) =>
        getItemKey(item) === action.payload.key
          ? withCartKey({ ...item, cartKey: undefined, note: action.payload.note })
          : item
      )
      break
    case 'UPDATE_OPTIONS':
      newState = state.map((item) =>
        getItemKey(item) === action.payload.key
          ? withCartKey({
              ...item,
              cartKey: undefined,
              customization: {
                ...item.customization,
                ...action.payload.options,
              },
            })
          : item
      )
      break
    case 'CLEAR_CART':
      newState = []
      break
    default:
      return state
  }
  saveCart(newState)
  return newState
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], () => loadCart().map(withCartKey))

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: item })
  const removeItem = (key) => dispatch({ type: 'REMOVE_ITEM', payload: key })
  const updateQuantity = (key, quantity) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { key, quantity } })
  const updateItemNote = (key, note) =>
    dispatch({ type: 'UPDATE_NOTE', payload: { key, note } })
  const updateItemOptions = (key, options) =>
    dispatch({ type: 'UPDATE_OPTIONS', payload: { key, options } })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + getItemLineTotal(item),
    0
  )
  const deliveryFee = subtotal > 100000 ? 0 : 10000
  const total = subtotal + deliveryFee

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateItemNote,
        updateItemOptions,
        clearCart,
        getItemUnitPrice,
        getItemLineTotal,
        totalItems,
        subtotal,
        deliveryFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
