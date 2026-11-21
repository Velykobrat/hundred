import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const temp = new URL('./.cache/', import.meta.url);
mkdirSync(temp, { recursive: true });
for (const name of ['i18n', 'node-icon', 'node-color', 'node-mode', 'tree', 'document', 'history', 'treemap', 'collection', 'percentage']) {
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
  const js = stripTypeScriptTypes(source).replace(/from "\.\/(node-icon|node-color|node-mode|tree|document|collection|percentage)"/g, 'from "./$1.mjs"');
  writeFileSync(new URL(`${name}.mjs`, temp), js);
}
const { createNode, addPart, parseValue, remaining, sumValues, editPart, deletePart, decodeDocument, encodeDocument, normalizeDocument } = await import(new URL('document.mjs', temp));
const { documentReducer, initialState } = await import(new URL('history.mjs', temp));
const { createTreemap } = await import(new URL('treemap.mjs', temp));
const { decodeCollection, encodeCollection, emptyCollection, cloneDocument, putDocument, appendImported } = await import(new URL('collection.mjs', temp));
const { parsePercent, percentToValue, valueToPercent } = await import(new URL('percentage.mjs', temp));
const node = (id, value, children = []) => ({ mode: 'measured', id, name: id, value, unit: 'грн', children });
const root = node('root', 100, [node('a', 60, [node('nested', 25)]), node('b', 30)]);
let tested = 0;
function check(name, callback) { callback(); tested++; console.log(`PASS ${name}`); }
check('Comma, spaces, precision and invalid numeric input', () => {
  assert.equal(parseValue('1 000,25'), 1000.25);
  for (const value of ['-1', '0', 'NaN', 'Infinity', '1e3', '1.0000001', '1000000001', '1,2,3', '']) assert.equal(parseValue(value), null);
});
check('Decimal allocations exhaust capacity exactly', () => {
  const decimal = node('decimal', .3, [node('x', .1), node('y', .2)]);
  assert.equal(sumValues(decimal.children), .3);
  assert.equal(remaining(decimal), 0);
});
check('Editing preserves descendants and cannot exceed siblings or shrink below descendants', () => {
  const edited = editPart(root, 'a', 'Оренда', 70);
  assert.equal(edited.children[0].name, 'Оренда');
  assert.deepEqual(edited.children[0].children, root.children[0].children);
  assert.throws(() => editPart(root, 'a', 'a', 71));
  assert.throws(() => editPart(root, 'a', 'a', 24));
  assert.throws(() => editPart(root, 'root', 'root', 89));
  assert.equal(root.children[0].value, 60);
});
check('Deletion frees capacity and removes a whole subtree without mutation', () => {
  const result = deletePart(root, 'a');
  assert.equal(remaining(result), 70);
  assert.deepEqual(result.children.map(x => x.id), ['b']);
  assert.equal(root.children.length, 2);
  assert.throws(() => deletePart(root, 'root'));
});
check('Storage roundtrip and path repair', () => {
  const document = { root, pathIds: ['root', 'a', 'nested'] };
  assert.deepEqual(decodeDocument(encodeDocument(document)), document);
  assert.deepEqual(normalizeDocument({ root: deletePart(root, 'a'), pathIds: document.pathIds }).pathIds, ['root']);
});
check('Corrupt storage: version, duplicate IDs, values and unit mismatch are rejected', () => {
  const wrap = root => JSON.stringify({ version: 1, root, pathIds: ['root'] });
  assert.throws(() => decodeDocument('not json'));
  assert.throws(() => decodeDocument(JSON.stringify({ version: 2, root, pathIds: [] })));
  assert.throws(() => decodeDocument(wrap(node('root', 100, [node('dup', 20), node('dup', 20)]))));
  assert.throws(() => decodeDocument(wrap(node('root', 100, [node('a', 101)]))));
  assert.throws(() => decodeDocument(wrap(node('root', 100, [{ ...node('a', 20), unit: 'год' }]))));
  assert.throws(() => decodeDocument(wrap(node('root', -1))));
});
check('Undo and redo restore deleted descendants and discard redo on a new edit', () => {
  const document = { root, pathIds: ['root', 'a'] };
  let state = documentReducer(initialState, { type: 'load', document });
  state = documentReducer(state, { type: 'change', document: { root: deletePart(root, 'a'), pathIds: document.pathIds }, notice: '' });
  state = documentReducer(state, { type: 'undo' });
  assert.deepEqual(state.document, document);
  state = documentReducer(state, { type: 'redo' });
  assert.equal(state.document.root.children.length, 1);
  state = documentReducer(state, { type: 'undo' });
  state = documentReducer(state, { type: 'change', document: { root: editPart(root, 'b', 'нове', 20), pathIds: ['root'] }, notice: '' });
  assert.equal(state.future.length, 0);
});
check('History cap, navigation outside history and creation undo', () => {
  let state = documentReducer(initialState, { type: 'load', document: { root: null, pathIds: [] } });
  state = documentReducer(state, { type: 'change', document: { root, pathIds: ['root'] }, notice: '' });
  const navigated = documentReducer(state, { type: 'navigate', pathIds: ['root', 'a'] });
  assert.equal(navigated.past.length, 1);
  assert.equal(documentReducer(navigated, { type: 'undo' }).document.root, null);
  for (let index = 0; index < 40; index++) state = documentReducer(state, { type: 'change', document: { root, pathIds: ['root'] }, notice: '' });
  assert.equal(state.past.length, 30);
});
check('Treemap matches exact proportions and stays in bounds', () => {
  const items = [node('a', 60), node('b', 30), node('free', 10)].map(node => ({ node, x: 0, y: 0, width: 0, height: 0 }));
  const layout = createTreemap(items);
  for (const item of layout) {
    assert.ok(Math.abs(item.width * item.height - item.node.value * 100) < 1e-6);
    assert.ok(item.x >= 0 && item.y >= 0 && item.x + item.width <= 100.000001 && item.y + item.height <= 100.000001);
  }
});
check('Percent input: bounds, comma, nested basis and exact six-place rounding', () => {
  assert.equal(parsePercent('12,5'), 12.5);
  assert.equal(parsePercent('100'), 100);
  for (const input of ['0', '-1', '100.000001', 'NaN', '1e2']) assert.equal(parsePercent(input), null);
  assert.equal(percentToValue(1000, 30), 300);
  assert.equal(percentToValue(300, 50), 150);
  assert.equal(percentToValue(.3, 100), .3);
  assert.equal(percentToValue(1, 33.333333), .333333);
  assert.equal(percentToValue(.000001, 50), .000001);
  assert.equal(percentToValue(.000001, 1), 0);
  assert.equal(valueToPercent(1000, 300), 30);
});
check('Legacy single backup migrates without changing IDs or navigation', () => {
  const document = { root, pathIds: ['root', 'a', 'nested'] };
  const collection = decodeCollection(encodeDocument(document));
  assert.deepEqual(collection, { documents: [document], activeId: 'root' });
  assert.deepEqual(decodeCollection(encodeCollection(collection)), collection);
  assert.deepEqual(decodeCollection(encodeDocument({ root: null, pathIds: [] })), emptyCollection);
});
check('Multiple distributions retain independent values and navigation', () => {
  let state = documentReducer(initialState, { type: 'load', collection: emptyCollection });
  state = documentReducer(state, { type: 'change', document: { root, pathIds: ['root', 'a'] }, notice: '' });
  state = documentReducer(state, { type: 'select', id: null });
  const second = node('second', 24, [node('work', 8)]);
  state = documentReducer(state, { type: 'change', document: { root: second, pathIds: ['second'] }, notice: '' });
  assert.equal(state.collection.documents.length, 2);
  state = documentReducer(state, { type: 'select', id: 'root' });
  assert.deepEqual(state.document.pathIds, ['root', 'a']);
  state = documentReducer(state, { type: 'change', document: { root: editPart(root, 'a', 'changed', 70), pathIds: ['root'] }, notice: '' });
  state = documentReducer(state, { type: 'select', id: 'second' });
  assert.deepEqual(state.document.root, second);
  assert.deepEqual(decodeCollection(encodeCollection(state.collection)), state.collection);
});
check('Duplication regenerates every ID and does not mutate the original', () => {
  let index = 0;
  const copy = cloneDocument({ root, pathIds: ['root', 'a'] }, () => `copy-${++index}`, 'Копія');
  assert.equal(copy.root.name, 'Копія');
  assert.equal(copy.root.children[0].children[0].id, 'copy-3');
  assert.deepEqual(copy.pathIds, ['copy-1']);
  assert.equal(root.id, 'root');
  assert.equal(root.name, 'root');
  assert.equal(copy.root.children[0].value, 60);
});
check('Import appends without replacing and can be undone or redone atomically', () => {
  const original = putDocument(emptyCollection, { root, pathIds: ['root'] });
  let index = 0;
  const imported = appendImported(original, original, () => `import-${++index}`);
  assert.equal(imported.documents.length, 2);
  assert.deepEqual(imported.documents[0], original.documents[0]);
  assert.notEqual(imported.documents[1].root.id, root.id);
  let state = documentReducer(initialState, { type: 'load', collection: original });
  state = documentReducer(state, { type: 'replace', collection: imported, notice: '' });
  state = documentReducer(state, { type: 'undo' });
  assert.deepEqual(state.collection, original);
  state = documentReducer(state, { type: 'redo' });
  assert.deepEqual(state.collection, imported);
});
check('Whole deletion restores all distributions and descendants on undo', () => {
  const original = putDocument(putDocument(emptyCollection, { root, pathIds: ['root'] }), { root: node('second', 24), pathIds: ['second'] });
  let state = documentReducer(initialState, { type: 'load', collection: original });
  state = documentReducer(state, { type: 'remove', id: 'second' });
  assert.equal(state.document.root.id, 'root');
  assert.equal(state.collection.documents.length, 1);
  state = documentReducer(state, { type: 'undo' });
  assert.deepEqual(state.collection, original);
});
check('Import rejects malformed, empty, duplicate, over-limit and oversized backups', () => {
  assert.throws(() => decodeCollection('{'));
  assert.throws(() => decodeCollection(JSON.stringify({ version: 3 })));
  assert.throws(() => decodeCollection(JSON.stringify({ version: 2, activeId: 'root', documents: [{ root, pathIds: [] }, { root, pathIds: [] }] })));
  assert.throws(() => appendImported(emptyCollection, emptyCollection, () => 'id'));
  const full = { documents: Array.from({ length: 20 }, (_, index) => ({ root: node(`root-${index}`, 100), pathIds: [`root-${index}`] })), activeId: 'root-0' };
  assert.throws(() => putDocument(full, { root, pathIds: ['root'] }));
  assert.throws(() => appendImported(full, putDocument(emptyCollection, { root, pathIds: ['root'] }), () => 'id'));
  assert.throws(() => decodeCollection(' '.repeat(4000001)));
  assert.throws(() => decodeCollection(JSON.stringify({ version: 2, activeId: 'root', documents: [{ root: node('root', 100, [node('a', 101)]), pathIds: [] }] })));
});

