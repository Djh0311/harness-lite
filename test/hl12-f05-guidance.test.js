'use strict';

const assert = require('assert/strict');
const test = require('node:test');
const guidance = require('../lib/guidance.js');

function chain(overrides = {}) {
  return { leaf: {
    goal: 'F05-USER-GOAL-BEGIN 结果必须完整 F05-USER-GOAL-END',
    completionStandards: ['F05-STANDARD-BEGIN', 'F05-STANDARD-MIDDLE', 'F05-STANDARD-END'],
    authorityDesign: ['F05-DESIGN-BEGIN', 'F05-DESIGN-END'],
    facts: ['F05-FACT-BEGIN', 'F05-FACT-END'],
    workUnits: [{ id: 'F05-A', completionStandards: ['A'], dependencies: [] }],
    ...overrides,
  } };
}

test('F05 supports all nine events and exposes one decision only', () => {
  const events = guidance.INTENTS;
  assert.equal(events.length, 9);
  for (const event of events) {
    const selected = guidance.select(chain(), { state: { live: true }, summary: {} }, { intent: event });
    assert.equal(selected.decisionEvent, event);
    assert.equal(typeof selected.focus, 'string');
    assert.equal(typeof selected.decisionQuestion, 'string');
    assert.equal(typeof selected.nextAction, 'string');
    assert.equal(Object.hasOwn(selected, 'decision'), true);
    if (event !== 'push-attempt') assert.deepEqual(selected.hardBoundaries, []);
  }
});

test('F05 event order is canonical and multi-event input still yields one highest-priority decision', () => {
  const view = { state: { live: true }, summary: { active: ['F05-A'], reported: ['F05-B'], runnable: ['F05-A'], recovery: { failureCount: 1 } } };
  const a = guidance.select(chain(), view, { events: ['agent-reported', 'pre-dispatch', 'agent-active', 'problem-recovery'] });
  const b = guidance.select(chain(), view, { events: ['problem-recovery', 'agent-active', 'pre-dispatch', 'agent-reported'] });
  assert.deepEqual(a, b);
  assert.equal(a.decisionEvent, 'problem-recovery');
  assert.equal(a.focus.includes('换掉'), true);
  assert.equal(a.stateFacts.some((item) => item.includes('runnable=')), false);
  assert.equal(Object.hasOwn(a, 'capabilities'), false);
  assert.equal(Object.hasOwn(a, 'heartbeat'), false);
});

test('F05 completion carrier preserves goal, all standards, design, facts and sentinels', () => {
  const selected = guidance.select(chain(), { state: { live: false }, summary: {} });
  const carrier = selected.completionCarrier;
  assert.equal(carrier.complete, true);
  assert.equal(carrier.truncated, false);
  assert.equal(carrier.goal, chain().leaf.goal);
  assert.deepEqual(carrier.completionStandards, chain().leaf.completionStandards);
  assert.deepEqual(carrier.authorityDesign, chain().leaf.authorityDesign);
  assert.deepEqual(carrier.facts, chain().leaf.facts);
  assert.equal(carrier.sentinel.start, 'F05-STANDARD-BEGIN');
  assert.equal(carrier.sentinel.end, 'F05-STANDARD-END');
  assert.equal(carrier.sentinel.count, 3);
  const pressured = guidance.completionCarrier(chain(), { maxChars: 10, ref: 'docs/harness/carrier.json' });
  assert.equal(pressured.complete, false);
  assert.equal(pressured.truncated, true);
  assert.equal(pressured.carrier, 'external-required');
  assert.equal(pressured.ref, 'docs/harness/carrier.json');
  assert.deepEqual(pressured.completionStandards, chain().leaf.completionStandards);
  assert.equal(pressured.sentinel.end, 'F05-STANDARD-END');
  const spaced = chain({ goal: '  goal with spaces  ', completionStandards: ['  first  ', 'last  '] });
  const spacedCarrier = guidance.completionCarrier(spaced);
  assert.equal(spacedCarrier.goal, '  goal with spaces  ');
  assert.deepEqual(spacedCarrier.completionStandards, ['  first  ', 'last  ']);
  const exact = guidance.completionCarrier(chain());
  assert.equal(JSON.stringify(exact).length, exact.serializedChars);
  assert.equal(guidance.completionCarrier(chain(), { maxChars: exact.serializedChars }).truncated, false);
  assert.equal(guidance.completionCarrier(chain(), { maxChars: exact.serializedChars - 1 }).truncated, true);
});

