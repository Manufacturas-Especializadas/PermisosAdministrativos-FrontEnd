// Run after npm run build: node scripts/verify-confirmations.cjs
// Uses an installed Chromium browser (CHROME_PATH can override its location).
// All API requests are intercepted with fixtures; no real backend is contacted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mesa-confirmations-'));
const root = path.resolve(__dirname, '../dist');
const browserPath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fixtureFile = path.join(output, 'empleados-prueba.xlsx');
fs.writeFileSync(fixtureFile, 'Fixture used only by the intercepted import request.');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + url.pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${path.join(output, 'profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let launchError;
  browser.on('error', error => { launchError = error; });
  let ws;
  try {
    const portFile = path.join(output, 'profile/DevToolsActivePort');
    for (let i = 0; !fs.existsSync(portFile) && i < 100 && !launchError; i++) await delay(100);
    if (launchError) throw launchError;
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => ws.addEventListener('open', resolve));
    let sequence = 0;
    const pending = new Map();
    const exceptions = [];
    const requests = [];
    const writes = [];
    let fail = false;
    let removed = false;
    let active = true;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const employee = { id: 1, payrollNumber: '001200', fullName: 'Ana Martinez Lopez', departmentId: 1, departmentName: 'Produccion', isActive: true };
    const permit = { id: 101, employeeId: 1, payrollNumber: employee.payrollNumber, employeeName: employee.fullName, permitDate: '2026-10-15', exitTime: '14:30:00', permitType: 1, reason: 'Tramite personal programado.', status: 1 };
    async function intercept({ requestId, request }) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) {
        return send(url.origin === origin ? 'Fetch.continueRequest' : 'Fetch.failRequest', url.origin === origin ? { requestId } : { requestId, errorReason: 'BlockedByClient' });
      }
      requests.push({ path: url.pathname, method: request.method });
      let data = {};
      let status = 200;
      const writing = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
      if (writing) {
        writes.push({ path: url.pathname, method: request.method, body: request.postData });
        await delay(350);
        if (fail) {
          status = 400;
          data = { title: 'No se pudo completar la operacion de prueba.', status: 400 };
        } else {
          if (url.pathname.startsWith('/api/personal-permits/')) removed = true;
          if (url.pathname.endsWith('/status')) active = JSON.parse(request.postData).isActive;
          if (url.pathname.endsWith('/import')) data = { processed: 2, created: 1, ignored: 1, errors: [] };
        }
      } else if (url.pathname.endsWith('/csrf')) data = { token: 'visual-test-only' };
      else if (url.pathname.endsWith('/me')) data = { userId: 'admin-test', userName: 'administrador.ejemplo', roles: ['Administrator'], mustChangePassword: false };
      else if (url.pathname === '/api/employees') data = { items: [employee], page: 1, pageSize: 25, totalCount: 1, totalPages: 1 };
      else if (url.pathname === '/api/users') data = [{ id: 'user-1', userName: 'ana.martinez', employeeName: employee.fullName, payrollNumber: employee.payrollNumber, roles: ['Supervisor'], isActive: active }];
      else if (url.pathname.startsWith('/api/personal-permits/')) data = removed ? [] : [permit];
      await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, X-CSRF-TOKEN' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' },
      ], body: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const promise = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) promise?.reject(new Error(message.error.message)); else promise?.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
      if (message.method === 'Fetch.requestPaused') intercept(message.params).catch(error => exceptions.push(error.message));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    async function waitFor(expression) {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
      throw new Error('Timed out: ' + expression);
    }
    const visibleButton = (text, scope = 'document') => `Array.from(${scope}.querySelectorAll('button')).find(b => b.getBoundingClientRect().width > 0 && b.textContent.trim() === ${JSON.stringify(text)})`;
    async function click(text, scope) {
      await waitFor(`!!(${visibleButton(text, scope)})`);
      await evaluate(`{ const b = ${visibleButton(text, scope)}; b.focus(); b.click(); }`);
    }
    const dialog = 'document.querySelector("dialog[open]")';
    const toast = 'document.querySelector("[aria-label=Notificaciones]")';
    async function key(key, modifiers = 0) {
      const windowsVirtualKeyCode = key === 'Escape' ? 27 : 9;
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code: key, windowsVirtualKeyCode, modifiers });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode, modifiers });
    }
    async function screenshot(name) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
    }
    const cases = [
      { name: 'approve', route: '/permits/pending', action: 'Aprobar', endpoint: '/api/personal-permits/101/approve', method: 'POST', success: 'Permiso aprobado correctamente.' },
      { name: 'reject', route: '/permits/pending', action: 'Rechazar', endpoint: '/api/personal-permits/101/reject', method: 'POST', success: 'Permiso rechazado correctamente.' },
      { name: 'exit', route: '/permits/approved', action: 'Registrar salida', endpoint: '/api/personal-permits/101/complete', method: 'POST', success: 'Salida registrada correctamente.' },
      { name: 'deactivate', route: '/users', action: 'Desactivar', endpoint: '/api/users/user-1/status', method: 'PATCH', active: true, success: 'Usuario desactivado correctamente.' },
      { name: 'activate', route: '/users', action: 'Activar', endpoint: '/api/users/user-1/status', method: 'PATCH', active: false, success: 'Usuario activado correctamente.' },
      { name: 'import-employees', route: '/employees', action: 'Importar empleados', endpoint: '/api/employees/import', method: 'POST', file: '#employee-import-file', panel: 'employee-import-panel', success: 'Importación de empleados completada.' },
      { name: 'import-users', route: '/users', action: 'Importar usuarios', endpoint: '/api/users/import', method: 'POST', file: '#user-import-file', panel: 'import-users-panel', success: 'Importación de usuarios completada.' },
    ];
    for (const width of [1440, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const test of cases) {
        fail = false; removed = false; active = test.active ?? true;
        await send('Page.navigate', { url: origin + test.route });
        await waitFor(`!!(${visibleButton(test.action)})`);
        if (test.file) {
          await click(test.action);
          const dom = await send('DOM.getDocument');
          const { nodeId } = await send('DOM.querySelector', { nodeId: dom.root.nodeId, selector: test.file });
          await send('DOM.setFileInputFiles', { nodeId, files: [fixtureFile] });
        }
        const trigger = test.file ? `document.querySelector('#${test.panel} button[type=submit]')` : visibleButton(test.action);
        await delay(100);
        const initialRequests = requests.length;
        const initialWrites = writes.length;
        const open = async () => {
          await evaluate(`{ const b = ${trigger}; window.testTrigger = b; b.focus(); b.click(); }`);
          await waitFor(`!!${dialog}`);
        };
        await open();
        assert.equal(requests.length, initialRequests, test.name + ': opening must not request data');
        assert.equal(await evaluate(`${dialog}.contains(document.activeElement)`), true, 'Initial focus');
        assert.equal(await evaluate(`!!document.getElementById(${dialog}.getAttribute('aria-labelledby'))?.textContent`), true, 'Accessible dialog name');
        assert.equal(await evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`), true, 'Page overflow');
        assert.equal(await evaluate(`${dialog}.scrollWidth <= ${dialog}.clientWidth`), true, 'Dialog overflow');
        await screenshot(test.name + '-' + width);
        await click('Cancelar', dialog);
        await waitFor(`!${dialog}`);
        assert.equal(requests.length, initialRequests, 'Cancel must not make requests');
        assert.equal(await evaluate('document.activeElement === window.testTrigger'), true, 'Focus restored');
        await open();
        await key('Escape');
        await waitFor(`!${dialog}`);
        assert.equal(requests.length, initialRequests, 'Escape must not make requests');
        await open();
        if (test.name === 'reject') {
          assert.equal(await evaluate(`${dialog}.querySelector('button[type=submit]').disabled`), true, 'Rejection requires reason');
          await evaluate(`{ const field = ${dialog}.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, '  Motivo de prueba  '); field.dispatchEvent(new Event('input', { bubbles: true })); }`);
        }
        await evaluate(`${dialog}.querySelector('button[type=submit]').focus()`);
        await key('Tab');
        assert.equal(await evaluate(`${dialog}.contains(document.activeElement)`), true, 'Forward focus stays inside');
        await key('Tab', 8);
        assert.equal(await evaluate(`${dialog}.contains(document.activeElement)`), true, 'Reverse focus stays inside');
        fail = true;
        // Double-click plus immediate form submission exercise the lock before React rerenders.
        await evaluate(`{ const form = ${dialog}.querySelector('form'); const button = form.querySelector('button[type=submit]'); button.click(); button.click(); form.requestSubmit(); }`);
        await waitFor(`${dialog}?.querySelector('form')?.getAttribute('aria-busy') === 'true'`);
        assert.equal(await evaluate(`${dialog}.querySelector('button[type=submit]').disabled`), true, 'Confirm disabled while pending');
        await key('Escape');
        assert.equal(await evaluate(`!!${dialog}`), true, 'Escape cannot abandon a pending request');
        await waitFor(`!!${dialog}?.querySelector('[role=alert]') && ${dialog}.querySelector('form').getAttribute('aria-busy') === 'false'`);
        assert.equal(writes.length, initialWrites + 1, test.name + ': double submit must send once');
        assert.equal(await evaluate(`${toast}.textContent.trim()`), '', 'Failure must not toast success');
        assert.equal(await evaluate(`${dialog}.querySelector('button[type=submit]').disabled`), false, 'Retry enabled');
        if (test.name === 'reject') assert.equal(await evaluate(`${dialog}.querySelector('textarea').value`), '  Motivo de prueba  ', 'Reason retained after error');
        fail = false;
        await evaluate(`${dialog}.querySelector('button[type=submit]').click()`);
        await waitFor(`!${dialog}`);
        await waitFor(`${toast}.textContent.includes(${JSON.stringify(test.success)})`);
        assert.equal(writes.length, initialWrites + 2, test.name + ': retry must send once');
        const last = writes.at(-1);
        assert.equal(last.path, test.endpoint);
        assert.equal(last.method, test.method);
        if (test.name === 'reject') assert.deepEqual(JSON.parse(last.body), { reason: 'Motivo de prueba' });
        if (test.active !== undefined) assert.deepEqual(JSON.parse(last.body), { isActive: !test.active });
        await screenshot(test.name + '-success-' + width);
        console.log(`PASS ${width}px ${test.name}: cancel / Escape / single request / double submit / error / retry / toast / focus`);
      }
    }
    assert.deepEqual(exceptions, [], 'No browser exceptions');
    console.log('All 14 scenarios passed. Screenshots: ' + output);
    await send('Browser.close');
  } finally {
    ws?.close();
    browser.kill();
    server.close();
  }
}

run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
