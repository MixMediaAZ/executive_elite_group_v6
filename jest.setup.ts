// Jest setup file

// Make sure crypto.randomUUID exists in the test environment
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto')
  globalThis.crypto = nodeCrypto.webcrypto
}

