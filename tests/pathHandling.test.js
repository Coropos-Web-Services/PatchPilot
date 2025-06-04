import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContextAwareAIService } from '../src/services/contextAwareAiService.js';
import { buildFileTree } from '../src/utils/fileTree.js';

const sampleFiles = [
  { id: 1, path: 'src\\utils\\helper.js', name: 'helper.js', extension: 'js', size: 10, content: '' },
  { id: 2, path: 'src\\index.js', name: 'index.js', extension: 'js', size: 20, content: '' }
];

test('buildProjectStructure handles Windows paths', () => {
  const svc = new ContextAwareAIService();
  const structure = svc.buildProjectStructure(sampleFiles);
  assert.ok(structure.children.src, 'src directory exists');
  assert.ok(structure.children.src.children.utils, 'utils directory exists');
  assert.strictEqual(structure.children.src.children.utils.files[0].displayName, 'helper.js');
  assert.strictEqual(structure.children.src.files[0].displayName, 'index.js');
});

test('buildFileTree handles Windows paths', () => {
  const files = [
    { id: 1, path: 'src\\utils\\helper.js', name: 'helper.js', extension: 'js', size: 10, content: '' },
    { id: 2, path: 'README.md', name: 'README.md', extension: 'md', size: 5, content: '' }
  ];
  const tree = buildFileTree(files);
  assert.ok(tree.children.src.children.utils);
  assert.strictEqual(tree.children.src.children.utils.files[0].displayName, 'helper.js');
  assert.strictEqual(tree.files[0].displayName, 'README.md');
});
