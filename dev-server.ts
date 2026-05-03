const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    if (path === '/') path = '/index.html';
    
    const filePath = `./public${path}`;
    const file = Bun.file(filePath);
    
    if (await file.exists()) {
      const headers = new Headers();
      if (path.endsWith('.css')) headers.set('Content-Type', 'text/css');
      if (path.endsWith('.js')) headers.set('Content-Type', 'application/javascript');
      if (path.endsWith('.html')) headers.set('Content-Type', 'text/html');
      return new Response(file, { headers });
    }
    
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`IDP Presentation dev server running at http://localhost:${server.port}`);
