// Trading and Marketplace System

import type { Relic } from './nft-relics';
import type { Weapon } from './weapons';
import { tokenBurnManager } from './tokenomics';

export interface MarketplaceListing {
  id: string;
  seller: string;
  itemType: 'relic' | 'weapon' | 'material' | 'consumable';
  itemId: string;
  itemData: Relic | Weapon | MarketplaceItem;
  price: bigint;
  currency: 'DGN' | 'STT' | 'USDO';
  listedAt: number;
  expiresAt?: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  views: number;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  image: string;
}

export interface Trade {
  id: string;
  buyer: string;
  seller: string;
  listingId: string;
  price: bigint;
  currency: string;
  fee: bigint;
  timestamp: number;
  txHash?: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyer: string;
  amount: bigint;
  currency: 'DGN' | 'STT' | 'USDO';
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export class MarketplaceManager {
  private listings: Map<string, MarketplaceListing>;
  private trades: Trade[];
  private offers: Map<string, Offer[]>;
  private userListings: Map<string, string[]>; // userAddress -> listingIds
  private marketplaceFeePercent = 5; // 5% fee

  constructor() {
    this.listings = new Map();
    this.trades = [];
    this.offers = new Map();
    this.userListings = new Map();
  }

  // Create a new listing
  createListing(
    seller: string,
    itemType: MarketplaceListing['itemType'],
    itemId: string,
    itemData: MarketplaceListing['itemData'],
    price: bigint,
    currency: 'DGN' | 'STT' | 'USDO' = 'DGN',
    durationDays: number = 7
  ): {
    success: boolean;
    message: string;
    listing?: MarketplaceListing;
  } {
    if (price <= BigInt(0)) {
      return { success: false, message: 'Price must be greater than 0' };
    }

    const listing: MarketplaceListing = {
      id: `listing-${Date.now()}-${Math.random()}`,
      seller,
      itemType,
      itemId,
      itemData,
      price,
      currency,
      listedAt: Date.now(),
      expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      status: 'active',
      views: 0,
    };

    this.listings.set(listing.id, listing);

    // Track user listings
    const userListingIds = this.userListings.get(seller) || [];
    userListingIds.push(listing.id);
    this.userListings.set(seller, userListingIds);

    return {
      success: true,
      message: 'Item listed successfully',
      listing,
    };
  }

  // Buy an item
  buyItem(
    buyer: string,
    listingId: string
  ): {
    success: boolean;
    message: string;
    trade?: Trade;
    fee?: bigint;
  } {
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    if (listing.status !== 'active') {
      return { success: false, message: 'Listing is not active' };
    }

    if (listing.expiresAt && Date.now() > listing.expiresAt) {
      listing.status = 'expired';
      return { success: false, message: 'Listing has expired' };
    }

    if (listing.seller === buyer) {
      return { success: false, message: 'Cannot buy your own listing' };
    }

    // Calculate marketplace fee
    const fee = (listing.price * BigInt(this.marketplaceFeePercent)) / BigInt(100);
    const sellerReceives = listing.price - fee;

    // Record trade
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random()}`,
      buyer,
      seller: listing.seller,
      listingId,
      price: listing.price,
      currency: listing.currency,
      fee,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2)}`,
    };

    this.trades.push(trade);

    // Update listing status
    listing.status = 'sold';

    // Burn the marketplace fee
    tokenBurnManager.recordBurn('marketplace_fee', fee, trade.txHash);

