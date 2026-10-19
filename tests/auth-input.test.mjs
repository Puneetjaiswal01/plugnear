import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, nativeCallbackCode } from '../apps/mobile/src/auth-input.ts';
test('phone normalization accepts Indian mobile and explicit international format',()=>{
 assert.equal(normalizePhone('98765 43210'),'+919876543210');
 assert.equal(normalizePhone('+91 (98765) 43210'),'+919876543210');
 assert.equal(normalizePhone('+442071838750'),'+442071838750');
 for(const value of ['', '123', 'abc', '5555555555', '+0123456789', '+919876543210x', '+1234567890123456']) assert.throws(()=>normalizePhone(value));
});
test('OAuth callback accepts only the exact PlugNear destination and a code',()=>{
 assert.equal(nativeCallbackCode('plugnear://auth/callback?code=one-time-code'),'one-time-code');
 for(const url of ['plugnear://auth/callback-evil?code=x','https://evil.example/auth/callback?code=x','plugnear://auth.evil/callback?code=x','plugnear://auth/callback#access_token=untrusted']) assert.equal(nativeCallbackCode(url),null);
 assert.throws(()=>nativeCallbackCode('plugnear://auth/callback?error=access_denied'));
});
