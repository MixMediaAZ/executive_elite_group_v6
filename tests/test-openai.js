#!/usr/bin/env node

/**
 * OpenAI API Key Testing Script
 * Tests the functionality of the OpenAI API key provided
 */

require('dotenv').config();
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔍 Testing OpenAI API Key...\n');

if (!OPENAI_API_KEY) {
    console.log('❌ FAILED: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function testOpenAI() {
    try {
        console.log('📡 Testing API connection...');
        
        // Test with a simple completion request
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Say "API test successful" if you receive this message.'
                }
            ],
            model: 'gpt-3.5-turbo',
            max_tokens: 50,
            temperature: 0.1
        });

        const response = completion.choices[0]?.message?.content;
        
        if (response && response.includes('API test successful')) {
            console.log('✅ PASSED: OpenAI API connection successful');
            console.log(`📝 Test Response: ${response}`);
            console.log(`🤖 Model Used: gpt-3.5-turbo`);
            console.log(`💰 Estimated Cost: $${(completion.usage.total_tokens / 1000 * 0.002).toFixed(6)}`);
            return true;
        } else {
            console.log('❌ FAILED: Unexpected response from OpenAI API');
            console.log(`📝 Response: ${response}`);
            return false;
        }

    } catch (error) {
        console.log('❌ FAILED: OpenAI API test failed');
        console.log(`🚨 Error Type: ${error.constructor.name}`);
        console.log(`📄 Error Message: ${error.message}`);
        
        if (error.status === 401) {
            console.log('💡 Tip: Check if your API key is valid and has proper permissions');
        } else if (error.status === 429) {
            console.log('💡 Tip: Rate limit exceeded. Try again later or upgrade your plan');
        } else if (error.status === 402) {
            console.log('💡 Tip: Insufficient credits. Add billing information to your OpenAI account');
        }
        
        return false;
    }
}

// Main execution
async function main() {
    console.log('=' .repeat(60));
    console.log('🧪 EXECUTIVE ELITE GROUP - OPENAI API TEST');
    console.log('=' .repeat(60));
    
    const testResult = await testOpenAI();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`OpenAI API Test: ${testResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (testResult) {
        console.log('\n🎉 Your OpenAI API key is working correctly!');
        console.log('📋 Next steps: Configure your application to use this key');
    } else {
        console.log('\n⚠️  Please check your OpenAI API key configuration');
    }
    
    process.exit(testResult ? 0 : 1);
}

main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});