# Executive Elite Group - API Testing Suite

Comprehensive testing scripts for validating all API keys and connections used in the Executive Elite Group application.

## 📋 Overview

This testing suite validates the following services:

- **OpenAI API**: Tests AI functionality and model access
- **Stripe API**: Tests payment processing capabilities
- **MailerSend API**: Tests email service functionality
- **Database**: Tests PostgreSQL/Supabase database connectivity
- **Supabase Storage**: Tests file storage and database connections

## 🚀 Quick Start

### Run All Tests
```bash
node tests/test-all.js
```

### Run Individual Tests
```bash
# OpenAI API Test
node tests/test-openai.js

# Stripe API Test
node tests/test-stripe.js

# MailerSend API Test
node tests/test-mailersend.js

# Database Connection Test
node tests/test-database.js

# Supabase Storage Test
node tests/test-supabase.js
```

## 📁 Test Files

| File | Description |
|------|-------------|
| `test-openai.js` | Tests OpenAI API key and model access |
| `test-stripe.js` | Tests Stripe secret and publishable keys |
| `test-mailersend.js` | Tests MailerSend API key and email service |
| `test-database.js` | Tests PostgreSQL database connectivity |
| `test-supabase.js` | Tests Supabase storage and database connections |
| `test-all.js` | Master test runner that executes all tests |

## 🔧 Environment Variables

The tests require the following environment variables to be set:

### OpenAI
- `OPENAI_API_KEY`: Your OpenAI API key

### Stripe
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

### MailerSend
- `MAILERSEND_API_KEY`: Your MailerSend API key

### Database
- `DATABASE_URL`: PostgreSQL connection string

### Supabase
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## 📊 Test Results

Each test provides detailed feedback including:

- ✅ **Pass/Fail Status**: Clear indication of test success
- 📊 **Connection Details**: Server information and configuration
- ⚡ **Performance Metrics**: Response times and connection quality
- 🔍 **Error Diagnostics**: Specific error messages and troubleshooting tips
- 💰 **Cost Information**: For paid services like OpenAI

### Example Output
```
🔍 Testing OpenAI API Key...

📡 Testing API connection...
✅ PASSED: OpenAI API connection successful
📝 Test Response: API test successful
🤖 Model Used: gpt-3.5-turbo
💰 Estimated Cost: $0.000002

============================================================
📊 TEST SUMMARY
============================================================
OpenAI API Test: ✅ PASSED

🎉 Your OpenAI API key is working correctly!
📋 Next steps: Configure your application to use this key
```

## 🔍 Test Details

### OpenAI API Test
- Validates API key authentication
- Tests model availability (GPT-3.5-turbo, GPT-4)
- Provides cost estimates for API usage
- Checks rate limiting and quotas

### Stripe API Test
- Validates secret key authentication
- Tests publishable key format
- Creates test payment intents
- Checks account configuration and capabilities

### MailerSend API Test
- Validates API key authentication
- Tests domain access and verification
- Checks template availability
- Verifies email sending capabilities

### Database Connection Test
- Tests PostgreSQL connection
- Validates read/write permissions
- Measures connection performance
- Checks table access and schema

### Supabase Storage Test
- Tests Supabase connection
- Validates storage bucket access
- Tests authentication endpoints
- Checks service role permissions

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify keys are correctly copied from provider dashboards
   - Check for extra spaces or characters
   - Ensure keys have proper permissions

2. **Connection Timeouts**
   - Check internet connectivity
   - Verify firewall settings
   - Confirm API endpoints are accessible

3. **Authentication Failures**
   - Check if API keys are active
   - Verify account status with provider
   - Ensure billing information is up to date

4. **Rate Limiting**
   - Wait before retrying
   - Check usage limits in provider dashboards
   - Consider upgrading API plan if needed

### Getting Help

If tests continue to fail:

1. Check the specific error messages in test output
2. Verify environment variables are correctly set
3. Test API keys directly in provider dashboards
4. Check network connectivity and firewall settings

## 📈 Best Practices

### Before Running Tests
- Ensure all environment variables are set
- Check internet connectivity
- Verify API accounts are active and funded

### After Successful Tests
- Update application configuration with working keys
- Set up monitoring for API usage and costs
- Document successful configurations
- Plan for API quota management

### Regular Testing
- Run tests after configuration changes
- Test before deploying to production
- Monitor API key expiration dates
- Regularly verify service availability

## 🔒 Security Notes

- API keys are sensitive information
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate API keys regularly
- Monitor API usage for unusual activity

## 📝 Sample Output

```
🧪 Executive Elite Group - API Testing Suite
Testing all configured API keys and connections...

======================================================================
🔬 Running OpenAI API Test
📋 Tests OpenAI API key functionality and model access
======================================================================

🔍 Testing OpenAI API Key...

📡 Testing API connection...
✅ PASSED: OpenAI API connection successful
📝 Test Response: API test successful
🤖 Model Used: gpt-3.5-turbo
💰 Estimated Cost: $0.000002

OpenAI API: ✅ PASSED (1234ms)
```

---

**Created for Executive Elite Group Application Testing**  
*Last updated: 2026-01-03*