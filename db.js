const { Pool } = require("pg");
const DATABASE_URL = require("./supabase-url");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;