test('F05 keeps push explanation out of ordinary guidance and does not add confirmation', () => {
  const ordinary = guidance.select(chain(), { state: { live: false }, summary: {} });
  assert.equal(ordinary.events.includes('push-attempt'), false);
  assert.equal(ordinary.text.includes('push'), false);
  assert.deepEqual(ordinary.hardBoundaries, []);
  const push = guidance.select(chain(), { state: { live: false }, summary: {} }, {
    intent: 'push-attempt', pushGate: {
      action: '推送提交', target: '当前项目的 origin/main', boundary: '必须有本次用户授权',
      risk: '会改变远端历史', userDecision: '是否允许这一次推送？',
    },
  });
  assert.equal(push.decisionEvent, 'push-attempt');
  assert.equal(push.decision.pushGate.action, '推送提交');
  assert.equal(push.decision.pushGate.target.includes('origin/main'), true);
  assert.equal(push.text.includes('会改变远端历史'), true);
});

test('F05 real push gate carries exact target and local scope in the primary decision', () => {
  const target = 'origin/main';
  const result = guidance.select(chain(), {}, {
    gate: {
      action: 'git push', target, boundary: '本次用户授权',
      risk: '不可逆远端变更', userDecision: '是否允许这一次 push？',
    },
  });
  assert.equal(result.decisionEvent, 'push-attempt');
  for (const field of ['focus', 'decisionQuestion', 'nextAction']) assert.equal(result.decision[field].includes(target), true, field);
  assert.equal(result.decision.nextAction.includes('不暂停全局'), true);
  assert.equal(result.text.includes(target), true);
});

test('F05 malformed state is deterministic UNKNOWN rather than a crash', () => {
  const a = guidance.select(null, { summary: { runnable: 'bad', active: {}, reported: null } }, null);
  const b = guidance.select(undefined, { summary: { runnable: 'bad', active: {}, reported: null } }, { events: {} });
  assert.equal(a.decisionEvent, null);
  assert.equal(a.completionCarrier.complete, false);
  assert.equal(a.completionCarrier.goal, guidance.UNKNOWN);
  assert.deepEqual(a.events, []);
  assert.deepEqual(b.events, []);
  assert.equal(b.decisionEvent, null);
});

test('F05 hostile malformed fields fail closed without throwing', () => {
  const cyclic = {}; cyclic.self = cyclic;
  const malformedView = { state: { live: true }, summary: { accepted: {}, runnable: 7, active: {}, reported: null, recovery: cyclic } };
  const result = guidance.select({ leaf: { goal: 'ok', completionStandards: ['ok'], authorityDesign: [cyclic], facts: [1], workUnits: [{ id: 'A' }] } }, malformedView, { events: [{}] });
  assert.equal(result.decisionEvent, null);
  assert.equal(result.completionCarrier.complete, true);
  assert.deepEqual(result.completionCarrier.authorityDesign, [guidance.UNKNOWN]);
  assert.deepEqual(result.completionCarrier.facts, [guidance.UNKNOWN]);
  assert.equal(result.completionCarrier.digest.startsWith('sha256:'), true);
  assert.doesNotThrow(() => guidance.select({ leaf: { goal: 'ok', completionStandards: ['ok'], authorityDesign: [cyclic], facts: [1] } }, malformedView));
});

test('F05 incomplete push gate is physically absent', () => {
  const result = guidance.select(chain(), {}, { intent: 'push-attempt', gate: { action: 'push', target: 'origin' } });
  assert.equal(Object.hasOwn(result.decision, 'pushGate'), false);
  assert.deepEqual(result.hardBoundaries, []);
  assert.equal(result.text.includes('拦截说明'), false);
});

test('F05 complete push gate alone activates push-attempt', () => {
  const gate = { action: '推送提交', target: 'origin/main', boundary: '用户授权', risk: '改变远端历史', userDecision: '是否允许？' };
  const result = guidance.select(chain(), {}, { gate });
  assert.equal(result.decisionEvent, 'push-attempt');
  assert.equal(result.events.includes('push-attempt'), true);
  assert.deepEqual(result.decision.pushGate, gate);
  assert.equal(result.text.includes('改变远端历史'), true);
});

test('F05 mixed UNKNOWN completion standards are not treated as dispatch-ready', () => {
  const selected = guidance.select(chain({ completionStandards: ['known', guidance.UNKNOWN] }), { state: { live: false }, summary: {} });
  assert.equal(selected.events.includes('leaf-definition'), true);
  assert.equal(selected.decisionEvent, 'leaf-definition');
  assert.equal(selected.completionCarrier.complete, false);
});
