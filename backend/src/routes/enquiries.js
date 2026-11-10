import express from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

const router = express.Router();

let localEnquiriesStore = [
  {
    id: 'enq-1',
    buyer_name: 'Ananya Sharma (FabHeritage Boutiques)',
    buyer_type: 'Wholesale Retailer',
    email: 'ananya@fabheritage.in',
    phone: '+91 98450 12345',
    product_title: 'Bankura Terracotta Sacred Horse',
    quantity: '25 units',
    message: 'We are planning our festive Diwali curation for our stores in Bengaluru and Delhi. Can you ship 25 units of the 18-inch model by October 10th? What is your bulk discount pricing?',
    date: 'Today, 2:15 PM',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: 'enq-2',
    buyer_name: 'David Miller (Artisan World Exports)',
    buyer_type: 'Export Buyer (UK)',
    email: 'david@artisanworld.co.uk',
    phone: '+44 7911 123456',
    product_title: 'Channapatna Wooden Nesting Dolls',
    quantity: '100 sets',
    message: 'We require European toy safety EN71 certification test reports for the organic vegetable dyes. Can we order 5 sample sets to evaluate quality and packaging?',
    date: 'Yesterday',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'enq-3',
    buyer_name: 'Rohan Mehra (Studio Vistara Interiors)',
    buyer_type: 'Interior Architect',
    email: 'rohan@studiovistara.com',
    phone: '+91 97110 54321',
    product_title: 'Moradabad Engraved Brass Urli Bowl',
    quantity: '6 units',
    message: 'Need 6 pieces of the 24-inch antique patina finish for a heritage resort lobby in Udaipur. Payment terms can be 100% advance.',
    date: '3 days ago',
    status: 'responded',
    created_at: new Date(Date.now() - 259200000).toISOString()
  }
];

// GET /api/enquiries - List enquiries
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
    return res.json(localEnquiriesStore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enquiries - Create enquiry
router.post('/', async (req, res) => {
  try {
    const { product_id, product_title, buyer_name, buyer_email, phone, message, quantity } = req.body;

    if (!buyer_name || !buyer_email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const newEnquiry = {
      id: req.body.id || `enq-${Date.now()}`,
      product_id: product_id || null,
      product_title: product_title || 'Handcrafted Craft Item',
      buyer_name,
      buyer_email,
      phone: phone || '',
      quantity: quantity || 'Single piece / Inquiry',
      message,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      await supabase.from('enquiries').insert([newEnquiry]);
    }

    localEnquiriesStore.unshift(newEnquiry);

    return res.status(201).json({
      success: true,
      data: newEnquiry,
      message: 'Enquiry received and routed to artisan.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/enquiries/:id - Update enquiry status
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, reply } = req.body;

  try {
    if (isSupabaseConfigured()) {
      await supabase
        .from('enquiries')
        .update({ status, reply, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    const found = localEnquiriesStore.find(e => e.id === id);
    if (found) {
      if (status) found.status = status;
      if (reply) found.reply = reply;
    }

    return res.json({ success: true, data: found });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
