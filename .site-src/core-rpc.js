(function(root){
  'use strict';
  class CoreRPC{
    constructor(url='./core-worker.js'){this.worker=new Worker(url);this.pending=new Map();this.worker.onmessage=e=>this.receive(e.data)}
    receive(message){const job=this.pending.get(message.id);if(!job)return;if(message.type==='progress'){job.progress?.(message.progress);return}this.pending.delete(message.id);message.type==='result'?job.resolve(message.result):job.reject(Object.assign(Error(message.error?.message||'Erro no Worker.'),{name:message.error?.name||'Error'}))}
    call(method,params,{signal,progress}={}){const id=crypto.randomUUID?.()||Date.now()+'-'+Math.random();return new Promise((resolve,reject)=>{const abort=()=>{this.worker.postMessage({type:'cancel',id});this.pending.delete(id);reject(new DOMException('Operação cancelada.','AbortError'))};if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true});this.pending.set(id,{resolve:value=>{signal?.removeEventListener('abort',abort);resolve(value)},reject,progress});this.worker.postMessage({type:'request',id,method,params})})}
    close(){this.worker.terminate();for(const job of this.pending.values())job.reject(Error('Worker encerrado.'));this.pending.clear()}
  }
  root.OACoreRPC=CoreRPC;
})(typeof globalThis!=='undefined'?globalThis:this);
