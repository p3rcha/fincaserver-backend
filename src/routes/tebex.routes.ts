import { Router } from 'express';
import type { Request, Response } from 'express';
import tebexClient, { getAccountUrl, getBasketUrl } from '../lib/tebexClient.js';
import { handleTebexError } from '../lib/errorHandler.js';
import type { 
  TebexWebstoreResponse,
  TebexCategoriesResponse,
  TebexCategoryResponse,
  TebexPackagesResponse,
  TebexPackageResponse,
  TebexBasketResponse,
  CreateBasketBody,
  AddPackageToBasketBody,
  GiftPackageBody,
  UpdateQuantityBody,
  ApplyCouponBody,
  ApplyGiftCardBody,
  ApplyCreatorCodeBody,
} from '../types/tebex.js';
import type { ApiErrorResponse } from '../types/express.js';

const router = Router();

/**
 * Validates required route params and returns validated value or sends error response
 */
function validateParam(
  res: Response, 
  value: string | undefined, 
  paramName: string
): value is string {
  if (!value) {
    res.status(400).json({ error: `${paramName} is required` });
    return false;
  }
  return true;
}

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
 * @openapi
 * /api/tebex/webstore:
 *   get:
 *     tags: [Tebex - Webstore]
 *     summary: Get webstore information
 *     description: Fetch general information about the webstore including name, currency, and platform details.
 *     responses:
 *       200:
 *         description: Webstore information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexWebstore'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/webstore', async (req: Request, res: Response<TebexWebstoreResponse | ApiErrorResponse>) => {
  try {
    const { data } = await tebexClient.get<TebexWebstoreResponse>(getAccountUrl(''));
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'fetch webstore info');
  }
});

