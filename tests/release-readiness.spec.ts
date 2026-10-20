import { test, expect } from './fixtures';
test('password recovery requests an app callback without revealing account existence',async({page})=>{
 let redirect='';let email='';await page.route('**/auth/v1/recover**',async route=>{
  email=route.request().postDataJSON().email;redirect=new URL(route.request().url()).searchParams.get('redirect_to')||'';
  await route.fulfill({status:200,contentType:'application/json',body:'{}'});
 });
 await page.goto('http://localhost:4174');await page.getByLabel('Email',{exact:true}).fill('recover@example.test');await page.getByRole('button',{name:'Forgot password?',exact:true}).click();
 await expect(page.getByText('If an account exists for this email',{exact:false})).toBeVisible();expect(email).toBe('recover@example.test');expect(redirect).toBe('http://localhost:4174/app/');
});
test('public policy and support pages are available without signing in',async({page})=>{
 for(const [path,title] of [['privacy','Privacy policy'],['support','How can we help?'],['terms','Website and early-access terms'],['delete-account','Request account deletion']]){
  expect((await page.goto(`http://localhost:4175/${path}/`))!.status()).toBe(200);await expect(page.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('deletion form prepares an email and does not claim submission or transmit form data',async({page})=>{
 const sent:string[]=[];page.on('request',request=>{if(request.method()!=='GET')sent.push(request.url());});
 await page.goto('http://localhost:4175/delete-account/');await page.getByLabel('Registered email or phone number').fill('delete@example.test');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Prepare deletion request email'}).click();await expect(page.getByRole('status')).toContainText('This website has not submitted a request.');expect(sent).toEqual([]);
});
