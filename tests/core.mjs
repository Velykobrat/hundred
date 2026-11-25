import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const temp = new URL('./.cache/', import.meta.url);
mkdirSync(temp, { recursive: true });
for (const name of ['id', 'search', 'i18n', 'backup-reminder', 'node-icon', 'node-color', 'node-mode', 'tree', 'document', 'history', 'treemap', 'collection', 'collection-storage', 'percentage']) {
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
  const js = stripTypeScriptTypes(source).replace(/from "\.\/(node-icon|node-color|node-mode|tree|document|collection|percentage)"/g, 'from "./$1.mjs"');
  writeFileSync(new URL(`${name}.mjs`, temp), js);
}
const { createNode, addPart, parseValue, remaining, sumValues, editPart, deletePart, decodeDocument, encodeDocument, normalizeDocument } = await import(new URL('document.mjs', temp));
const { documentReducer, initialState } = await import(new URL('history.mjs', temp));
const { createTreemap } = await import(new URL('treemap.mjs', temp));
const { decodeCollection, encodeCollection, emptyCollection, cloneDocument, putDocument, appendImported } = await import(new URL('collection.mjs', temp));
const { moveWhole } = await import(new URL('collection.mjs', temp));
const { decodeStoredCollection, writeCollection, InvalidStoredCollection } = await import(new URL('collection-storage.mjs', temp));
const { parsePercent, percentToValue, valueToPercent } = await import(new URL('percentage.mjs', temp));
const { createId } = await import(new URL('id.mjs', temp));
const { updateNodeById, movePartTo } = await import(new URL('tree.mjs', temp));
const node = (id, value, children = []) => ({ mode: 'measured', id, name: id, value, unit: 'грн', children });
const root = node('root', 100, [node('a', 60, [node('nested', 25)]), node('b', 30)]);
let tested = 0;
function check(name, callback) { callback(); tested++; console.log(`PASS ${name}`); }
check('Whole reorder preserves content, active selection, backups, imports and history', () => {
  const documents = ['A', 'B', 'C'].map(id => ({ root: createNode(id, id), pathIds: [id] }));
  const original = { documents, activeId: 'B' };
  const reordered = moveWhole(original, 'C', 0);
  assert.deepEqual(reordered.documents.map(item => item.root.id), ['C', 'A', 'B']);
  assert.equal(reordered.activeId, 'B');
  assert.deepEqual(reordered.documents, [documents[2], documents[0], documents[1]]);
  assert.deepEqual(decodeCollection(encodeCollection(reordered)), reordered);
  assert.equal(moveWhole(original, 'missing', 0), original);
  assert.equal(moveWhole(original, 'A', 9), original);
  let id = 0;
  const imported = appendImported(emptyCollection, reordered, () => `import-${++id}`);
  assert.deepEqual(imported.documents.map(item => item.root.name), ['C', 'A', 'B']);
  let state = documentReducer(initialState, { type: 'load', collection: original });
  state = documentReducer(state, { type: 'reorder-whole', id: 'C', target: 0, notice: '' });
  assert.deepEqual(state.collection, reordered);
  state = documentReducer(state, { type: 'undo' });
  assert.deepEqual(state.collection, original);
  state = documentReducer(state, { type: 'redo' });
  assert.deepEqual(state.collection, reordered);
});
check('Lock state remains compatible with legacy data, backups, imports and copies', () => {
  const legacy = decodeDocument(encodeDocument({ root, pathIds: ['root'] }));
  assert.equal(Boolean(legacy.root.children[0].locked), false);
  const locked = updateNodeById(root, 'a', n => ({ ...n, locked: true }));
  const collection = putDocument(emptyCollection, { root: locked, pathIds: ['root'] });
  const decoded = decodeCollection(encodeCollection(collection));
  assert.equal(decoded.documents[0].root.children[0].locked, true);
  let id = 0;
  const copy = cloneDocument(decoded.documents[0], () => `copy-${++id}`);
  assert.equal(copy.root.children[0].locked, true);
  const imported = appendImported(emptyCollection, decoded, () => `import-${++id}`);
  assert.equal(imported.documents[0].root.children[0].locked, true);
  const unlocked = updateNodeById(locked, 'a', n => ({ ...n, locked: false }));
  assert.equal(decodeDocument(encodeDocument({ root: unlocked, pathIds: ['root'] })).root.children[0].locked, false);
  const invalid = updateNodeById(root, 'a', n => ({ ...n, locked: 'yes' }));
  assert.throws(() => decodeDocument(encodeDocument({ root: invalid, pathIds: ['root'] })));
});
check('Lock changes support undo and redo; moving a locked part preserves its subtree', () => {
  const document = { root, pathIds: ['root'] };
  const locked = updateNodeById(root, 'a', n => ({ ...n, locked: true }));
  let state = documentReducer(initialState, { type: 'load', document });
  state = documentReducer(state, { type: 'change', document: { ...document, root: locked }, notice: '' });
  assert.equal(state.document.root.children[0].locked, true);
  state = documentReducer(state, { type: 'undo' });
  assert.equal(Boolean(state.document.root.children[0].locked), false);
  state = documentReducer(state, { type: 'redo' });
  assert.equal(state.document.root.children[0].locked, true);
  const moved = movePartTo(locked, 'a', 1);
  assert.deepEqual(moved.children.map(child => child.id), ['b', 'a']);
  assert.deepEqual(moved.children[1], locked.children[0]);
  assert.equal(movePartTo(locked, 'a', 9), locked);
});
check('ID generation uses randomUUID when available', () => {
  const original = globalThis.crypto;
  try {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID: () => 'native-id', getRandomValues: () => assert.fail('unexpected fallback') } });
    assert.equal(createId(), 'native-id');
  } finally { Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original }); }
});
check('ID fallback uses secure random bytes and generates distinct UUID v4 values', () => {
  const original = globalThis.crypto;
  let calls = 0;
  try {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: bytes => { calls++; original.getRandomValues(bytes); return bytes; } } });
    const values = Array.from({ length: 100 }, createId);
    assert.equal(calls, 100);
    assert.equal(new Set(values).size, values.length);
    for (const value of values) assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally { Object.defineProperty(globalThis, 'crypto', { configurable: true, value: original }); }
});
check('Legacy v3 and revision-bearing backups remain compatible', () => {
  const collection = putDocument(emptyCollection, { root, pathIds: ['root'] });
  const legacy = encodeCollection(collection);
  assert.deepEqual(decodeStoredCollection(legacy), { collection, revision: null });
  const revised = JSON.stringify({ ...JSON.parse(legacy), revision: 'revision-1' });
  assert.deepEqual(decodeStoredCollection(revised), { collection, revision: 'revision-1' });
  assert.deepEqual(decodeCollection(revised), collection);
  assert.equal(JSON.parse(encodeCollection(collection)).revision, undefined);
});
check('Stale write reloads newer collection and can write after reloading', () => {
  let raw = null;
  const storage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
  const a = putDocument(emptyCollection, { root, pathIds: ['root'] });
  const first = writeCollection(storage, null, a, () => 'r1');
  assert.equal(first.kind, 'saved');
  const oldRaw = raw;
  const b = putDocument(a, { root: createNode('team', 'Team'), pathIds: ['team'] });
  const second = writeCollection(storage, oldRaw, b, () => 'r2');
  assert.equal(second.kind, 'saved');
  const latest = raw;
  const conflict = writeCollection(storage, oldRaw, a, () => 'should-not-write');
  assert.equal(conflict.kind, 'conflict');
  assert.equal(conflict.stored.revision, 'r2');
  assert.deepEqual(conflict.stored.collection, b);
  assert.equal(raw, latest);
  assert.equal(writeCollection(storage, latest, b, () => 'r3').kind, 'saved');
  assert.equal(decodeStoredCollection(raw).revision, 'r3');
});
check('Malformed external data and storage failures never overwrite data', () => {
  let raw = '{broken';
  const storage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
  assert.throws(() => writeCollection(storage, null, emptyCollection, () => 'r'), InvalidStoredCollection);
  assert.equal(raw, '{broken');
  assert.throws(() => decodeStoredCollection(JSON.stringify({ version: 3, documents: [], activeId: null, revision: 7 })), InvalidStoredCollection);
  assert.throws(() => writeCollection({ getItem() { throw Error('read'); }, setItem() {} }, null, emptyCollection, () => 'r'), /read/);
  assert.throws(() => writeCollection({ getItem() { return null; }, setItem() { throw Error('write'); } }, null, emptyCollection, () => 'r'), /write/);
});
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
const { movePart } = await import(new URL('tree.mjs', temp));
check('Reorder measured siblings without changing allocation, IDs or descendants', () => {
  const reordered = movePart(root, 'a', 'down');
  assert.deepEqual(reordered.children.map(child => child.id), ['b', 'a']);
  assert.deepEqual(root.children.map(child => child.id), ['a', 'b']);
  assert.equal(reordered.children[1], root.children[0]);
  assert.equal(remaining(reordered), remaining(root));
  assert.deepEqual(movePart(reordered, 'a', 'up'), root);
});
check('Reorder mixed structural subtrees while preserving navigation, appearance and backups', () => {
  const extra = createNode('extra-team', 'Extra team', undefined, '', '#277b72', 'people');
  const ordered = { ...allocated, children: [...allocated.children, extra] };
  const reordered = movePart(ordered, extra.id, 'up');
  const document = { root: reordered, pathIds: mixedDocument.pathIds };
  assert.deepEqual(reordered.children.map(child => child.id), ['extra-team', 'department']);
  assert.equal(reordered.children[0].icon, 'people');
  assert.equal(reordered.children[0].color, '#277b72');
  assert.deepEqual(reordered.children[1], allocated.children[0]);
  assert.deepEqual(normalizeDocument(document).pathIds, mixedDocument.pathIds);
  const collection = putDocument(emptyCollection, document);
  assert.deepEqual(decodeCollection(encodeCollection(collection)), collection);
});
check('Reorder nested siblings and leave boundaries, missing parts and root unchanged', () => {
  const nestedOrder = node('outer', 100, [node('parent', 70, [node('first', 10), node('last', 20)]), node('other', 20)]);
  const reordered = movePart(nestedOrder, 'last', 'up');
  assert.deepEqual(reordered.children[0].children.map(child => child.id), ['last', 'first']);
  assert.deepEqual(reordered.children.map(child => child.id), ['parent', 'other']);
  assert.equal(movePart(nestedOrder, 'first', 'up'), nestedOrder);
  assert.equal(movePart(nestedOrder, 'last', 'down'), nestedOrder);
  assert.equal(movePart(nestedOrder, 'outer', 'down'), nestedOrder);
  assert.equal(movePart(nestedOrder, 'missing', 'down'), nestedOrder);
});
check('Undo and redo restore sibling order and active path', () => {
  const document = { root, pathIds: ['root', 'a', 'nested'] };
  let state = documentReducer(initialState, { type: 'load', document });
  const reordered = movePart(root, 'b', 'up');
  state = documentReducer(state, { type: 'change', document: { ...document, root: reordered }, notice: '' });
  assert.deepEqual(state.document.pathIds, document.pathIds);
  const undo = documentReducer(state, { type: 'undo' });
  assert.deepEqual(undo.document, document);
  const redo = documentReducer(undo, { type: 'redo' });
  assert.deepEqual(redo.document.root, reordered);
  assert.deepEqual(redo.document.pathIds, document.pathIds);
});
const { searchCollection, SEARCH_LIMIT } = await import(new URL('search.mjs', temp));
let searchable = createNode('search-company', 'Компанія');
searchable = addPart(searchable, searchable.id, createNode('search-team', 'Розробка'));
searchable = addPart(searchable, searchable.id, createNode('search-budget', 'Бюджет офісу', 100, 'UAH'));
searchable = addPart(searchable, 'search-budget', createNode('shared-search', 'Оренда', 40, 'UAH'));
let secondSearch = createNode('search-month', 'Місячний бюджет', 100, 'UAH');
secondSearch = addPart(secondSearch, secondSearch.id, createNode('shared-search', 'Оренда', 20, 'UAH'));
const searchFixture = putDocument(putDocument(emptyCollection, { root: searchable, pathIds: [searchable.id] }), { root: secondSearch, pathIds: [secondSearch.id] });
check('Search finds roots and nested measured/structural nodes, ignoring case and whitespace', () => {
  assert.equal(searchCollection(searchFixture, '  БЮДЖЕТ  ').total, 2);
  assert.equal(searchCollection(searchFixture, 'офісу бюджет').total, 1);
  const team = searchCollection(searchFixture, 'розроб').matches[0];
  assert.equal(team.node.mode, 'structural');
  assert.deepEqual(team.pathIds, ['search-company', 'search-team']);
  const rent = searchCollection(searchFixture, 'оренда');
  assert.equal(rent.total, 2);
  assert.deepEqual(rent.matches[0].pathIds, ['search-company', 'search-budget', 'shared-search']);
  assert.deepEqual(rent.matches[0].pathNames, ['Компанія', 'Бюджет офісу', 'Оренда']);
  assert.notEqual(rent.matches[0].rootId, rent.matches[1].rootId);
  assert.equal(searchable.children[1].children[0].name, 'Оренда');
});
check('Search handles empty/no matches, apostrophes and result limits', () => {
  assert.equal(searchCollection(searchFixture, '   ').total, 0);
  assert.equal(searchCollection(searchFixture, 'неіснуюче').total, 0);
  const family = putDocument(emptyCollection, { root: createNode('family-search', 'Сім’я'), pathIds: ['family-search'] });
  assert.equal(searchCollection(family, "сім'я").total, 1);
  const many = { ...createNode('many-search', 'Список'), children: Array.from({ length: SEARCH_LIMIT + 1 }, (_, i) => createNode('match-' + i, 'Збіг ' + i)) };
  const results = searchCollection(putDocument(emptyCollection, { root: many, pathIds: [many.id] }), 'збіг');
  assert.equal(results.total, SEARCH_LIMIT + 1);
  assert.equal(results.matches.length, SEARCH_LIMIT);
  assert.equal(results.matches[0].node.id, 'match-0');
});
check('Opening search results selects the correct whole/path atomically without adding history', () => {
  let state = documentReducer(initialState, { type: 'load', collection: searchFixture });
  const match = searchCollection(searchFixture, 'оренда').matches[0];
  const past = state.past;
  state = documentReducer(state, { type: 'open', id: match.rootId, pathIds: match.pathIds });
  assert.equal(state.document.root.id, 'search-company');
  assert.deepEqual(state.document.pathIds, match.pathIds);
  assert.equal(state.past, past);
  assert.deepEqual(decodeCollection(encodeCollection(state.collection)), state.collection);
  assert.equal(documentReducer(state, { type: 'open', id: 'missing', pathIds: [] }), state);
  const repaired = documentReducer(state, { type: 'open', id: match.rootId, pathIds: ['search-company', 'search-budget', 'deleted'] });
  assert.deepEqual(repaired.document.pathIds, ['search-company', 'search-budget']);
});
const { BACKUP_INTERVAL_MS, REMIND_LATER_MS, decodeBackupReminder, shouldRemindBackup, postponeBackupReminder, recordBackup } = await import(new URL('backup-reminder.mjs', temp));
check('Backup reminder requires a saved Whole and respects a seven-day postponement', () => {
  const now = 1_800_000_000_000;
  const initial = decodeBackupReminder(null);
  assert.equal(shouldRemindBackup(0, initial, now), false);
  assert.equal(shouldRemindBackup(1, initial, now), true);
  const later = postponeBackupReminder(initial, now);
  assert.equal(later.lastBackupAt, null);
  assert.equal(shouldRemindBackup(1, later, now + REMIND_LATER_MS - 1), false);
  assert.equal(shouldRemindBackup(1, later, now + REMIND_LATER_MS), true);
});
check('An initiated backup suppresses reminders for thirty days and survives metadata roundtrip', () => {
  const now = 1_800_000_000_000;
  const backup = recordBackup(now);
  assert.deepEqual(decodeBackupReminder(JSON.stringify(backup)), { lastBackupAt: now, remindAfter: null });
  assert.equal(shouldRemindBackup(1, backup, now + BACKUP_INTERVAL_MS - 1), false);
  assert.equal(shouldRemindBackup(1, backup, now + BACKUP_INTERVAL_MS), true);
  assert.equal(shouldRemindBackup(0, backup, now + BACKUP_INTERVAL_MS), false);
  const later = postponeBackupReminder(backup, now + BACKUP_INTERVAL_MS - REMIND_LATER_MS + 1);
  assert.equal(shouldRemindBackup(1, later, now + BACKUP_INTERVAL_MS), false);
});
check('Malformed backup reminder metadata falls back safely', () => {
  const empty = { lastBackupAt: null, remindAfter: null };
  for (const raw of ['{', 'null', '[]', '"text"', '{"lastBackupAt":-1,"remindAfter":"later"}', '{"lastBackupAt":1e100,"remindAfter":1.5}']) {
    assert.deepEqual(decodeBackupReminder(raw), empty);
    assert.equal(shouldRemindBackup(1, decodeBackupReminder(raw), 1_800_000_000_000), true);
  }
});
console.log(tested + ' core scenarios passed');
await import('./pwa.mjs');
await import('./pwa-build-output.mjs');
