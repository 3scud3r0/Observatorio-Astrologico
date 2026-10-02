'use strict';const assert=require('node:assert/strict'),C=require('./chart-core.js'),I=require('./interpretation-engine.js'),Q=require('./quality-gates.js');
const facts=C.createFacts({subject:{timeQuality:'unknown'},bodies:[{name:'Sol',longitude:0}]});const interpretation=I.interpret(facts);
const report=Q.evaluate({facts,interpretation});assert.equal(report.status,'pass');assert.equal(report.checks.length,8);
const bad=Q.evaluate({facts:{schema:'x'},interpretation:{findings:[]}});assert.equal(bad.status,'fail');
console.log('Quality gates: provenance, uncertainty and trace contracts OK');
