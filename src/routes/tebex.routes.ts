import { Router } from 'express';
import tebexClient, { getAccountUrl, getBasketUrl } from '../lib/tebexClient';

const router = Router();

/**
 * Tebex Headless API Routes
 * Based on: https://docs.tebex.io/developers/headless-api/endpoints
 * 
 * These routes proxy requests to the Tebex Headless API,
 * keeping the public token secure on the server side.
 * 
 * Now using axios for:
 * - Automatic JSON parsing
 * - Better error handling
 * - Request/response interceptors
 * - Centralized configuration
 */

// ============================================
// WEBSTORE INFO
// ============================================

/**
 * GET /api/tebex/webstore
 * Fetch webstore information
 */
router.get('/webstore', async (req, res) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl(''));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch webstore info' });
  }
});

/**
 * GET /api/tebex/pages
 * Fetch custom pages associated with the store
 */
router.get('/pages', async (req, res) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/pages'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// ============================================
// CATEGORIES & PACKAGES
// ============================================

/**
 * GET /api/tebex/categories
 * Get all categories (optionally with packages)
 * Query params: ?includePackages=true
 */
router.get('/categories', async (req, res) => {
  try {
    const includePackages = req.query.includePackages === 'true';
    const params = includePackages ? { includePackages: 1 } : {};
    
    const { data } = await tebexClient.get(getAccountUrl('/categories'), { params });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/tebex/categories/:categoryId
 * Get a specific category
 * Query params: ?includePackages=true
 */
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const includePackages = req.query.includePackages === 'true';
    const params = includePackages ? { includePackages: 1 } : {};
    
    const { data } = await tebexClient.get(getAccountUrl(`/categories/${categoryId}`), { params });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

/**
 * GET /api/tebex/packages
 * Fetch all packages from the webstore
 */
router.get('/packages', async (req, res) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/packages'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

/**
 * GET /api/tebex/packages/:packageId
 * Fetch a specific package by ID
 */
router.get('/packages/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { data } = await tebexClient.get(getAccountUrl(`/packages/${packageId}`));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// ============================================
// BASKETS
// ============================================

/**
 * POST /api/tebex/baskets
 * Create a new basket
 */
router.post('/baskets', async (req, res) => {
  try {
    const { complete_url, cancel_url } = req.body;
    
    const { data } = await tebexClient.post(getAccountUrl('/baskets'), {
      complete_url: complete_url || `${req.headers.origin}/store?success=true`,
      cancel_url: cancel_url || `${req.headers.origin}/store?cancelled=true`,
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create basket' });
  }
});

/**
 * GET /api/tebex/baskets/:basketIdent
 * Fetch basket details by identifier
 */
router.get('/baskets/:basketIdent', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { data } = await tebexClient.get(getAccountUrl(`/baskets/${basketIdent}`));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch basket' });
  }
});

/**
 * GET /api/tebex/baskets/:basketIdent/auth
 * Get authentication links for a basket
 */
router.get('/baskets/:basketIdent/auth', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { returnUrl } = req.query;
    const params = returnUrl ? { returnUrl } : {};
    
    const { data } = await tebexClient.get(
      getAccountUrl(`/baskets/${basketIdent}/auth`),
      { params }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch basket auth links' });
  }
});

// ============================================
// BASKET PACKAGE OPERATIONS
// ============================================

/**
 * POST /api/tebex/baskets/:basketIdent/packages
 * Add a package to the basket
 */
router.post('/baskets/:basketIdent/packages', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { package_id, quantity = 1 } = req.body;

    if (!package_id) {
      return res.status(400).json({ error: 'package_id is required' });
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/packages'),
      { package_id, quantity }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add package to basket' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/packages/remove
 * Remove a package from the basket
 */
router.post('/baskets/:basketIdent/packages/remove', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { package_id } = req.body;

    if (!package_id) {
      return res.status(400).json({ error: 'package_id is required' });
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/packages/remove'),
      { package_id }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove package from basket' });
  }
});

/**
 * PUT /api/tebex/baskets/:basketIdent/packages/:packageId
 * Update package quantity in basket
 */
router.put('/baskets/:basketIdent/packages/:packageId', async (req, res) => {
  try {
    const { basketIdent, packageId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'quantity is required' });
    }

    await tebexClient.put(
      getBasketUrl(basketIdent, `/packages/${packageId}`),
      { quantity }
    );
    
    // This endpoint returns 200 with no content on success
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update package quantity' });
  }
});

// ============================================
// PROMOTIONS & DISCOUNTS
// ============================================

/**
 * POST /api/tebex/baskets/:basketIdent/coupons
 * Apply a coupon to the basket
 */
router.post('/baskets/:basketIdent/coupons', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { coupon_code } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ error: 'coupon_code is required' });
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/coupons'),
      { coupon_code }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/coupons/remove
 * Remove a coupon from the basket
 */
router.post('/baskets/:basketIdent/coupons/remove', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/coupons/remove'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove coupon' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/giftcards
 * Apply a gift card to the basket
 */
router.post('/baskets/:basketIdent/giftcards', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { card_number } = req.body;

    if (!card_number) {
      return res.status(400).json({ error: 'card_number is required' });
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/giftcards'),
      { card_number }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply gift card' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/giftcards/remove
 * Remove a gift card from the basket
 */
router.post('/baskets/:basketIdent/giftcards/remove', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/giftcards/remove'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove gift card' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/creator-codes
 * Apply a creator code to the basket
 */
router.post('/baskets/:basketIdent/creator-codes', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { creator_code } = req.body;

    if (!creator_code) {
      return res.status(400).json({ error: 'creator_code is required' });
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/creator-codes'),
      { creator_code }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply creator code' });
  }
});

/**
 * POST /api/tebex/baskets/:basketIdent/creator-codes/remove
 * Remove a creator code from the basket
 */
router.post('/baskets/:basketIdent/creator-codes/remove', async (req, res) => {
  try {
    const { basketIdent } = req.params;
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/creator-codes/remove'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove creator code' });
  }
});

// ============================================
// SIDEBAR
// ============================================

/**
 * GET /api/tebex/sidebar
 * Get sidebar modules (top customers, recent purchases, etc.)
 */
router.get('/sidebar', async (req, res) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/sidebar'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sidebar' });
  }
});

export default router;
