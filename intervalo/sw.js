// SW Intervalo 0.1.0: apenas instalação e escopo independente.
// Sem armazenamento de respostas autenticadas nem páginas dinâmicas.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
