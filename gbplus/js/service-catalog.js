/**
 * GB+ 2.5.1 — catálogo inicial de serviços.
 * Dados de identificação apenas: não autenticam nem consultam plataformas externas.
 * 13 marcas têm vetores locais provenientes do Simple Icons; os demais usam iniciais neutras.
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
 ['digital-chatgpt','ChatGPT','digital','subscription','CG']
];
export const SERVICE_GROUPS=Object.freeze({
 streaming:'Streaming e vídeo',music:'Música e conteúdo',delivery:'Delivery',
 mobility:'Mobilidade',digital:'Serviços digitais'
});
export const SERVICE_CATALOG=Object.freeze(definitions.map(([id,name,group,billingMode,fallback])=>
 Object.freeze({id,name,group,billingMode,fallback,logoPath:null,logoVerified:false})
));
export const serviceSearchKey=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const serviceById=id=>SERVICE_CATALOG.find(s=>s.id===id)||null;
export function searchServices(query='',group='all'){
 const key=serviceSearchKey(query);
 return SERVICE_CATALOG.filter(s=>(group==='all'||s.group===group)&&(!key||
   serviceSearchKey(s.name).includes(key)||serviceSearchKey(s.id).includes(key)));
}
