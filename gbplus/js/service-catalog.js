/**
 * GB+ 2.5.1 — catálogo inicial de serviços.
 * Dados de identificação apenas: não autenticam nem consultam plataformas externas.
 * Marcas com símbolo público verificado usam SVG local; as demais usam iniciais neutras.
 * A biblioteca não confere direito de marca, parceria ou integração.
 */
const definitions=[
 ['streaming-netflix','Netflix','streaming','subscription','NF'],
 ['streaming-hbomax','HBO Max','streaming','subscription','HM'],
 ['streaming-disney','Disney+','streaming','subscription','D+'],
 ['streaming-primevideo','Prime Video','streaming','subscription','PV'],
 ['streaming-globoplay','Globoplay','streaming','subscription','G'],
 ['streaming-appletv','Apple TV','streaming','subscription','AT'],
 ['streaming-paramount','Paramount+','streaming','subscription','P+'],
 ['streaming-crunchyroll','Crunchyroll','streaming','subscription','CR'],
 ['music-spotify','Spotify','music','subscription','SP'],
 ['music-deezer','Deezer','music','subscription','DZ'],
 ['music-applemusic','Apple Music','music','subscription','AM'],
 ['music-youtubemusic','YouTube Music','music','subscription','YM'],
 ['music-youtubepremium','YouTube Premium','music','subscription','YP'],
 ['delivery-ifood','iFood','delivery','on_demand','iF'],
 ['delivery-99food','99Food','delivery','on_demand','99'],
 ['delivery-plusdelivery','Plus Delivery','delivery','on_demand','PD'],
 ['delivery-rappi','Rappi','delivery','on_demand','RP'],
 ['delivery-aiqfome','aiqfome','delivery','on_demand','AQ'],
 ['mobility-uber','Uber','mobility','on_demand','UB'],
 ['mobility-99','99','mobility','on_demand','99'],
 ['mobility-indrive','inDrive','mobility','on_demand','iD'],
 ['digital-googleone','Google One','digital','subscription','GO'],
 ['digital-icloud','iCloud+','digital','subscription','iC'],
 ['digital-microsoft365','Microsoft 365','digital','subscription','M3'],
 ['digital-canva','Canva','digital','subscription','CV'],
 ['digital-chatgpt','ChatGPT','digital','subscription','CG'],
 ['streaming-youtube','YouTube','streaming','subscription','YT'],
 ['streaming-twitch','Twitch','streaming','subscription','TW'],
 ['music-soundcloud','SoundCloud','music','subscription','SC'],
 ['music-bandcamp','Bandcamp','music','on_demand','BC'],
 ['digital-googledrive','Google Drive','digital','subscription','GD'],
 ['digital-dropbox','Dropbox','digital','subscription','DB'],
 ['digital-slack','Slack','digital','subscription','SL'],
 ['digital-trello','Trello','digital','subscription','TR'],
 ['digital-figma','Figma','digital','subscription','FG'],
 ['digital-github','GitHub','digital','subscription','GH'],
 ['digital-discord','Discord','digital','subscription','DI'],
 ['digital-patreon','Patreon','digital','subscription','PT'],
 ['social-instagram','Instagram','social','on_demand','IG'],
 ['social-tiktok','TikTok','social','on_demand','TK'],
 ['social-whatsapp','WhatsApp','social','on_demand','WA'],
 ['social-telegram','Telegram','social','subscription','TG'],
 ['social-facebook','Facebook','social','on_demand','FB'],
 ['social-x','X','social','subscription','X'],
 ['games-steam','Steam','games','on_demand','ST'],
 ['games-playstation','PlayStation','games','subscription','PS'],
 ['games-xbox','Xbox','games','subscription','XB'],
 ['shopping-amazon','Amazon','shopping','on_demand','AM'],
 ['shopping-paypal','PayPal','shopping','on_demand','PP'],
 ['shopping-tiktokshop','TikTok Shop','shopping','on_demand','TS'],
 ['shopping-shopee','Shopee','shopping','on_demand','SH'],
 ['shopping-mercadolivre','Mercado Livre','shopping','on_demand','ML'],
 ['shopping-magalu','Magalu','shopping','on_demand','MG'],
 ['shopping-casasbahia','Casas Bahia','shopping','on_demand','CB'],
 ['shopping-temu','Temu','shopping','on_demand','TM'],
 ['shopping-shein','SHEIN','shopping','on_demand','SN']
];
export const SERVICE_GROUPS=Object.freeze({
 streaming:'Streaming e vídeo',music:'Música e conteúdo',delivery:'Delivery',
 mobility:'Mobilidade',digital:'Serviços digitais',
 social:'Redes sociais e comunicação',games:'Games e entretenimento',shopping:'Compras e pagamentos'
});
// Assets are audited, relative and committed to this repository; no CDN calls.
const LOCAL_SERVICE_LOGOS=Object.freeze({
 'digital-chatgpt':'./assets/service-icons/chatgpt.svg',
 'delivery-plusdelivery':'./assets/service-icons/plus-delivery.webp',
 'delivery-99food':'./assets/service-icons/99food.png',
 'streaming-primevideo':'./assets/service-icons/prime-video.webp',
 'streaming-disney':'./assets/service-icons/disney-plus.webp',
 'streaming-globoplay':'./assets/service-icons/globoplay.webp',
 'delivery-rappi':'./assets/service-icons/rappi.webp',
 'mobility-99':'./assets/service-icons/99.webp',
 'mobility-indrive':'./assets/service-icons/indrive.webp',
 'digital-canva':'./assets/service-icons/canva.webp'
});
// Grade 4×4 de imagens originais enviadas pelo usuário (2026-11-08).
// O atlas preserva a arte de cada marca; não existe CDN nem redesenho fictício.
// Células: [coluna, linha], índices 0..3. O logo substitui um ícone anterior,
// mas não altera o ID de nenhum lançamento existente.
export const SERVICE_SPRITE_URL='./assets/service-icons/service-brands-287.webp';
const LOCAL_SERVICE_SPRITES=Object.freeze({
 'streaming-hbomax':[0,0],
 'delivery-99food':[1,0],
 'streaming-primevideo':[2,0],
 'shopping-tiktokshop':[3,0],
 'social-whatsapp':[0,1],
 'shopping-shopee':[1,1],
 'shopping-mercadolivre':[2,1],
 'social-telegram':[3,1],
 'music-spotify':[0,2],
 'shopping-magalu':[1,2],
 'shopping-casasbahia':[2,2],
 'shopping-temu':[3,2],
 'shopping-shein':[0,3]
});
export const SERVICE_CATALOG=Object.freeze(definitions.map(([id,name,group,billingMode,fallback])=>
 Object.freeze({id,name,group,billingMode,fallback,logoPath:LOCAL_SERVICE_LOGOS[id]||null,sprite:LOCAL_SERVICE_SPRITES[id]||null,logoVerified:Boolean(LOCAL_SERVICE_LOGOS[id]||LOCAL_SERVICE_SPRITES[id])})
));
export const serviceSearchKey=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const serviceById=id=>SERVICE_CATALOG.find(s=>s.id===id)||null;
export function searchServices(query='',group='all'){
 const key=serviceSearchKey(query);
 return SERVICE_CATALOG.filter(s=>(group==='all'||s.group===group)&&(!key||
   serviceSearchKey(s.name).includes(key)||serviceSearchKey(s.id).includes(key)));
}

/**
 * A personal-expense category opens the service list only when its name
 * clearly identifies a service, subscription, streaming or an application.
 * Categories are user-editable and have random UUIDs, so never test an ID.
 * Other categories, especially income (e.g. "Prestação de serviços"),
 * must never open the service picker.
 */
export function isServiceExpenseCategory(category){
 if(!category||category.type!=='expense'||typeof category.name!=='string')return false;
 const label=category.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return /\b(servicos?|assinaturas?|streaming|aplicativos?|apps?)\b/.test(label);
}