    return {
      success: true,
      message: `Item purchased! Seller receives ${sellerReceives} ${listing.currency}`,
      trade,
      fee,
    };
  }

  // Cancel a listing
  cancelListing(
    seller: string,
    listingId: string
  ): {
    success: boolean;
    message: string;
  } {
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    if (listing.seller !== seller) {
      return { success: false, message: 'Only seller can cancel listing' };
    }

    if (listing.status !== 'active') {
      return { success: false, message: 'Listing is not active' };
    }

    listing.status = 'cancelled';

    return {
      success: true,
      message: 'Listing cancelled successfully',
    };
  }

  // Make an offer on a listing
  makeOffer(
    buyer: string,
    listingId: string,
    amount: bigint,
    currency: 'DGN' | 'STT' | 'USDO',
    message?: string,
    durationHours: number = 24
  ): {
    success: boolean;
    message: string;
    offer?: Offer;
  } {
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    if (listing.status !== 'active') {
      return { success: false, message: 'Listing is not active' };
    }

    if (listing.seller === buyer) {
      return { success: false, message: 'Cannot make offer on your own listing' };
    }

    if (amount <= BigInt(0)) {
      return { success: false, message: 'Offer amount must be greater than 0' };
    }

    const offer: Offer = {
      id: `offer-${Date.now()}-${Math.random()}`,
      listingId,
      buyer,
      amount,
      currency,
      message,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
    };

    const listingOffers = this.offers.get(listingId) || [];
    listingOffers.push(offer);
    this.offers.set(listingId, listingOffers);

    return {
      success: true,
      message: 'Offer submitted successfully',
      offer,
    };
  }

  // Accept an offer
  acceptOffer(
    seller: string,
    offerId: string
  ): {
    success: boolean;
    message: string;
    trade?: Trade;
  } {
    let targetOffer: Offer | undefined;
    let listing: MarketplaceListing | undefined;

    // Find the offer
    this.offers.forEach((offers, listingId) => {
      const offer = offers.find((o) => o.id === offerId);
      if (offer) {
        targetOffer = offer;
        listing = this.listings.get(listingId);
      }
    });

    if (!targetOffer || !listing) {
      return { success: false, message: 'Offer not found' };
    }

    if (listing.seller !== seller) {
      return { success: false, message: 'Only seller can accept offers' };
    }

    if (targetOffer.status !== 'pending') {
      return { success: false, message: 'Offer is not pending' };
    }

    if (Date.now() > targetOffer.expiresAt) {
      targetOffer.status = 'expired';
      return { success: false, message: 'Offer has expired' };
    }

    // Calculate fee
    const fee =
      (targetOffer.amount * BigInt(this.marketplaceFeePercent)) / BigInt(100);

    // Create trade
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random()}`,
      buyer: targetOffer.buyer,
      seller: listing.seller,
      listingId: listing.id,
      price: targetOffer.amount,
      currency: targetOffer.currency,
      fee,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2)}`,
    };

    this.trades.push(trade);

    // Update statuses
    targetOffer.status = 'accepted';
    listing.status = 'sold';

    // Burn marketplace fee
    tokenBurnManager.recordBurn('marketplace_fee', fee, trade.txHash);

    return {
      success: true,
      message: 'Offer accepted successfully',
      trade,
    };
  }

  // Reject an offer
  rejectOffer(
    seller: string,
    offerId: string
  ): {
    success: boolean;
    message: string;
  } {
    let targetOffer: Offer | undefined;
    let listing: MarketplaceListing | undefined;

    this.offers.forEach((offers, listingId) => {
      const offer = offers.find((o) => o.id === offerId);
      if (offer) {
        targetOffer = offer;
        listing = this.listings.get(listingId);
      }
    });

    if (!targetOffer || !listing) {
      return { success: false, message: 'Offer not found' };
    }

    if (listing.seller !== seller) {
      return { success: false, message: 'Only seller can reject offers' };
    }

    targetOffer.status = 'rejected';

    return {
      success: true,
      message: 'Offer rejected',
    };
  }

  // Get listing by ID
  getListing(listingId: string): MarketplaceListing | undefined {
    const listing = this.listings.get(listingId);
    if (listing) {
      listing.views++;
    }
    return listing;
  }

  // Get all active listings
  getActiveListings(filters?: {
    itemType?: MarketplaceListing['itemType'];
    currency?: string;
    minPrice?: bigint;
    maxPrice?: bigint;
    rarity?: string;
  }): MarketplaceListing[] {
    let listings = Array.from(this.listings.values()).filter(
      (l) => l.status === 'active'
    );

    if (filters) {
      if (filters.itemType) {
        listings = listings.filter((l) => l.itemType === filters.itemType);
      }
      if (filters.currency) {
        listings = listings.filter((l) => l.currency === filters.currency);
      }
      if (filters.minPrice) {
        listings = listings.filter((l) => l.price >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        listings = listings.filter((l) => l.price <= filters.maxPrice!);
      }
      if (filters.rarity) {
        listings = listings.filter((l) => {
          const data = l.itemData as any;
          return data.rarity === filters.rarity;
        });
      }
    }

    return listings;
  }

  // Get user's listings
  getUserListings(userAddress: string): MarketplaceListing[] {
    const listingIds = this.userListings.get(userAddress) || [];
    return listingIds
      .map((id) => this.listings.get(id))
      .filter((l) => l !== undefined) as MarketplaceListing[];
  }

  // Get user's purchase history
  getUserPurchases(userAddress: string): Trade[] {
    return this.trades.filter((t) => t.buyer === userAddress);
  }

  // Get user's sales history
  getUserSales(userAddress: string): Trade[] {
    return this.trades.filter((t) => t.seller === userAddress);
  }

  // Get offers for a listing
  getListingOffers(listingId: string): Offer[] {
    return this.offers.get(listingId) || [];
  }

  // Get user's offers
  getUserOffers(userAddress: string): Offer[] {
    const allOffers: Offer[] = [];
    this.offers.forEach((offers) => {
      offers.forEach((offer) => {
        if (offer.buyer === userAddress) {
          allOffers.push(offer);
        }
      });
    });
    return allOffers;
  }

  // Get marketplace statistics
  getMarketplaceStats(): {
    totalListings: number;
    activeListings: number;
    totalTrades: number;
    totalVolume: bigint;
    totalFees: bigint;
    averagePrice: bigint;
  } {
    const activeListings = this.getActiveListings();
    const totalVolume = this.trades.reduce(
      (sum, trade) => sum + trade.price,
      BigInt(0)
    );
    const totalFees = this.trades.reduce(
      (sum, trade) => sum + trade.fee,
      BigInt(0)
    );
    const averagePrice =
      this.trades.length > 0 ? totalVolume / BigInt(this.trades.length) : BigInt(0);

    return {
      totalListings: this.listings.size,
      activeListings: activeListings.length,
      totalTrades: this.trades.length,
      totalVolume,
      totalFees,
      averagePrice,
    };
  }

  // Get trending items (most viewed/traded)
  getTrendingItems(limit: number = 10): MarketplaceListing[] {
    return Array.from(this.listings.values())
      .filter((l) => l.status === 'active')
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // Get recent trades
  getRecentTrades(limit: number = 20): Trade[] {
    return this.trades.slice(-limit).reverse();
  }

  // Search listings
  searchListings(query: string): MarketplaceListing[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.listings.values()).filter((listing) => {
      const data = listing.itemData as any;
      const name = data.name?.toLowerCase() || '';
      const description = data.description?.toLowerCase() || '';
      return (
        listing.status === 'active' &&
        (name.includes(lowerQuery) || description.includes(lowerQuery))
      );
    });
  }
}

// Singleton instance
export const marketplaceManager = new MarketplaceManager();
