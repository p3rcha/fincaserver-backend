import { Router } from 'express';

const router = Router();

// Tebex Headless API base URL
const TEBEX_API_BASE = 'https://headless.tebex.io/api';

// Helper to get headers with private key
const getTebexHeaders = () => ({
  'Content-Type': 'application/json',
});

// Get the public token from env
const getPublicToken = () => {
  const token = process.env.TEBEX_PUBLIC_KEY;
  if (!token) {
    throw new Error('TEBEX_PUBLIC_KEY not configured');
  }
  return token;
};

// GET /api/tebex/packages - Fetch all packages
router.get('/packages', async (req, res) => {
  try {
    const publicToken = getPublicToken();
    const response = await fetch(
      `${TEBEX_API_BASE}/accounts/${publicToken}/packages`,
      { headers: getTebexHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Tebex API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// GET /api/tebex/categories - Fetch all categories
router.get('/categories', async (req, res) => {
  try {
    const publicToken = getPublicToken();
    const response = await fetch(
      `${TEBEX_API_BASE}/accounts/${publicToken}/categories`,
      { headers: getTebexHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Tebex API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/tebex/basket - Create a new basket
router.post('/basket', async (req, res) => {
  try {
    const publicToken = getPublicToken();
    const { complete_url, cancel_url } = req.body;

    const response = await fetch(
      `${TEBEX_API_BASE}/accounts/${publicToken}/baskets`,
      {
        method: 'POST',
        headers: getTebexHeaders(),
        body: JSON.stringify({
          complete_url: complete_url || `${req.headers.origin}/store?success=true`,
          cancel_url: cancel_url || `${req.headers.origin}/store?cancelled=true`,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Tebex basket error:', errorData);
      throw new Error(`Tebex API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating basket:', error);
    res.status(500).json({ error: 'Failed to create basket' });
  }
});

// POST /api/tebex/basket/:ident/packages - Add package to basket
router.post('/basket/:ident/packages', async (req, res) => {
  try {
    const { ident } = req.params;
    const { package_id, quantity = 1 } = req.body;

    if (!package_id) {
      return res.status(400).json({ error: 'package_id is required' });
    }

    const response = await fetch(
      `${TEBEX_API_BASE}/baskets/${ident}/packages`,
      {
        method: 'POST',
        headers: getTebexHeaders(),
        body: JSON.stringify({
          package_id,
          quantity,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Tebex add package error:', errorData);
      throw new Error(`Tebex API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error adding package to basket:', error);
    res.status(500).json({ error: 'Failed to add package to basket' });
  }
});

// GET /api/tebex/basket/:ident - Get basket details
router.get('/basket/:ident', async (req, res) => {
  try {
    const { ident } = req.params;

    const response = await fetch(
      `${TEBEX_API_BASE}/baskets/${ident}`,
      { headers: getTebexHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Tebex API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching basket:', error);
    res.status(500).json({ error: 'Failed to fetch basket' });
  }
});

export default router;

