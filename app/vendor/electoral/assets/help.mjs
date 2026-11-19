// Local search only: the help remains readable without this enhancement.
export function initializeHelp(doc=document){
 const root=doc.getElementById('help'),input=doc.getElementById('help-search'),status=doc.getElementById('help-search-status');
 if(!root||!input||!status)return;
 const chapters=[...root.querySelectorAll('.help-chapter')],entries=[...root.querySelectorAll('.help-entry')];
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const text=new Map(entries.map(entry=>[entry,normalize(entry.textContent)]));let previous=null;
 function filter(){
  const words=normalize(input.value.trim()).split(/\s+/).filter(Boolean);
  if(words.length&&!previous)previous=chapters.map(chapter=>chapter.open);
  let count=0;for(const entry of entries){entry.hidden=words.length>0&&!words.every(word=>text.get(entry).includes(word));if(!entry.hidden)count++;}
  chapters.forEach((chapter,i)=>{chapter.hidden=words.length>0&&![...chapter.querySelectorAll('.help-entry')].some(entry=>!entry.hidden);if(words.length)chapter.open=!chapter.hidden;else if(previous)chapter.open=previous[i];});
  if(!words.length)previous=null;
  status.textContent=words.length?`${count} apartados encontrados. Borra la búsqueda para volver a la guía completa.`:'Guía completa. Los ejemplos con letras A, B y C son inventados.';
 }
 input.addEventListener('input',filter);
 doc.getElementById('help-clear-search')?.addEventListener('click',()=>{input.value='';filter();input.focus();});
 root.querySelectorAll('.help-index a').forEach(link=>link.addEventListener('click',event=>{
  // A deployed <base> can differ from the canonical URL by its trailing slash.
  // Keep this navigation in the current document instead of reloading it.
  event.preventDefault();input.value='';filter();const target=doc.getElementById(link.getAttribute('href').slice(1));
  if(target?.matches('.help-chapter')){target.open=true;target.querySelector('summary')?.focus({preventScroll:true});target.scrollIntoView?.({block:'start'});}
 }));
 filter();
}
