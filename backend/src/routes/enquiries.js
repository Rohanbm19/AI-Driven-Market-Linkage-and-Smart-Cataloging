import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { product_id, buyer_name, buyer_email, message } = req.body;

    if (!buyer_name || !buyer_email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const newEnquiry = {
      product_id: product_id || null,
      buyer_name,
      buyer_email,
      message,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      await supabase.from('enquiries').insert([newEnquiry]);
    }

    return res.status(201).json({
      success: true,
      message: 'Enquiry received and routed to artisan.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
