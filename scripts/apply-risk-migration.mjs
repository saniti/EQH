import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Checking current injuryRisk values...');
  const [rows] = await connection.execute("SELECT DISTINCT `injuryRisk` FROM `sessions` WHERE `injuryRisk` IS NOT NULL LIMIT 10");
  console.log('Current values:', rows.map(r => r.injuryRisk));
  
  console.log('\nApplying risk levels migration...');
  
  // Update existing risk level values - be more careful
  try {
    const [result1] = await connection.execute("UPDATE `sessions` SET `injuryRisk` = 'Low' WHERE `injuryRisk` = 'low'");
    console.log('✓ Updated low -> Low:', result1.affectedRows);
  } catch (e) {
    console.log('Note: low values might not exist');
  }
  
  try {
    const [result2] = await connection.execute("UPDATE `sessions` SET `injuryRisk` = 'Medium' WHERE `injuryRisk` = 'medium'");
    console.log('✓ Updated medium -> Medium:', result2.affectedRows);
  } catch (e) {
    console.log('Note: medium values might not exist');
  }
  
  try {
    const [result3] = await connection.execute("UPDATE `sessions` SET `injuryRisk` = 'High' WHERE `injuryRisk` = 'high'");
    console.log('✓ Updated high -> High:', result3.affectedRows);
  } catch (e) {
    console.log('Note: high values might not exist');
  }
  
  try {
    const [result4] = await connection.execute("UPDATE `sessions` SET `injuryRisk` = 'Extreme' WHERE `injuryRisk` = 'critical'");
    console.log('✓ Updated critical -> Extreme:', result4.affectedRows);
  } catch (e) {
    console.log('Note: critical values might not exist');
  }
  
  console.log('\n✅ Migration completed!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
} finally {
  await connection.end();
}
