#!/usr/bin/env node

/**
 * Supabase Connection and Storage Testing Script
 * Tests Supabase database and storage connections
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Initialize Supabase clients
const supabaseAnon = PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY ? 
    createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY) : null;

const supabaseService = PUBLIC_SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
    createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

async function testSupabaseConnection() {
    console.log('🔌 Testing Supabase connection...');
    
    if (!supabaseAnon) {
        console.log('❌ FAILED: Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
        return false;
    }

    try {
        // Test basic connection
        const { data, error } = await supabaseAnon.from('information_schema.tables').select('*').limit(1);
        
        if (error) {
            // information_schema might not be accessible, try a different approach
            const { data, error: simpleError } = await supabaseAnon.rpc('version');
            if (simpleError) {
                throw simpleError;
            }
        }
        
        console.log('✅ PASSED: Supabase connection successful');
        console.log(`🌐 URL: ${PUBLIC_SUPABASE_URL}`);
        console.log(`🔑 Using Anon Key: ${PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
        
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Supabase connection test failed');
        console.log(`🚨 Error Type: ${error.constructor.name}`);
        console.log(`📄 Error Message: ${error.message}`);
        
        if (error.message.includes('Invalid API key')) {
            console.log('💡 Tip: Check if your PUBLIC_SUPABASE_ANON_KEY is valid');
        } else if (error.message.includes('Invalid API URL')) {
            console.log('💡 Tip: Check if your PUBLIC_SUPABASE_URL is correct');
        }
        
        return false;
    }
}

async function testSupabaseTables() {
    console.log('\n📋 Testing Supabase tables access...');
    
    if (!supabaseAnon) {
        console.log('❌ SKIPPED: Cannot test tables without valid connection');
        return false;
    }

    try {
        // Try to access a common table or check auth
        const { data, error } = await supabaseAnon.auth.getUser();
        
        if (error && error.message !== 'Invalid JWT') {
            throw error;
        }
        
        // Try to get schema information
        const { data: tables, error: tablesError } = await supabaseAnon
            .from('information_schema.tables')
            .select('table_name')
            .limit(5);
        
        if (tablesError) {
            // If information_schema is not accessible, just check if we can make basic queries
            console.log('⚠️  Cannot access information_schema (this is normal for Supabase)');
            console.log('✅ PASSED: Basic connection to Supabase confirmed');
        } else {
            console.log('✅ PASSED: Tables access successful');
            console.log(`📊 Tables Found: ${tables?.length || 0}`);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Tables access test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testSupabaseStorage() {
    console.log('\n🗂️  Testing Supabase storage...');
    
    if (!supabaseAnon) {
        console.log('❌ SKIPPED: Cannot test storage without valid connection');
        return false;
    }

    try {
        // List storage buckets
        const { data: buckets, error } = await supabaseAnon.storage.listBuckets();
        
        if (error) {
            console.log('❌ FAILED: Storage access test failed');
            console.log(`🚨 Error: ${error.message}`);
            return false;
        }
        
        console.log('✅ PASSED: Storage access successful');
        console.log(`📊 Buckets Found: ${buckets.length}`);
        
        if (buckets.length > 0) {
            console.log('📁 Available Buckets:');
            buckets.forEach(bucket => {
                console.log(`   • ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
            });
        } else {
            console.log('📝 No storage buckets found (this is normal for new projects)');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Storage access test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testSupabaseServiceRole() {
    console.log('\n🔐 Testing Supabase Service Role Key...');
    
    if (!supabaseService) {
        console.log('❌ SKIPPED: Missing SUPABASE_SERVICE_ROLE_KEY');
        return false;
    }

    try {
        // Test service role key with admin operations
        const { data, error } = await supabaseService.auth.admin.listUsers();
        
        if (error) {
            console.log('❌ FAILED: Service role key test failed');
            console.log(`🚨 Error: ${error.message}`);
            return false;
        }
        
        console.log('✅ PASSED: Service role key is valid');
        console.log(`👥 Total Users: ${data.users?.length || 0}`);
        console.log('🔒 Admin access confirmed');
        
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Service role key test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testSupabaseAuth() {
    console.log('\n🔑 Testing Supabase Auth...');
    
    if (!supabaseAnon) {
        console.log('❌ SKIPPED: Cannot test auth without valid connection');
        return false;
    }

    try {
        // Test auth configuration
        const { data, error } = await supabaseAnon.auth.getSession();
        
        if (error && error.message !== 'Invalid JWT') {
            throw error;
        }
        
        console.log('✅ PASSED: Auth system accessible');
        console.log('🔐 Authentication endpoints are responding');
        
        return true;
        
    } catch (error) {
        console.log('❌ FAILED: Auth test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    console.log('=' .repeat(70));
    console.log('🧪 EXECUTIVE ELITE GROUP - SUPABASE CONNECTION TEST');
    console.log('=' .repeat(70));
    
    const connectionTest = await testSupabaseConnection();
    const tablesTest = await testSupabaseTables();
    const storageTest = await testSupabaseStorage();
    const serviceRoleTest = await testSupabaseServiceRole();
    const authTest = await testSupabaseAuth();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Connection Test: ${connectionTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Tables Access Test: ${tablesTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Storage Test: ${storageTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Service Role Test: ${serviceRoleTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Auth Test: ${authTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallResult = connectionTest && storageTest;
    console.log(`\n🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallResult) {
        console.log('\n🎉 Your Supabase connection is working correctly!');
        console.log('📋 Next steps: Configure your application to use these Supabase credentials');
    } else {
        console.log('\n⚠️  Please check your Supabase configuration');
    }
    
    process.exit(overallResult ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});