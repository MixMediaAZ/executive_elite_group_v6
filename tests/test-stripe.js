#!/usr/bin/env node

/**
 * Stripe API Keys Testing Script
 * Tests both secret and publishable Stripe API keys
 */

require('dotenv').config();
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

console.log('🔍 Testing Stripe API Keys...\n');

// Initialize Stripe with secret key
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

async function testStripeSecretKey() {
    console.log('🔑 Testing Stripe Secret Key...');
    
    if (!STRIPE_SECRET_KEY) {
        console.log('❌ FAILED: STRIPE_SECRET_KEY environment variable is not set');
        return false;
    }

    if (!stripe) {
        console.log('❌ FAILED: Failed to initialize Stripe with secret key');
        return false;
    }

    try {
        // Test by retrieving account information
        const account = await stripe.accounts.retrieve();
        
        console.log('✅ PASSED: Stripe Secret Key is valid');
        console.log(`🏢 Account ID: ${account.id}`);
        console.log(`📊 Account Type: ${account.type}`);
        console.log(`💳 Country: ${account.country}`);
        console.log(`📈 Charges Enabled: ${account.charges_enabled ? 'Yes' : 'No'}`);
        console.log(`🔒 Payouts Enabled: ${account.payouts_enabled ? 'Yes' : 'No'}`);
        
        return true;

    } catch (error) {
        console.log('❌ FAILED: Stripe Secret Key test failed');
        console.log(`🚨 Error Type: ${error.constructor.name}`);
        console.log(`📄 Error Message: ${error.message}`);
        
        if (error.type === 'StripeAuthenticationError') {
            console.log('💡 Tip: Check if your secret key is valid and has proper permissions');
        } else if (error.type === 'StripeInvalidRequestError') {
            console.log('💡 Tip: The key might be invalid or malformed');
        }
        
        return false;
    }
}

async function testStripePublishableKey() {
    console.log('\n🔑 Testing Stripe Publishable Key...');
    
    if (!STRIPE_PUBLISHABLE_KEY) {
        console.log('❌ FAILED: STRIPE_PUBLISHABLE_KEY environment variable is not set');
        return false;
    }

    // Validate publishable key format
    if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
        console.log('❌ FAILED: Publishable key should start with "pk_"');
        return false;
    }

    // Basic format validation
    if (STRIPE_PUBLISHABLE_KEY.length < 20) {
        console.log('❌ FAILED: Publishable key appears to be too short');
        return false;
    }

    console.log('✅ PASSED: Stripe Publishable Key format is valid');
    console.log(`🔑 Key Prefix: ${STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`);
    console.log(`🌍 Environment: ${STRIPE_PUBLISHABLE_KEY.includes('test') ? 'Test' : 'Live'}`);
    
    return true;
}

async function testStripePaymentIntent() {
    console.log('\n💳 Testing Payment Intent Creation...');
    
    if (!stripe) {
        console.log('❌ SKIPPED: Cannot test payment intent without valid secret key');
        return false;
    }

    try {
        // Create a test payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00 in cents
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Test payment intent for API validation'
        });

        console.log('✅ PASSED: Payment Intent creation successful');
        console.log(`🆔 Payment Intent ID: ${paymentIntent.id}`);
        console.log(`💰 Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
        console.log(`📊 Status: ${paymentIntent.status}`);
        
        // Clean up - cancel the test payment intent
        await stripe.paymentIntents.cancel(paymentIntent.id);
        console.log('🧹 Test payment intent cancelled');
        
        return true;

    } catch (error) {
        console.log('❌ FAILED: Payment Intent creation failed');
        console.log(`🚨 Error: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    console.log('=' .repeat(70));
    console.log('🧪 EXECUTIVE ELITE GROUP - STRIPE API TEST');
    console.log('=' .repeat(70));
    
    const secretKeyTest = await testStripeSecretKey();
    const publishableKeyTest = await testStripePublishableKey();
    const paymentIntentTest = await testStripePaymentIntent();
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Secret Key Test: ${secretKeyTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Publishable Key Test: ${publishableKeyTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Payment Intent Test: ${paymentIntentTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallResult = secretKeyTest && publishableKeyTest;
    console.log(`\n🎯 Overall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallResult) {
        console.log('\n🎉 Your Stripe API keys are working correctly!');
        console.log('📋 Next steps: Configure your frontend with the publishable key and backend with the secret key');
    } else {
        console.log('\n⚠️  Please check your Stripe API key configuration');
    }
    
    process.exit(overallResult ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});