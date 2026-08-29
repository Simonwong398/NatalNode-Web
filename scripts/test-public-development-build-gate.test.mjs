import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPublicDevelopmentBuildEnvironment,
  PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT
} from './build-public-development.mjs';

test('public-development build flag is isolated to the child build environment', () => {
  const parentEnvironment = {
    NODE_ENV: 'development',
    [PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT]: 'false'
  };

  const buildEnvironment = createPublicDevelopmentBuildEnvironment(parentEnvironment);

  assert.equal(
    buildEnvironment[PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT],
    'true'
  );
  assert.equal(
    parentEnvironment[PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT],
    'false'
  );
  assert.notEqual(buildEnvironment, parentEnvironment);
});
