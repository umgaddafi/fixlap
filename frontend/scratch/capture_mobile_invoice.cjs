const cp = require('child_process');
const fs = require('fs');

const proc = cp.spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=/tmp/chrome-test-mobile-inv3',
    '--window-size=320,700'
]);

setTimeout(async () => {
    try {
        const res = await fetch('http://localhost:9231/json');
        const tabs = await res.json();
        const pageTab = tabs.find(t => t.type === 'page');
        const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

        let id = 1;
        const send = (method, params = {}) => new Promise((resolve) => {
            const reqId = id++;
            const handler = (event) => {
                const data = JSON.parse(event.data);
                if (data.id === reqId) {
                    ws.removeEventListener('message', handler);
                    resolve(data.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });

        ws.onopen = async () => {
            await send('Page.enable');
            await send('Runtime.enable');
            await send('Emulation.setDeviceMetricsOverride', {
                width: 320,
                height: 700,
                deviceScaleFactor: 2,
                mobile: true
            });

            await send('Page.navigate', { url: 'http://127.0.0.1:5174/client/dashboard' });
            await new Promise(r => setTimeout(r, 1200));

            // Go to My Repairs
            await send('Runtime.evaluate', {
                expression: `
                    const navBtns = Array.from(document.querySelectorAll('button'));
                    const myRepairs = navBtns.find(b => b.innerText && b.innerText.includes('My repairs'));
                    if (myRepairs) myRepairs.click();
                `
            });
            await new Promise(r => setTimeout(r, 1000));

            // Click the Invoice button directly
            await send('Runtime.evaluate', {
                expression: `
                    const allBtns = Array.from(document.querySelectorAll('button'));
                    const invBtn = allBtns.find(b => b.innerText && b.innerText.trim().includes('Invoice'));
                    if (invBtn) invBtn.click();
                `
            });
            await new Promise(r => setTimeout(r, 1000));

            const shotModal = await send('Page.captureScreenshot');
            fs.writeFileSync('/home/umar/.gemini/antigravity-ide/brain/a95e0526-2102-4265-9e3d-9799cd3c3d30/.tempmediaStorage/mobile_invoice_320_open.png', Buffer.from(shotModal.data, 'base64'));
            console.log('Saved mobile_invoice_320_open.png');

            proc.kill();
            process.exit(0);
        };
    } catch (e) {
        console.error(e);
        proc.kill();
        process.exit(1);
    }
}, 1200);
