/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    // Flush async state initialization (document & settings loading).
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
});
