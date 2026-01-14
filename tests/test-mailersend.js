#!/usr/bin/env node

/**
 * MailerSend API Key Testing Script
 * Tests the functionality of the MailerSend API key
 */

require('dotenv').config();

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;

console.log('🔍 Testing MailerSend API Key...\n');

if (!MAILERSEND_API_KEY) {
    console.log('❌ FAILED: MAILERSEND_API_KEY environment variable is not set');
    process.exit(1);
}

// MailerSend API configuration
const MAILERSEND_API_URL = 'https://api.mailersend.com/v1';

async function testMailerSendAPI() {
    try {
        console.log('📡 Testing MailerSend API connection...');
        
        // Test by retrieving account information
        const response = await fetch(`${MAILERSEND_API_URL}/account`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
        }

        const accountData = await response.json();
        
        console.log('✅ PASSED: MailerSend API connection successful');
        console.log(`🏢 Account: ${accountData.name || 'N/A'}`);
        console.log(`📧 Email: ${accountData.email || 'N/A'}`);
        console.log(`🌍 Timezone: ${accountData.timezone || 'N/A'}`);
        
        return true;

    } catch (error) {
        console.log('❌ FAILED: MailerSend API test failed');
        console.log(`🚨 Error Type: ${error.constructor.name}`);
        console.log(`📄 Error Message: ${error.message}`);
        
        if (error.message.includes('401')) {
            console.log('💡 Tip: Check if your API key is valid and has proper permissions');
        } else if (error.message.includes('403')) {
            console.log('💡 Tip: Your API key might not have access to this resource');
        } else if (error.message.includes('429')) {
            console.log('💡 Tip: Rate limit exceeded. Try again later');
        }
        
        return false;
    }
}

async function testMailerSendDomain() {
    console.log('\n🌐 Testing MailerSend Domain Access...');
    
    try {
        const response = await fetch(`${MAILERSEND_API_URL}/domains`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const domains = await response.json();
        
        console.log('✅ PASSED: Domain access successful');
        console.log(`📊 Domains Found: ${domains.length}`);
        
        if (domains.length > 0) {
            const firstDomain = domains[0];
            console.log(`🏷️  First Domain: ${firstDomain.name}`);
            console.log(`✅ Domain Verified: ${firstDomain.verified ? 'Yes' : 'No'}`);
            console.log(`📧 From Name: ${firstDomain.from_name || 'N/A'}`);
        } else {
            console.log('⚠️  No domains configured yet');
        }
        
        return true;

    } catch (error) {
        console.log('❌ FAILED: Domain access test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

async function testMailerSendTemplates() {
    console.log('\n📄 Testing MailerSend Templates Access...');
    
    try {
        const response = await fetch(`${MAILERSEND_API_URL}/templates`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const templates = await response.json();
        
        console.log('✅ PASSED: Templates access successful');
        console.log(`📊 Templates Found: ${templates.length}`);
        
        if (templates.length > 0) {
            console.log(`📝 Template Names: ${templates.slice(0, 3).map(t => t.name).join(', ')}`);
            if (templates.length > 3) {
                console.log(`   ... and ${templates.length - 3} more`);
            }
        } else {
            console.log('📝 No templates found (this is normal for new accounts)');
        }
        
        return true;

    } catch (error) {
        console.log('❌ FAILED: Templates access test failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    console.log('=' .repeat(70));
    console.log('🧪 EXECUTIVE ELITE GROUP - MAILERSEND API TEST');
    console.log('=' .repeat(70));
    
    const apiTest = await testMailerSendAPI();
    const domainTest = await testMailerSendDomain();
    const templatesTest = await testMailerSendTemplates();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    console.log(`API Connection Test: ${apiTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Domain Access Test: ${domainTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Templates Access Test: ${templatesTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallResult = apiTest && domainTest;
    console.log(`\n🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallResult) {
        console.log('\n🎉 Your MailerSend API key is working correctly!');
        console.log('📋 Next steps: Configure your application to use this key for email sending');
    } else {
        console.log('\n⚠️  Please check your MailerSend API key configuration');
    }
    
    process.exit(overallResult ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});