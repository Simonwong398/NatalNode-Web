import { createEngine } from '@natalnode/engine-foundation';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [enginePackageRoot, adapterModuleUrl] = process.argv.slice(2);
if (!enginePackageRoot || !adapterModuleUrl) {
  throw new Error('Engine package root and private adapter module URL are required.');
}

const fixtureUrl = pathToFileURL(join(
  enginePackageRoot,
  'dist/tests/fixtures/fake-astronomy-provider.js'
));
const { FakeAstronomyProvider } = await import(fixtureUrl.href);
const { startPrivateEngineHttpService } = await import(adapterModuleUrl);

const calls = { bodyStates: 0, fundamentalStates: 0 };
class RecordingSyntheticProvider extends FakeAstronomyProvider {
  getBodyState(...args) {
    calls.bodyStates += 1;
    return super.getBodyState(...args);
  }

  getFundamentalState(...args) {
    calls.fundamentalStates += 1;
    return super.getFundamentalState(...args);
  }
}

const engine = createEngine(new RecordingSyntheticProvider());
const service = await startPrivateEngineHttpService(
  engine,
  { port: 0 }
);

function send(message) {
  if (typeof process.send === 'function') process.send(message);
}

send({ type: 'ready', host: service.host, port: service.port });

process.on('message', async (message) => {
  if (message?.type === 'stats') {
    send({ type: 'stats', ...calls });
    return;
  }
  if (message?.type === 'expected-chart' && message.request?.input && message.request?.options) {
    const chart = engine.calculateChart(message.request.input, message.request.options);
    send({ type: 'expected-chart', chart });
    return;
  }
  if (message?.type === 'shutdown') {
    await service.close();
    send({ type: 'closed' });
    process.disconnect();
  }
});
