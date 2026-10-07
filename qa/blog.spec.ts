import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const articles=JSON.parse(fs.readFileSync('content/articles.json','utf8'));
const withImage=articles.find((a:{images:unknown[]})=>a.images.length);
test('article archive and original images work without WordPress navigation',async({page},info)=>{
 for(const route of ['/blog',`/blog/${withImage.slug}`]){
  expect((await page.goto(route))?.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const links=await page.locator('a[href]').evaluateAll(all=>all.map(a=>(a as HTMLAnchorElement).href).filter(h=>['breslovtorah.com','www.breslovtorah.com'].includes(new URL(h).hostname)));expect(links).toEqual([]);
 }
 for(const image of await page.locator('.article-original-images img').all()){
  await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);await expect(image).toHaveAttribute('src',/^\/api\/resources\//);
 }
 await page.screenshot({path:`qa/screenshots/${info.project.name}-native-blog.png`,fullPage:true});
});
test('published articles and allowlisted public resources are available',async({request},info)=>{
 test.skip(info.project.name!=='desktop','Read-only inventory verification once');
 for(const article of articles)expect((await request.get(`/blog/${article.slug}`)).status(),article.slug).toBe(200);
 const resources=JSON.parse(fs.readFileSync('content/public-resources.json','utf8'));
 for(const id of Object.keys(resources)){const head=await request.head(`/api/resources/${id}`);expect(head.status(),id).toBe(200);expect(Number(head.headers()['content-length'])).toBeGreaterThan(0);}
 expect((await request.get('/api/resources/toString')).status()).toBe(404);
 expect((await request.get('/courses/calendar')).url()).toContain('/calendar');
 expect((await request.get('/donate/contact')).url()).toContain('/contact');
});