/**
 * @openapi
 * /api/tebex/pages:
 *   get:
 *     tags: [Tebex - Webstore]
 *     summary: Get custom pages
 *     description: Fetch custom pages associated with the store (e.g., Terms of Service, FAQ).
 *     responses:
 *       200:
 *         description: List of custom pages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/pages'));
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'fetch pages');
  }
});

// ============================================
// CATEGORIES & PACKAGES
// ============================================

/**
 * @openapi
 * /api/tebex/categories:
 *   get:
 *     tags: [Tebex - Categories]
 *     summary: Get all categories
 *     description: Retrieve all product categories. Optionally include packages within each category.
 *     parameters:
 *       - in: query
 *         name: includePackages
 *         schema:
 *           type: boolean
 *         description: Include packages in the response
 *         example: true
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TebexCategory'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const includePackages = req.query.includePackages === 'true';
    const params = includePackages ? { includePackages: 1 } : {};
    
    const { data } = await tebexClient.get(getAccountUrl('/categories'), { params });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @openapi
 * /api/tebex/categories/{categoryId}:
 *   get:
 *     tags: [Tebex - Categories]
 *     summary: Get a specific category
 *     description: Retrieve a single category by its ID. Optionally include packages.
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID
 *         example: 123456
 *       - in: query
 *         name: includePackages
 *         schema:
 *           type: boolean
 *         description: Include packages in the response
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexCategory'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/categories/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const includePackages = req.query.includePackages === 'true';
    const params = includePackages ? { includePackages: 1 } : {};
    
    const { data } = await tebexClient.get(getAccountUrl(`/categories/${categoryId}`), { params });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

/**
 * @openapi
 * /api/tebex/packages:
 *   get:
 *     tags: [Tebex - Packages]
 *     summary: Get all packages
 *     description: Fetch all available packages/products from the webstore.
 *     responses:
 *       200:
 *         description: List of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TebexPackage'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/packages'));
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

/**
 * @openapi
 * /api/tebex/packages/{packageId}:
 *   get:
 *     tags: [Tebex - Packages]
 *     summary: Get a specific package
 *     description: Fetch detailed information about a specific package by ID.
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The package ID
 *         example: 1234567
 *     responses:
 *       200:
 *         description: Package details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexPackage'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/packages/:packageId', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.params;
    const { data } = await tebexClient.get(getAccountUrl(`/packages/${packageId}`));
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// ============================================
// BASKETS
// ============================================

/**
 * @openapi
 * /api/tebex/baskets:
 *   post:
 *     tags: [Tebex - Baskets]
 *     summary: Create a new basket
 *     description: Create a new shopping basket. Returns the basket identifier needed for subsequent operations.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               complete_url:
 *                 type: string
 *                 description: URL to redirect after successful purchase
 *                 example: https://fincaserver.net/store?success=true
 *               cancel_url:
 *                 type: string
 *                 description: URL to redirect if purchase is cancelled
 *                 example: https://fincaserver.net/store?cancelled=true
 *     responses:
 *       200:
 *         description: Basket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets', async (req: Request, res: Response) => {
  try {
    const { complete_url, cancel_url } = req.body;
    
    const { data } = await tebexClient.post(getAccountUrl('/baskets'), {
      complete_url: complete_url || `${req.headers.origin}/store?success=true`,
      cancel_url: cancel_url || `${req.headers.origin}/store?cancelled=true`,
    });
    
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to create basket' });
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}:
 *   get:
 *     tags: [Tebex - Baskets]
 *     summary: Get basket details
 *     description: Fetch the current state of a basket including items, prices, and checkout link.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *         example: abc123-xyz789
 *     responses:
 *       200:
 *         description: Basket details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/baskets/:basketIdent', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    const { data } = await tebexClient.get(getAccountUrl(`/baskets/${basketIdent}`));
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch basket' });
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/auth:
 *   get:
 *     tags: [Tebex - Baskets]
 *     summary: Get basket authentication links
 *     description: Get authentication links for a basket to allow user login/signup.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *       - in: query
 *         name: returnUrl
 *         schema:
 *           type: string
 *         description: URL to return to after authentication
 *     responses:
 *       200:
 *         description: Authentication links
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/baskets/:basketIdent/auth', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    const { returnUrl } = req.query;
    const params = returnUrl ? { returnUrl } : {};
    
    const { data } = await tebexClient.get(
      getAccountUrl(`/baskets/${basketIdent}/auth`),
      { params }
    );
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch basket auth links' });
  }
});

// ============================================
// BASKET PACKAGE OPERATIONS
// ============================================

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/packages:
 *   post:
 *     tags: [Tebex - Basket Packages]
 *     summary: Add package to basket
 *     description: Add a package/product to the shopping basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *             properties:
 *               package_id:
 *                 type: integer
 *                 description: The package ID to add
 *                 example: 1234567
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 description: Quantity to add
 *                 example: 1
 *     responses:
 *       200:
 *         description: Package added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/packages', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { package_id, quantity = 1 } = req.body as { package_id?: number; quantity?: number };

    if (!package_id) {
      res.status(400).json({ error: 'package_id is required' });
      return;
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/packages'),
      { package_id, quantity }
    );
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'add package to basket');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/packages/remove:
 *   post:
 *     tags: [Tebex - Basket Packages]
 *     summary: Remove package from basket
 *     description: Remove a package/product from the shopping basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package_id
 *             properties:
 *               package_id:
 *                 type: integer
 *                 description: The package ID to remove
 *                 example: 1234567
 *     responses:
 *       200:
 *         description: Package removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/packages/remove', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { package_id } = req.body as { package_id?: number };

    if (!package_id) {
      res.status(400).json({ error: 'package_id is required' });
      return;
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/packages/remove'),
      { package_id }
    );
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'remove package from basket');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/packages/{packageId}:
 *   put:
 *     tags: [Tebex - Basket Packages]
 *     summary: Update package quantity
 *     description: Update the quantity of a package in the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: New quantity
 *                 example: 2
 *     responses:
 *       200:
 *         description: Quantity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/baskets/:basketIdent/packages/:packageId', async (req: Request, res: Response) => {
  try {
    const { basketIdent, packageId } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    if (!validateParam(res, packageId, 'packageId')) return;
    
    const { quantity } = req.body as { quantity?: number };

    if (quantity === undefined) {
      res.status(400).json({ error: 'quantity is required' });
      return;
    }

    await tebexClient.put(
      getBasketUrl(basketIdent, `/packages/${packageId}`),
      { quantity }
    );
    
    // This endpoint returns 200 with no content on success
    res.json({ success: true });
  } catch (error: unknown) {
    handleTebexError(res, error, 'update package quantity');
  }
});

// ============================================
// PROMOTIONS & DISCOUNTS
// ============================================

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/coupons:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Apply coupon
 *     description: Apply a coupon code to the basket for a discount.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coupon_code
 *             properties:
 *               coupon_code:
 *                 type: string
 *                 description: The coupon code to apply
 *                 example: SUMMER20
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/coupons', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { coupon_code } = req.body as { coupon_code?: string };

    if (!coupon_code) {
      res.status(400).json({ error: 'coupon_code is required' });
      return;
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/coupons'),
      { coupon_code }
    );
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'apply coupon');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/coupons/remove:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Remove coupon
 *     description: Remove the applied coupon from the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/coupons/remove', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/coupons/remove'));
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'remove coupon');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/giftcards:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Apply gift card
 *     description: Apply a gift card to the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_number
 *             properties:
 *               card_number:
 *                 type: string
 *                 description: The gift card number
 *                 example: GIFT-XXXX-XXXX-XXXX
 *     responses:
 *       200:
 *         description: Gift card applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/giftcards', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { card_number } = req.body as { card_number?: string };

    if (!card_number) {
      res.status(400).json({ error: 'card_number is required' });
      return;
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/giftcards'),
      { card_number }
    );
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'apply gift card');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/giftcards/remove:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Remove gift card
 *     description: Remove the applied gift card from the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     responses:
 *       200:
 *         description: Gift card removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/giftcards/remove', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/giftcards/remove'));
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'remove gift card');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/creator-codes:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Apply creator code
 *     description: Apply a creator/affiliate code to the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creator_code
 *             properties:
 *               creator_code:
 *                 type: string
 *                 description: The creator code
 *                 example: STREAMER123
 *     responses:
 *       200:
 *         description: Creator code applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       400:
 *         description: Missing required field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/creator-codes', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { creator_code } = req.body as { creator_code?: string };

    if (!creator_code) {
      res.status(400).json({ error: 'creator_code is required' });
      return;
    }

    const { data } = await tebexClient.post(
      getBasketUrl(basketIdent, '/creator-codes'),
      { creator_code }
    );
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'apply creator code');
  }
});

/**
 * @openapi
 * /api/tebex/baskets/{basketIdent}/creator-codes/remove:
 *   post:
 *     tags: [Tebex - Promotions]
 *     summary: Remove creator code
 *     description: Remove the applied creator code from the basket.
 *     parameters:
 *       - in: path
 *         name: basketIdent
 *         required: true
 *         schema:
 *           type: string
 *         description: The basket identifier
 *     responses:
 *       200:
 *         description: Creator code removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TebexBasket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/baskets/:basketIdent/creator-codes/remove', async (req: Request, res: Response) => {
  try {
    const { basketIdent } = req.params;
    if (!validateParam(res, basketIdent, 'basketIdent')) return;
    
    const { data } = await tebexClient.post(getBasketUrl(basketIdent, '/creator-codes/remove'));
    res.json(data);
  } catch (error: unknown) {
    handleTebexError(res, error, 'remove creator code');
  }
});

// ============================================
// SIDEBAR
// ============================================

/**
 * @openapi
 * /api/tebex/sidebar:
 *   get:
 *     tags: [Tebex - Sidebar]
 *     summary: Get sidebar modules
 *     description: Fetch sidebar modules including top customers and recent purchases.
 *     responses:
 *       200:
 *         description: Sidebar data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     top_customers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recent_purchases:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sidebar', async (req: Request, res: Response) => {
  try {
    const { data } = await tebexClient.get(getAccountUrl('/sidebar'));
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch sidebar' });
  }
});

export default router;
