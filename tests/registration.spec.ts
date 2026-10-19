import { test, expect } from '@playwright/test';
const app = 'http://localhost:4174';
async function settings(page: import('@playwright/test').Page, enabled: boolean) {
 await page.route('**/auth/v1/settings', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({external:{google:enabled,apple:false,phone:enabled,email:true}})}));
}
test('unconfigured providers are disabled while email registration stays available',async({page})=>{
 await settings(page,false);await page.goto(app);
 await expect(page.getByRole('button',{name:'Continue with Google'})).toBeDisabled();
 await page.getByRole('button',{name:'Use phone number'}).click();
 await expect(page.getByRole('button',{name:'Send verification code'})).toBeDisabled();
 await expect(page.getByText('Phone OTP is awaiting SMS provider setup.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Use email',exact:true}).click();
 await page.getByRole('button',{name:'New here? Create an account'}).click();
 await expect(page.getByRole('button',{name:'Create account',exact:true})).toBeVisible();
});
test('phone OTP validates input, normalizes India number and verifies the sent-to identity',async({page})=>{
 await settings(page,true);let sends=0;let verification:unknown;
 await page.route('**/auth/v1/otp',async route=>{sends++;expect(route.request().postDataJSON().phone).toBe('+919876543210');await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
 await page.route('**/auth/v1/verify',async route=>{verification=route.request().postDataJSON();await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({msg:'Invalid OTP fixture',error_code:'otp_expired'})});});
 await page.goto(app);await page.getByRole('button',{name:'Use phone number'}).click();
 await page.getByLabel('Mobile number',{exact:true}).fill('123');await page.getByRole('button',{name:'Send verification code'}).click();
 await expect(page.getByText('Enter a 10-digit Indian mobile number',{exact:false})).toBeVisible();expect(sends).toBe(0);
 await page.getByLabel('Mobile number',{exact:true}).fill('9876543210');await page.getByRole('button',{name:'Send verification code'}).click();
 await expect(page.getByLabel('Verification code',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Resend in/})).toBeDisabled();
 await page.getByLabel('Verification code',{exact:true}).fill('123456');await page.getByRole('button',{name:'Verify and continue'}).click();
 await expect(page.getByText('Invalid OTP fixture',{exact:false})).toBeVisible();expect(verification).toMatchObject({phone:'+919876543210',token:'123456',type:'sms'});
 await page.getByLabel('Mobile number',{exact:true}).fill('9999999999');await expect(page.getByLabel('Verification code',{exact:true})).not.toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Google sign in uses PKCE and preserves the host callback route',async({page})=>{
 await settings(page,true);await page.route('**/auth/v1/authorize**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>OAuth provider fixture</p>'}));
 await page.goto(app+'/?mode=host');const request=page.waitForRequest('**/auth/v1/authorize**');await page.getByRole('button',{name:'Continue with Google'}).click();const url=new URL((await request).url());
 expect(url.searchParams.get('provider')).toBe('google');expect(url.searchParams.get('code_challenge')).toBeTruthy();expect(url.searchParams.get('code_challenge_method')?.toLowerCase()).toBe('s256');expect(url.searchParams.get('redirect_to')).toBe(app+'/app/?mode=host');
});
test('email signup requests email confirmation on the app route',async({page})=>{
 await settings(page,false);let redirect='';await page.route('**/auth/v1/signup**',async route=>{const body=route.request().postDataJSON();expect(body.email).toBe('new@example.test');redirect=new URL(route.request().url()).searchParams.get('redirect_to')||'';await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'00000000-0000-4000-8000-000000000005',email:'new@example.test',identities:[]})});});
 await page.goto(app);await page.getByRole('button',{name:'New here? Create an account'}).click();await page.getByLabel('Email',{exact:true}).fill('new@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByText('Check your email to confirm your account',{exact:false})).toBeVisible();expect(redirect).toBe(app+'/app/');
});
