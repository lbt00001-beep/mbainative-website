import {simulationGenerator} from './electoral.mjs';
self.onmessage = ({data}) => {
  try {
    const generator=simulationGenerator(data.provinces,data.options); let step;
    while(!(step=generator.next()).done) if(step.value.completed%50===0)self.postMessage({type:'progress',...step.value});
    self.postMessage({type:'result',result:step.value});
  } catch(error) { self.postMessage({type:'error',message:error.message}); }
};
