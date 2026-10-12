/** Coalesce edits per workspace; flush synchronously before leaving the editor. */
export function createSaveQueue<T>(save:(value:T)=>void,onError:(error:unknown)=>void,clock:{set:(fn:()=>void,ms:number)=>unknown;clear:(id:unknown)=>void}={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id as ReturnType<typeof setTimeout>)}) {
  const pending=new Map<string,T>();
  let idle:unknown,deadline:unknown;
  function clear(){if(idle!==undefined)clock.clear(idle);if(deadline!==undefined)clock.clear(deadline);idle=deadline=undefined}
  function flush(){clear();for(const [key,value] of pending){try{save(value);if(pending.get(key)===value)pending.delete(key)}catch(error){onError(error)}}}
  return {
    schedule(key:string,value:T){pending.set(key,value);if(idle!==undefined)clock.clear(idle);idle=clock.set(flush,500);if(deadline===undefined)deadline=clock.set(flush,2000)},
    flush,
    dispose(){clear()},
  };
}
