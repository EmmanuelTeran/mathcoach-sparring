import { executeTests } from '../utils/codeRunner.js';

self.onmessage = (event) => {
  const report = executeTests(event.data);
  self.postMessage(report);
};
