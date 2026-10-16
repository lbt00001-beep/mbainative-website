// Credit for the standalone exported app, independent of its React rendering.
export async function mountCredit({document, pathname, fetchRegistry}) {
  const registry = await fetchRegistry();
  const normalize = value => value.replace(/\/$/, '').replace(/\/index\.html$/, '');
  const app = registry.apps.find(app => normalize(app.route) === normalize(pathname));
  if (!app || document.querySelector('[data-app-credit]')) return;
  const footer = document.createElement('footer');
  footer.setAttribute('data-app-credit', app.id);
  footer.style.cssText = 'padding:24px 16px;text-align:center;font:14px/1.6 system-ui,sans-serif;color:#e5e7eb;background:#111827;border-top:1px solid #374151';
  footer.textContent = `By ${registry.author} with ${app.model} · versión ${app.version} · ${app.year}`;
  document.body.append(footer);
}
if (typeof window !== 'undefined') {
  const mount = () => mountCredit({document, pathname: window.location.pathname, fetchRegistry: async () => {
    const response = await fetch('/app-credits/registry.json');
    if (!response.ok) throw Error('No se pueden cargar los créditos de la aplicación.');
    return response.json();
  }}).catch(error => console.error(error.message));
  if (document.readyState === 'complete') mount();
  else window.addEventListener('load', mount, {once:true});
}
