import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('UNCAUGHT EXCEPTION:', error.message);
    });

    try {
        await page.goto('https://portal.creziax.cloud/login', { waitUntil: 'networkidle2' });
        
        await page.type('#login-email', 'SDVGDSV@GMAIL.COM');
        await page.type('#login-password', 'SDVGDSV@GMAIL.COM');
        
        await page.click('#login-submit');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        console.log('Navigated to:', page.url());
        
        // Wait a bit to catch any render errors
        await new Promise(r => setTimeout(r, 4000));
        
    } catch (e) {
        console.log('Script error:', e.message);
    } finally {
        await browser.close();
    }
})();
