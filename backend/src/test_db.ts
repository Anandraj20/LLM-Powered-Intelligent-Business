import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'root1234';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'businessmind_db';

async function testDatabaseConnection() {
  console.log('----------------------------------------------------');
  console.log('  BusinessMind AI — MySQL Database Diagnostic Test ');
  console.log('----------------------------------------------------');
  console.log(`Target Host     : ${MYSQL_HOST}:${MYSQL_PORT}`);
  console.log(`Target User     : ${MYSQL_USER}`);
  console.log(`Target Database : ${MYSQL_DATABASE}`);
  console.log('Connecting to MySQL database...');

  try {
    // Step 1: Connect to MySQL Server without specifying DB (in case DB needs creation)
    const serverConnection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD
    });

    console.log('✅ Connected to MySQL Server successfully!');

    // Step 2: Ensure database exists
    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
    console.log(`✅ Database '\`${MYSQL_DATABASE}\`' verified/created.`);
    await serverConnection.end();

    // Step 3: Connect to specific target database
    const dbConnection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE
    });

    console.log(`✅ Connected directly to target database '${MYSQL_DATABASE}'!`);

    // Step 4: Verify schema & tables
    const [tables]: any = await dbConnection.query('SHOW TABLES');
    const tableNames = tables.map((t: any) => Object.values(t)[0]);

    console.log('----------------------------------------------------');
    console.log(`Tables in '${MYSQL_DATABASE}' (${tableNames.length} tables found):`);
    if (tableNames.length > 0) {
      tableNames.forEach((t: string) => console.log(`  - ${t}`));
    } else {
      console.log('  (No tables found yet. Run database/schema.sql to create tables)');
    }

    // Step 5: Run a simple query test
    const [result]: any = await dbConnection.query('SELECT 1 + 1 AS test_calc, NOW() AS server_time');
    console.log('----------------------------------------------------');
    console.log('✅ SQL Query Execution Test Passed!');
    console.log(`  Test Calculation Output : ${result[0].test_calc}`);
    console.log(`  Database Current Time   : ${result[0].server_time}`);

    console.log('----------------------------------------------------');
    console.log('🎉 RESULT: MySQL Database connection test PASSED completely!');
    
    await dbConnection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('----------------------------------------------------');
    console.error('❌ DATABASE CONNECTION TEST FAILED!');
    console.error(`Error Code    : ${error.code || 'UNKNOWN'}`);
    console.error(`Error Message : ${error.message}`);
    console.error('----------------------------------------------------');
    console.error('Troubleshooting Tips:');
    console.error('1. Verify your MySQL server service is running locally on port 3306.');
    console.error('2. Double check MYSQL_PASSWORD in backend/.env matches your local MySQL password.');
    console.error('3. Make sure the user has permissions to connect from localhost.');
    process.exit(1);
  }
}

testDatabaseConnection();
