/**
 * Card storage utilities using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface StoredCard {
  id: string;
  cardNumber: string; // Full card number (encrypted in production)
  cardNumberMasked: string;
  cardholderName: string;
  expiryDate: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  trackData: string;
  cvv?: string;
  createdAt: number;
  lastUsed?: number;
}

const CARDS_STORAGE_KEY = 'offline_pay_cards';
const MAX_CARDS = 10;

/**
 * Get all stored cards
 */
export async function getAllCards(): Promise<StoredCard[]> {
  try {
    const data = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as StoredCard[];
  } catch (error) {
    console.error('Error getting cards:', error);
    return [];
  }
}

/**
 * Get a single card by ID
 */
export async function getCardById(id: string): Promise<StoredCard | null> {
  try {
    const cards = await getAllCards();
    return cards.find((card) => card.id === id) || null;
  } catch (error) {
    console.error('Error getting card:', error);
    return null;
  }
}

/**
 * Add a new card
 */
export async function addCard(
  cardData: Omit<StoredCard, 'id' | 'createdAt'>
): Promise<StoredCard | null> {
  try {
    const cards = await getAllCards();

    // Check max cards limit
    if (cards.length >= MAX_CARDS) {
      throw new Error(`Maximum ${MAX_CARDS} cards allowed`);
    }

    // Check for duplicate (last 4 digits)
    const lastFour = cardData.cardNumber.slice(-4);
    const isDuplicate = cards.some((card) => card.cardNumber.slice(-4) === lastFour);
    if (isDuplicate) {
      throw new Error('Card already exists');
    }

    const newCard: StoredCard = {
      ...cardData,
      id: uuidv4(),
      createdAt: Date.now(),
    };

    cards.push(newCard);
    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));

    return newCard;
  } catch (error) {
    console.error('Error adding card:', error);
    return null;
  }
}

/**
 * Update a card
 */
export async function updateCard(
  id: string,
  updates: Partial<Omit<StoredCard, 'id' | 'createdAt'>>
): Promise<StoredCard | null> {
  try {
    const cards = await getAllCards();
    const index = cards.findIndex((card) => card.id === id);

    if (index === -1) {
      throw new Error('Card not found');
    }

    const updatedCard = { ...cards[index], ...updates };
    cards[index] = updatedCard;

    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));

    return updatedCard;
  } catch (error) {
    console.error('Error updating card:', error);
    return null;
  }
}

/**
 * Delete a card
 */
export async function deleteCard(id: string): Promise<boolean> {
  try {
    const cards = await getAllCards();
    const filtered = cards.filter((card) => card.id !== id);

    if (filtered.length === cards.length) {
      throw new Error('Card not found');
    }

    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('Error deleting card:', error);
    return false;
  }
}

/**
 * Update last used timestamp
 */
export async function updateLastUsed(id: string): Promise<boolean> {
  try {
    await updateCard(id, { lastUsed: Date.now() });
    return true;
  } catch (error) {
    console.error('Error updating last used:', error);
    return false;
  }
}

/**
 * Clear all cards (for testing)
 */
export async function clearAllCards(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(CARDS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cards:', error);
    return false;
  }
}

/**
 * Get card count
 */
export async function getCardCount(): Promise<number> {
  const cards = await getAllCards();
  return cards.length;
}

/**
 * Check if max cards limit reached
 */
export async function isMaxCardsReached(): Promise<boolean> {
  const count = await getCardCount();
  return count >= MAX_CARDS;
}
