#!/usr/bin/env node

/**
 * Database Connection Testing Script
 * Tests PostgreSQL/Supabase database connection
 */

require('dotenv').config();

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Testing Database Connection...\n');

if (!DATABASE_URL) {
    console.log('❌ FAILED: DATABASE_URL environment variable is not set');
    process.exit(1);
}

// Initialize connection pool
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1, // Use only one connection for testing
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

async function testDatabaseConnection() {
    console.log('🔌 Testing database connection...');
    
    try {
        // Test basic connection
        const client = await pool.connect();
        console.log('✅ PASSED: Database connection successful');
        
        // Get database version
        const versionResult = await client.query('SELECT version()');
        console.log(`📊 Database: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
        
        // Get current database name
        const dbResult = await client.query('SELECT current_database() as database_name');
        console.log(`🏢 Database Name: ${dbResult.rows[0].database_name}`);
        
        // Get current user
        const userResult = await client.query('SELECT current_user as user_name');
        console.log(`👤 Connected User: ${userResult.rows[0].user_name}`);
        
        client.release();
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Database connection test failed');
        console.log(`🚨 Error Type: ${error.constructor.name}`);
        console.log(`📄 Error Message: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Tip: Check if the database server is running and accessible');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Tip: Check if the database URL/hostname is correct');
        } else if (error.code === '28P01') {
            console.log('💡 Tip: Authentication failed. Check username/password');
        } else if (error.code === '3D000') {
            console.log('💡 Tip: Database does not exist. Check database name');
        }
        
        return false;
    }
}

async function testDatabaseTables() {
    console.log('\n📋 Testing database tables access...');
    
    try {
        const client = await pool.connect();
        
        // Check if we can query information schema
        const tablesResult = await client.query(`
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY table_name 
            LIMIT 10
        `);
        
        console.log('✅ PASSED: Tables access successful');
        console.log(`📊 Tables Found: ${tablesResult.rows.length}`);
        
        if (tablesResult.rows.length > 0) {
            console.log('📝 Sample Tables:');
            tablesResult.rows.slice(0, 5).forEach(row => {
                console.log(`   • ${row.table_schema}.${row.table_name}`);
            });
            if (tablesResult.rows.length > 5) {
                console.log(`   ... and ${tablesResult.rows.length - 5} more`);
            }
        } else {
            console.log('📝 No custom tables found (database might be empty)');
        }
        
        client.release();
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Tables access test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testDatabasePerformance() {
    console.log('\n⚡ Testing database performance...');
    
    try {
        const client = await pool.connect();
        
        // Simple performance test
        const startTime = Date.now();
        await client.query('SELECT 1');
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('✅ PASSED: Performance test successful');
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        
        if (responseTime < 100) {
            console.log('🚀 Performance: Excellent');
        } else if (responseTime < 500) {
            console.log('✅ Performance: Good');
        } else if (responseTime < 1000) {
            console.log('⚠️  Performance: Fair');
        } else {
            console.log('🐌 Performance: Slow - consider optimization');
        }
        
        client.release();
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Performance test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testDatabaseWrite() {
    console.log('\n✏️  Testing database write permissions...');
    
    try {
        const client = await pool.connect();
        
        // Create a temporary test table
        await client.query(`
            CREATE TEMP TABLE test_connection (
                id SERIAL PRIMARY KEY,
                test_data VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert test data
        const insertResult = await client.query(
            'INSERT INTO test_connection (test_data) VALUES ($1) RETURNING id',
            ['API Test Connection']
        );
        
        // Read the data back
        const selectResult = await client.query(
            'SELECT * FROM test_connection WHERE id = $1',
            [insertResult.rows[0].id]
        );
        
        console.log('✅ PASSED: Write permissions test successful');
        console.log(`📝 Test Record ID: ${insertResult.rows[0].id}`);
        console.log(`📄 Test Data: ${selectResult.rows[0].test_data}`);
        
        // Clean up is automatic with temp table
        client.release();
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Write permissions test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    console.log('=' .repeat(70));
    console.log('🧪 EXECUTIVE ELITE GROUP - DATABASE CONNECTION TEST');
    console.log('=' .repeat(70));
    
    const connectionTest = await testDatabaseConnection();
    const tablesTest = await testDatabaseTables();
    const performanceTest = await testDatabasePerformance();
    const writeTest = await testDatabaseWrite();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Connection Test: ${connectionTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Tables Access Test: ${tablesTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Performance Test: ${performanceTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Write Permissions Test: ${writeTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallResult = connectionTest && tablesTest && writeTest;
    console.log(`\n🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallResult) {
        console.log('\n🎉 Your database connection is working correctly!');
        console.log('📋 Next steps: Configure your application to use this database URL');
    } else {
        console.log('\n⚠️  Please check your database configuration');
    }
    
    // Clean up pool
    await pool.end();
    
    process.exit(overallResult ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});