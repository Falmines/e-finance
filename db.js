const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres.bbnudxlwonlnygtkvdqe:085891099220FN@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;