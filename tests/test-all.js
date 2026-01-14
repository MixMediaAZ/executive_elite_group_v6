#!/usr/bin/env node

/**
 * Master Test Runner for Executive Elite Group API Testing
 * Runs all API key and connection tests and provides comprehensive results
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Test files configuration
const TESTS = [
    {
        name: 'OpenAI API',
        file: 'test-openai.js',
        description: 'Tests OpenAI API key functionality and model access'
    },
    {
        name: 'Stripe API',
        file: 'test-stripe.js',
        description: 'Tests Stripe secret and publishable keys'
    },
    {
        name: 'MailerSend API',
        file: 'test-mailersend.js',
        description: 'Tests MailerSend API key and email service access'
    },
    {
        name: 'Database Connection',
        file: 'test-database.js',
        description: 'Tests PostgreSQL/Supabase database connectivity'
    },
    {
        name: 'Supabase Storage',
        file: 'test-supabase.js',
        description: 'Tests Supabase storage and connection'
    }
];

// Colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

function runTest(testFile) {
    return new Promise((resolve) => {
        const testPath = path.join(__dirname, testFile);
        const child = spawn('node', [testPath], {
            stdio: 'pipe',
            cwd: __dirname
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            resolve({
                success: code === 0,
                output,
                error: errorOutput,
                exitCode: code
            });
        });
    });
}

async function runAllTests() {
    const results = [];
    
    log('\n🚀 Starting API Testing Suite...', colors.bright);
    log('This may take a few minutes...\n', colors.yellow);

    for (const test of TESTS) {
        log(`\n${'='.repeat(70)}`, colors.cyan);
        log(`🔬 Running ${test.name} Test`, colors.bright);
        log(`📋 ${test.description}`, colors.cyan);
        log('='.repeat(70), colors.cyan);

        const startTime = Date.now();
        const result = await runTest(test.file);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Display test output
        if (result.output) {
            console.log(result.output);
        }
        
        if (result.error) {
            console.error(result.error);
        }

        const testResult = {
            name: test.name,
            file: test.file,
            success: result.success,
            duration: duration,
            description: test.description
        };

        results.push(testResult);

        // Display result summary
        const status = result.success ? '✅ PASSED' : '❌ FAILED';
        const color = result.success ? colors.green : colors.red;
        
        log(`\n${test.name}: ${status} (${duration}ms)`, color);
    }

    return results;
}

function displaySummary(results) {
    log('\n\n' + '='.repeat(80), colors.bright);
    log('📊 COMPREHENSIVE TEST RESULTS SUMMARY', colors.bright);
    log('='.repeat(80), colors.bright);

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    // Individual results
    log('\n📋 Individual Test Results:', colors.cyan);
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const color = result.success ? colors.green : colors.red;
        const duration = `${result.duration}ms`;
        
        log(`   ${status} ${result.name.padEnd(20)} ${duration.padStart(8)} - ${result.description}`, color);
    });

    // Overall statistics
    log('\n📈 Overall Statistics:', colors.cyan);
    log(`   Total Tests: ${total}`);
    log(`   Passed: ${passed}`, colors.green);
    log(`   Failed: ${failed}`, colors.red);
    log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    // Configuration status
    log('\n🔧 Configuration Status:', colors.cyan);
    
    const envVars = [
        { name: 'OPENAI_API_KEY', status: results.find(r => r.name === 'OpenAI API')?.success },
        { name: 'STRIPE_SECRET_KEY', status: results.find(r => r.name === 'Stripe API')?.success },
        { name: 'MAILERSEND_API_KEY', status: results.find(r => r.name === 'MailerSend API')?.success },
        { name: 'DATABASE_URL', status: results.find(r => r.name === 'Database Connection')?.success },
        { name: 'SUPABASE_URL', status: results.find(r => r.name === 'Supabase Storage')?.success }
    ];

    envVars.forEach(envVar => {
        const status = envVar.status ? '✅' : '❌';
        const color = envVar.status ? colors.green : colors.red;
        log(`   ${status} ${envVar.name}`, color);
    });

    // Recommendations
    log('\n💡 Recommendations:', colors.cyan);
    
    if (passed === total) {
        log('   🎉 All tests passed! Your API integrations are ready for production.', colors.green);
        log('   📋 Next steps:', colors.blue);
        log('      • Deploy your application with confidence', colors.blue);
        log('      • Monitor API usage and costs', colors.blue);
        log('      • Set up error logging and monitoring', colors.blue);
    } else {
        log('   ⚠️  Some tests failed. Please review and fix the issues:', colors.yellow);
        
        results.filter(r => !r.success).forEach(result => {
            log(`   🔧 Fix ${result.name} configuration`, colors.yellow);
        });
        
        log('   📋 Common fixes:', colors.blue);
        log('      • Verify API keys are correct and active', colors.blue);
        log('      • Check environment variables are properly set', colors.blue);
        log('      • Ensure API quotas/limits are not exceeded', colors.blue);
        log('      • Verify network connectivity and firewall settings', colors.blue);
    }

    log('\n' + '='.repeat(80), colors.bright);
    
    const overallStatus = passed === total ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
    const overallColor = passed === total ? colors.green : colors.red;
    log(overallStatus, colors.bright + overallColor);
    log('='.repeat(80), colors.bright);

    return passed === total;
}

async function main() {
    log('\n🧪 Executive Elite Group - API Testing Suite', colors.bright + colors.blue);
    log('Testing all configured API keys and connections...', colors.blue);
    
    const results = await runAllTests();
    const allPassed = displaySummary(results);
    
    process.exit(allPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    log(`💥 Unhandled Rejection: ${reason}`, colors.red);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`💥 Uncaught Exception: ${error.message}`, colors.red);
    process.exit(1);
});

// Run the tests
main().catch(error => {
    log(`💥 Fatal Error: ${error.message}`, colors.red);
    process.exit(1);
});