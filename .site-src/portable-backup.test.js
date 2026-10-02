'use strict';const assert=require('node:assert/strict'),B=require('./portable-backup.js');
class Store{constructor(data={}){this.data={...data}}get length(){return Object.keys(this.data).length}key(i){return Object.keys(this.data)[i]}getItem(k){return k in this.data?this.data[k]:null}setItem(k,v){this.data[k]=String(v)}removeItem(k){delete this.data[k]}}
const source=new Store({'oa-map':'{}','unrelated':'secret'}),bundle=B.create(source,{appVersion:'test'});assert.deepEqual(Object.keys(bundle.records),['oa-map']);
const target=new Store();assert.equal(B.restore(target,bundle).restored,1);assert.equal(target.getItem('oa-map'),'{}');
assert.throws(()=>B.restore(target,bundle),/Conflito/);assert.equal(B.erase(target).erased,1);
assert.throws(()=>B.validate({...bundle,records:{evil:'x'}}),/não permitido/);
console.log('Portable backup: scoped export, atomic restore and erase OK');
