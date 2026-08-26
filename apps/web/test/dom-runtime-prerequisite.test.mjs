import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { Window } from 'happy-dom';
import React from 'react';

const names = ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'IS_REACT_ACT_ENVIRONMENT'];
const originals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
let activeScope;
let reactDomClient;

function restore(object, property, descriptor) {
  if (descriptor) Object.defineProperty(object, property, descriptor);
  else delete object[property];
}

function install(window) {
  const values = { window, document: window.document, navigator: window.navigator, Node: window.Node, HTMLElement: window.HTMLElement, Event: window.Event, MouseEvent: window.MouseEvent, KeyboardEvent: window.KeyboardEvent, IS_REACT_ACT_ENVIRONMENT: true };
  for (const name of names) {
    Object.defineProperty(globalThis, name, { configurable: true, enumerable: originals.get(name)?.enumerable ?? false, writable: true, value: values[name] });
  }
}

async function withDomScope(exercise) {
  assert.equal(activeScope, undefined, 'a prior test leaked its DOM scope');
  const window = new Window({ url: 'https://example.test/vault' });
  const roots = new Set();
  const originalLocation = window.location.href;
  const locationReplace = Object.getOwnPropertyDescriptor(window.location, 'replace');
  const confirm = Object.getOwnPropertyDescriptor(window, 'confirm');
  install(window);
  activeScope = { window, roots };
  try {
    return await exercise({ window, document: window.document, roots });
  } finally {
    for (const root of roots) React.act(() => root.unmount());
    roots.clear();
    window.document.body.replaceChildren();
    assert.equal(window.document.body.children.length, 0, 'DOM scope retained body children');
    restore(window.location, 'replace', locationReplace);
    assert.deepEqual(Object.getOwnPropertyDescriptor(window.location, 'replace'), locationReplace);
    assert.equal(window.location.href, originalLocation, 'location state leaked');
    restore(window, 'confirm', confirm);
    assert.deepEqual(Object.getOwnPropertyDescriptor(window, 'confirm'), confirm);
    window.close();
    for (const [name, descriptor] of originals) restore(globalThis, name, descriptor);
    activeScope = undefined;
  }
}

async function getReactDomClient() {
  if (!reactDomClient) reactDomClient = await import('react-dom/client');
  return reactDomClient;
}

afterEach(() => {
  assert.equal(activeScope, undefined, 'test cleanup did not finish');
  for (const [name, descriptor] of originals) assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, name), descriptor);
});

test('Window installs required globals and cleanup restores exact descriptors', async () => {
  await withDomScope(({ window, document }) => {
    assert.strictEqual(globalThis.window, window);
    assert.strictEqual(globalThis.document, document);
    for (const name of ['HTMLElement', 'Event', 'MouseEvent', 'KeyboardEvent']) assert.strictEqual(globalThis[name], window[name]);
    assert.equal(globalThis.IS_REACT_ACT_ENVIRONMENT, true);
  });
});

test('React 19 createRoot dynamically mounts, updates under act, and unmounts cleanly', async () => {
  await withDomScope(async ({ document, roots }) => {
    const { createRoot } = await getReactDomClient();
    const container = document.createElement('div');
    document.body.append(container);
    function TestOnlyCounter() {
      const [count, setCount] = React.useState(0);
      return React.createElement('button', { onClick: () => setCount((value) => value + 1) }, String(count));
    }
    const root = createRoot(container);
    roots.add(root);
    React.act(() => root.render(React.createElement(TestOnlyCounter)));
    assert.equal(container.textContent, '0');
    React.act(() => container.querySelector('button').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    assert.equal(container.textContent, '1');
    React.act(() => root.unmount());
    roots.delete(root);
    assert.equal(container.innerHTML, '');
    container.remove();
  });
});

test('native controls dispatch real input, change, click, submit, and disabled behavior', async () => {
  await withDomScope(async ({ document, roots }) => {
    const { createRoot } = await getReactDomClient();
    const container = document.createElement('div');
    document.body.append(container);
    function TestOnlyControls() {
      const [events, setEvents] = React.useState({ input: 0, inputChange: 0, textarea: 0, textareaChange: 0, select: 0, selectChange: 0, click: 0, submit: 0, disabledClick: 0 });
      const record = (name) => setEvents((current) => ({ ...current, [name]: current[name] + 1 }));
      return React.createElement('form', {
        onSubmit: (event) => { event.preventDefault(); record('submit'); }
      },
      React.createElement('input', { 'aria-label': 'input', onInput: () => record('input'), onChange: () => record('inputChange') }),
      React.createElement('textarea', { 'aria-label': 'textarea', onInput: () => record('textarea'), onChange: () => record('textareaChange') }),
      React.createElement('select', { 'aria-label': 'select', onInput: () => record('select'), onChange: () => record('selectChange') },
        React.createElement('option', { value: 'chosen' }, 'Chosen')),
      React.createElement('button', { type: 'button', onClick: () => record('click') }, 'Enabled'),
      React.createElement('button', { type: 'submit' }, 'Submit'),
      React.createElement('button', { type: 'button', disabled: true, onClick: () => record('disabledClick') }, 'Disabled'),
      React.createElement('output', { 'data-testid': 'events' }, JSON.stringify(events)));
    }
    const root = createRoot(container);
    roots.add(root);
    React.act(() => root.render(React.createElement(TestOnlyControls)));
    const input = container.querySelector('[aria-label="input"]');
    const textarea = container.querySelector('[aria-label="textarea"]');
    const select = container.querySelector('[aria-label="select"]');
    const buttons = container.querySelectorAll('button');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'typed');
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(textarea, 'multiline');
    select.value = 'chosen';
    assert.equal(input.value, 'typed');
    assert.equal(textarea.value, 'multiline');
    assert.equal(select.value, 'chosen');
    React.act(() => input.dispatchEvent(new Event('input', { bubbles: true })));
    React.act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
    React.act(() => textarea.dispatchEvent(new Event('input', { bubbles: true })));
    React.act(() => textarea.dispatchEvent(new Event('change', { bubbles: true })));
    React.act(() => select.dispatchEvent(new Event('input', { bubbles: true })));
    React.act(() => select.dispatchEvent(new Event('change', { bubbles: true })));
    React.act(() => buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true })));
    React.act(() => buttons[1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    React.act(() => buttons[2].click());
    const events = JSON.parse(container.querySelector('[data-testid="events"]').textContent);
    assert.deepEqual(events, { input: 1, inputChange: 1, textarea: 1, textareaChange: 1, select: 1, selectChange: 1, click: 1, submit: 1, disabledClick: 0 });
    assert.equal(events.textarea, 1); assert.equal(events.textareaChange, 1);
    assert.equal(events.select, 1); assert.equal(events.selectChange, 1);
    assert.equal(events.click, 1); assert.equal(events.submit, 1); assert.equal(events.disabledClick, 0);
    React.act(() => root.unmount()); roots.delete(root); assert.equal(container.innerHTML, ''); container.remove();
  });
});