const structural = createNode('company', 'Company');
check('Structural root creation defaults to weight 1 without a quantity or unit', () => {
  assert.deepEqual(structural, { id: 'company', name: 'Company', mode: 'structural', weight: 1, children: [] });
  assert.throws(() => createNode('bad', ' '));
  assert.throws(() => createNode('bad', 'Bad', 0, 'people'));
  assert.throws(() => createNode('bad', 'Bad', 9, ''));
});
const department = addPart(structural, 'company', createNode('department', 'Department'));
const nested = addPart(department, 'department', createNode('team', 'Team'));
check('Structural children and nested hierarchy have no capacity constraint', () => {
  assert.equal(department.children[0].mode, 'structural');
  assert.equal(nested.children[0].children[0].weight, 1);
  assert.equal(addPart(department, 'company', createNode('other', 'Other')).children.length, 2);
});
const mixed = addPart(nested, 'team', createNode('personnel', 'Personnel', 9, 'people'));
const allocated = addPart(mixed, 'personnel', createNode('operators', 'Operators', 2, 'people'));
const mixedDocument = { root: allocated, pathIds: ['company', 'department', 'team', 'personnel'] };
check('Structural whole accepts measured children with their own allocation', () => {
  assert.equal(remaining(allocated.children[0].children[0].children[0]), 7);
  assert.equal(remaining(allocated), 0);
});
check('Measured allocation rejects structural children, incompatible units and excess capacity', () => {
  assert.throws(() => addPart(mixed, 'personnel', createNode('bad', 'Structural')));
  assert.throws(() => addPart(mixed, 'personnel', createNode('bad', 'Budget', 2, 'UAH')));
  assert.throws(() => addPart(mixed, 'personnel', createNode('bad', 'Too large', 10, 'people')));
  assert.throws(() => editPart(allocated, 'personnel', 'Personnel', 1));
  assert.equal(editPart(allocated, 'personnel', 'Personnel', 20).children[0].children[0].children[0].value, 20);
});
function legacyTree(node) {
  const { mode, ...legacy } = node;
  assert.equal(mode, 'measured');
  return { ...legacy, children: node.children.map(legacyTree) };
}
check('Actual v1 migrates every node to measured and preserves path, IDs and values', () => {
  const pathIds = ['root', 'a', 'nested'];
  const migrated = decodeCollection(JSON.stringify({ version: 1, root: legacyTree(root), pathIds }));
  assert.deepEqual(migrated, { documents: [{ root, pathIds }], activeId: 'root' });
  assert.equal(JSON.parse(encodeCollection(migrated)).version, 3);
});
check('Actual v2 migrates multiple measured trees and preserves active selection', () => {
  const documents = [{ root: legacyTree(root), pathIds: ['root', 'a'] }, { root: legacyTree(node('second', 50)), pathIds: ['second'] }];
  const migrated = decodeCollection(JSON.stringify({ version: 2, documents, activeId: 'second' }));
  assert.deepEqual(migrated.documents[0].root, root);
  assert.deepEqual(migrated.documents[0].pathIds, ['root', 'a']);
  assert.equal(migrated.activeId, 'second');
  assert.deepEqual(decodeCollection(encodeCollection(migrated)), migrated);
});
const mixedCollection = putDocument(emptyCollection, mixedDocument);
check('v3 mixed document and collection roundtrip preserve arbitrary units and navigation', () => {
  assert.equal(JSON.parse(encodeDocument(mixedDocument)).version, 3);
  assert.deepEqual(decodeDocument(encodeDocument(mixedDocument)), mixedDocument);
  assert.deepEqual(decodeCollection(encodeCollection(mixedCollection)), mixedCollection);
  const arbitrary = createNode('custom', 'Custom', 5, 'widgets/day');
  assert.equal(decodeDocument(encodeDocument({ root: arbitrary, pathIds: ['custom'] })).root.unit, 'widgets/day');
});
check('Mixed import/export and duplication regenerate every ID without altering modes', () => {
  let index = 0;
  const imported = appendImported(mixedCollection, decodeCollection(encodeCollection(mixedCollection)), () => 'mixed-' + ++index);
  assert.deepEqual(imported.documents[0], mixedDocument);
  const copy = imported.documents[1].root;
  const ids = node => [node.id, ...node.children.flatMap(ids)];
  assert.equal(new Set(ids(copy)).size, ids(copy).length);
  assert.ok(ids(copy).every(id => !ids(allocated).includes(id)));
  assert.equal(copy.mode, 'structural');
  assert.equal(copy.children[0].children[0].children[0].mode, 'measured');
  assert.deepEqual(decodeCollection(encodeCollection(imported)), imported);
});
check('Delete structural subtree and repair mixed navigation path', () => {
  const deleted = deletePart(allocated, 'department');
  assert.equal(deleted.children.length, 0);
  assert.equal(allocated.children.length, 1);
  assert.deepEqual(normalizeDocument({ root: deleted, pathIds: mixedDocument.pathIds }).pathIds, ['company']);
  assert.deepEqual(normalizeDocument({ root: allocated, pathIds: ['company', 'department', 'missing'] }).pathIds, ['company', 'department']);
});
check('Structural name edits preserve mode, weight and descendants through undo/redo', () => {
  const renamed = editPart(allocated, 'team', 'New team');
  assert.equal(renamed.children[0].children[0].name, 'New team');
  assert.equal(renamed.children[0].children[0].weight, 1);
  let state = documentReducer(initialState, { type: 'load', collection: mixedCollection });
  state = documentReducer(state, { type: 'change', document: { ...mixedDocument, root: renamed }, notice: '' });
  state = documentReducer(state, { type: 'undo' });
  assert.deepEqual(state.document, mixedDocument);
  state = documentReducer(state, { type: 'redo' });
  assert.deepEqual(state.document.root, renamed);
});
check('v3 validation rejects invalid modes, weights, measured structure, IDs and depth limits', () => {
  const wrap = root => JSON.stringify({ version: 3, root, pathIds: [root.id] });
  for (const weight of [0, -1, null, '1']) assert.throws(() => decodeDocument(wrap({ ...structural, weight })));
  assert.throws(() => decodeDocument(wrap({ ...structural, mode: 'unknown' })));
  assert.throws(() => decodeDocument(wrap({ ...root, children: [structural] })));
  assert.throws(() => addPart(structural, 'company', structural));
  let deep = createNode('deep-41', 'Deep');
  for (let depth = 40; depth >= 0; depth--) deep = { ...createNode('deep-' + depth, 'Deep'), children: [deep] };
  assert.throws(() => decodeDocument(wrap(deep)));
});
const { getNodeColor, NODE_COLORS } = await import(new URL('node-color.mjs', temp));
check('Explicit color persists for measured and structural nodes through v3 backup/import', () => {
  const colored = createNode('colored', 'Colored', undefined, '', '#277b72');
  const child = createNode('budget-color', 'Budget', 100, 'UAH', '#555ab5');
  const mixedColors = addPart(colored, colored.id, child);
  const collection = putDocument(emptyCollection, { root: mixedColors, pathIds: [colored.id, child.id] });
  assert.deepEqual(decodeCollection(encodeCollection(collection)), collection);
  assert.equal(JSON.parse(encodeCollection(collection)).version, 3);
  let i = 0;
  const copy = cloneDocument(collection.documents[0], () => 'color-copy-' + ++i);
  assert.equal(copy.root.color, colored.color);
  assert.equal(copy.root.children[0].color, child.color);
  assert.equal(getNodeColor(copy.root), getNodeColor(colored));
});
check('Color edits preserve children and capacity; Automatic removes explicit color', () => {
  const colored = editPart(root, 'a', 'A', 60, '#347b5c');
  assert.equal(colored.children[0].color, '#347b5c');
  assert.deepEqual(colored.children[0].children, root.children[0].children);
  assert.equal(remaining(colored), remaining(root));
  assert.equal(editPart(colored, 'a', 'Renamed', 60).children[0].color, '#347b5c');
  assert.equal(editPart(colored, 'a', 'A', 60, null).children[0].color, undefined);
  assert.throws(() => editPart(root, 'a', 'A', 101, '#347b5c'));
});
check('Undo and redo include color changes', () => {
  const document = { root: structural, pathIds: [structural.id] };
  const colored = editPart(structural, structural.id, structural.name, undefined, '#a14e56');
  let state = documentReducer(initialState, { type: 'load', document });
  state = documentReducer(state, { type: 'change', document: { ...document, root: colored }, notice: '' });
  assert.equal(documentReducer(state, { type: 'undo' }).document.root.color, undefined);
  state = documentReducer(documentReducer(state, { type: 'undo' }), { type: 'redo' });
  assert.equal(state.document.root.color, '#a14e56');
});
check('Legacy colors remain deterministic; invalid appearance is rejected', () => {
  assert.equal(getNodeColor(root), getNodeColor({ id: root.id }));
  assert.ok(NODE_COLORS.some(color => color.value === getNodeColor(root)));
  for (const color of ['red', 'url(example)', '#ffffff', null]) {
    assert.throws(() => decodeDocument(JSON.stringify({ version: 3, root: { ...root, color }, pathIds: [root.id] })));
  }
  assert.equal(decodeDocument(encodeDocument({ root, pathIds: [root.id] })).root.color, undefined);
});
const { getNodeIcon } = await import(new URL('node-icon.mjs', temp));
check('Icons and colors survive mixed-tree export/import and duplication', () => {
  const colored = createNode('icons', 'Team', undefined, '', '#277b72', 'people');
  const budget = createNode('icon-budget', 'Budget', 100, 'UAH', '#555ab5', 'money');
  const tree = addPart(colored, colored.id, budget);
  const collection = putDocument(emptyCollection, { root: tree, pathIds: [tree.id, budget.id] });
  assert.deepEqual(decodeCollection(encodeCollection(collection)), collection);
  let i = 0;
  const copy = cloneDocument(collection.documents[0], () => 'icon-copy-' + ++i);
  assert.equal(copy.root.icon, 'people');
  assert.equal(copy.root.children[0].icon, 'money');
  assert.equal(copy.root.color, '#277b72');
  assert.equal(getNodeIcon(root), 'resource');
});
check('Icon edits and reset preserve values, colors and descendants with undo/redo', () => {
  const colored = createNode('icon-edit', 'Hours', 24, 'h', '#555ab5', 'clock');
  const tree = addPart(colored, colored.id, createNode('work-hours', 'Work', 8, 'h'));
  const changed = editPart(tree, tree.id, tree.name, tree.value, undefined, 'target');
  assert.equal(changed.icon, 'target');
  assert.equal(changed.color, tree.color);
  assert.deepEqual(changed.children, tree.children);
  assert.equal(remaining(changed), remaining(tree));
  assert.equal(editPart(changed, changed.id, 'Rename', 24).icon, 'target');
  assert.equal(editPart(changed, changed.id, changed.name, 24, undefined, null).icon, undefined);
  let state = documentReducer(initialState, { type: 'load', document: { root: tree, pathIds: [tree.id] } });
  state = documentReducer(state, { type: 'change', document: { root: changed, pathIds: [tree.id] }, notice: '' });
  const undo = documentReducer(state, { type: 'undo' });
  assert.equal(undo.document.root.icon, 'clock');
  assert.equal(documentReducer(undo, { type: 'redo' }).document.root.icon, 'target');
});
check('Invalid icon metadata is rejected; older trees keep the standard icon', () => {
  for (const icon of ['unknown', '<svg>', '', null, 7]) {
    assert.throws(() => decodeDocument(JSON.stringify({ version: 3, root: { ...root, icon }, pathIds: [root.id] })));
  }
  assert.equal(getNodeIcon(decodeDocument(encodeDocument({ root, pathIds: [root.id] })).root), 'resource');
});
const { decodePreferences } = await import(new URL('i18n.mjs', temp));
check('Structure view preference remains compatible with older language/theme settings', () => {
  assert.deepEqual(decodePreferences('{"language":"en","theme":"light"}'), { language: 'en', theme: 'light', structureView: 'cards' });
  assert.deepEqual(decodePreferences('{"language":"uk","theme":"system","structureView":"list"}'), { language: 'uk', theme: 'system', structureView: 'list' });
  assert.equal(decodePreferences('{"structureView":"invalid"}').structureView, 'cards');
  assert.equal(decodePreferences(null).structureView, 'cards');
});
console.log(tested + ' core scenarios passed');
await import('./pwa.mjs');
await import('./pwa-build-output.mjs');
