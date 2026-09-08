'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export default function PageAssistant(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!document.getElementById('mbai-assistant-module')){const script=document.createElement('script');script.id='mbai-assistant-module';script.type='module';script.src='/assistant/widget.mjs';document.head.append(script);}
    const assistant=document.createElement('mbai-assistant');document.body.append(assistant);
    return ()=>assistant.remove();
  },[pathname]);
  return null;
}