test('focus and required accessibility state are observable through the DOM', async () => {
  await withDomScope(({ document }) => {
    const label = document.createElement('label'); label.htmlFor = 'name'; label.textContent = 'Name';
    const input = document.createElement('input'); input.id = 'name'; input.required = true; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'error');
    const textarea = document.createElement('textarea'); const button = document.createElement('button');
    const status = document.createElement('div'); status.tabIndex = 0; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const error = document.createElement('div'); error.id = 'error'; error.setAttribute('role', 'alert'); document.body.append(label, input, textarea, button, status, error);
    for (const element of [input, textarea, button, status]) { element.focus(); assert.strictEqual(document.activeElement, element); }
    assert.strictEqual(label.control, input); assert.equal(input.getAttribute('aria-invalid'), 'true'); assert.equal(input.getAttribute('aria-describedby'), 'error');
    assert.equal(input.required, true); assert.equal(error.getAttribute('role'), 'alert'); assert.equal(status.getAttribute('role'), 'status'); assert.equal(status.getAttribute('aria-live'), 'polite');
    button.disabled = true; assert.equal(button.disabled, true);
  });
});

test('confirm interception captures exact messages and true/false outcomes', async () => {
  await withDomScope(({ window }) => {
    const original = Object.getOwnPropertyDescriptor(window, 'confirm'); const calls = [];
    Object.defineProperty(window, 'confirm', { configurable: true, writable: true, value: (message) => { calls.push(message); return calls.length === 1; } });
    assert.equal(window.confirm('Delete this chart?'), true); assert.equal(window.confirm('Leave the vault?'), false); assert.deepEqual(calls, ['Delete this chart?', 'Leave the vault?']);
    assert.notDeepEqual(Object.getOwnPropertyDescriptor(window, 'confirm'), original);
  });
});

test('location.replace interception distinguishes auth and vault destinations', async () => {
  await withDomScope(({ window }) => {
    const original = Object.getOwnPropertyDescriptor(window.location, 'replace'); const calls = [];
    Object.defineProperty(window.location, 'replace', { configurable: true, writable: true, value: (url) => calls.push(url) });
    window.location.replace('/auth/sign-in'); window.location.replace('/vault'); assert.deepEqual(calls, ['/auth/sign-in', '/vault']);
    assert.equal(calls.includes('/auth/sign-in'), true); assert.equal(calls.includes('/vault'), true); assert.notDeepEqual(Object.getOwnPropertyDescriptor(window.location, 'replace'), original);
  });
});

test('React effects flush under act and AbortController exposes abort state', async () => {
  await withDomScope(async ({ document, roots }) => {
    const { createRoot } = await getReactDomClient(); const controller = new AbortController();
    assert.ok(controller.signal instanceof AbortSignal); assert.equal(controller.signal.aborted, false); controller.abort(); assert.equal(controller.signal.aborted, true);
    const container = document.createElement('div'); document.body.append(container);
    function TestOnlyEffect() { const [ready, setReady] = React.useState(false); React.useEffect(() => setReady(true), []); return React.createElement('output', null, ready ? 'ready' : 'pending'); }
    const root = createRoot(container); roots.add(root); React.act(() => root.render(React.createElement(TestOnlyEffect))); assert.equal(container.textContent, 'ready');
    React.act(() => root.unmount()); roots.delete(root); container.remove();
  });
});
