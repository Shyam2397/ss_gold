const { pool } = require('../config/database');

const toCamelCase = (row) => ({
  id: row.id,
  name: row.name,
  tagline: row.tagline,
  address: row.address,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
  phone: row.phone,
  alternatePhone: row.alternate_phone,
  email: row.email,
  website: row.website,
  gstin: row.gstin,
  footerMessage: row.footer_message
});

const getCompanyDetails = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_details WHERE id = 1');
    if (result.rows.length === 0) {
      // No details entered yet - return an empty form
      return res.json({
        name: '',
        tagline: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        alternatePhone: '',
        email: '',
        website: '',
        gstin: '',
        footerMessage: ''
      });
    }
    res.json(toCamelCase(result.rows[0]));
  } catch (err) {
    console.error('Error fetching company details:', err);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
};

const saveCompanyDetails = async (req, res) => {
  const {
    name,
    tagline,
    address,
    city,
    state,
    pincode,
    phone,
    alternatePhone,
    email,
    website,
    gstin,
    footerMessage
  } = req.body;

  const sql = `
    INSERT INTO company_details (
      id, name, tagline, address, city, state, pincode, phone,
      alternate_phone, email, website, gstin, footer_message
    ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      tagline = EXCLUDED.tagline,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      pincode = EXCLUDED.pincode,
      phone = EXCLUDED.phone,
      alternate_phone = EXCLUDED.alternate_phone,
      email = EXCLUDED.email,
      website = EXCLUDED.website,
      gstin = EXCLUDED.gstin,
      footer_message = EXCLUDED.footer_message,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      name,
      tagline,
      address,
      city,
      state,
      pincode,
      phone,
      alternatePhone,
      email,
      website,
      gstin,
      footerMessage
    ]);
    res.json(toCamelCase(result.rows[0]));
  } catch (err) {
    console.error('Error saving company details:', err);
    res.status(500).json({ error: 'Failed to save company details' });
  }
};

module.exports = {
  getCompanyDetails,
  saveCompanyDetails
};