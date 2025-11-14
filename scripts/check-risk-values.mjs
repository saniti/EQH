import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute("SELECT DISTINCT `injuryRisk` FROM `sessions` WHERE `injuryRisk` IS NOT NULL");
  console.log('Current injuryRisk values in database:');
  rows.forEach(row => console.log(`  - "${row.injuryRisk}"`));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
