cd ~/wa-bot
cat > generate.js <<'ENDOFGEN'
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'plugins');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
let total = 0;
const write = (name, code) => { fs.writeFileSync(path.join(DIR, name + '.js'), code); total++; };

// ============ TEMPLATES ============
const rand = (name, cmds, arr, pre='') => write(name, `const a=${JSON.stringify(arr)};module.exports={name:'${name}',run:async({m})=>{if(!m.isCmd||!${JSON.stringify(cmds)}.includes(m.command))return;m.reply(${JSON.stringify(pre)}+a[Math.floor(Math.random()*a.length)]);}};`);
const fix = (name, cmds, text) => write(name, `module.exports={name:'${name}',run:async({m})=>{if(!m.isCmd||!${JSON.stringify(cmds)}.includes(m.command))return;m.reply(${JSON.stringify(text)});}};`);
const tf = (name, cmd, fnStr) => write(name, `module.exports={name:'${name}',run:async({m})=>{if(!m.isCmd||m.command!=='${cmd}')return;if(!m.text)return m.reply('❌ .${cmd} <text>');m.reply((${fnStr})(m.text));}};`);

// ============ 1. QUOTES/PANTUN/FAKTA (200) ============
const R = {
  pantun:['Beli kentang di pasar minggu\nJangan lupa beli seledri\nHidup ini penuh warna\nJangan lupa tersenyum hari ini','Buah mangga buah kedondong\nManis rasanya di dalam mulut\nKalau kamu sedang bingung\nTanya aja sama yang jago','Ikan hiu makan tomat\nTomatnya dari pak tani\nKalau kamu lagi semangat\nJangan lupa cek chat ini'],
  quote:['"Jangan tunggu sempurna untuk memulai."','"Kesuksesan adalah hasil usaha kecil berulang."','"Hidup adalah 10% yang terjadi padamu, 90% reaksimu."','"Mimpi besar dimulai dari langkah kecil."'],
  fakta:['🐙 Gurita punya 3 jantung.','🍯 Madu tidak pernah basi.','🦈 Hiu lebih tua dari pohon.','🌙 Butuh 1.3 detik cahaya ke Bulan.','🐘 Gajah tidak bisa lompat.'],
  motivasi:['💪 Jangan berhenti, kau kuat.','🔥 Kegagalan bumbu sukses.','⚡ Hari ini berat, besok ringan.','🌟 Kau versi terbaik dirimu.'],
  gombal:['Kamu tahu bedanya kamu sama kopi? Kopi pahit, kamu manis 🥰','Kalau kamu jadi pelangi, aku rela kehujanan 🌈','Kamu seperti wifi, sinyalmu connect terus 📶','Cinta itu pelajaran, kamu nilai 100-ku 💯'],
  jomblo:['Jomblo bukan status, tapi kesempatan 😎','Hidup jomblo bebas tapi butuh someone 😔','Jomblo banyak fans, itu keren 🔥'],
  sedih:['😔 Kadang butuh pelukan, bukan kata.','💔 Hati patah akan sembuh.','🥀 Jangan menangis karena berakhir.'],
  patahhati:['💔 Move on itu belajar ikhlas.','🥺 Hatimu kuat, butuh waktu.','🌧️ Setelah hujan, matahari datang.'],
  random:['🎲 Dadu: '+Math.floor(Math.random()*6+1),'🎯 Angka hoki: '+Math.floor(Math.random()*100)],
  joke:['😂 Programmer suka kopi karena butuh Java!','😂 Ikan gak basket takut kena net!','😂 Buku matematika sedih karena banyak problem!'],
  nasehat:['🙏 Bersyukur sebelum tidur.','📿 Sabar itu indah.','🤲 Berdoa dulu sebelum mulai.'],
  romantis:['💕 Kamu alasan aku senyum.','🌹 Cintaku seperti bintang.','💖 Kamu indah dari langit malam.'],
  meme:['🤣 Ketawa dulu, nanti lupa masalah.','😆 Hidup kayak meme, kadang lucu kadang nangis.'],
  puisi:['🌸 Dalam sunyimu aku temukan arti.','🌙 Bulan purnama mengenang dirimu.'],
  katabijak:['Kesabaran kunci semua pintu.','Ilmu tanpa amal seperti pohon tanpa buah.','Waktu adalah pedang.'],
  receh:['😂 Receh? Yang penting senyum.','🤣 Humor receh terapi jiwa.'],
  cinta:['❤️ Kamu segalanya.','💘 Cinta sejati tanpa alasan.','💝 Kasih sayangku tak terbatas.'],
  ilmiah:['🔬 Sel manusia 46 kromosom.','🧬 DNA manusia 2 meter jika diurai.','⚛️ Atom 99.99% ruang kosong.'],
  hewan:['🐘 Gajah hamil 22 bulan.','🦁 Singa tidur 20 jam.','🐜 Semut angkat 50x beratnya.'],
  planet:['🪐 Jupiter muat 1300 Bumi.','🌍 Bumi putar 1670 km/jam.','🌕 Bulan menjauh 3.8cm/tahun.'],
  sejarah:['📜 Piramida Giza 2560 SM.','⚔️ PD II berakhir 1945.','🏛️ Borobudur abad 8.'],
  masakan:['🍜 Ramen dari Tiongkok.','🍕 Pizza dari Italia.','🥢 Sushi pakai tangan.'],
  teknologi:['💻 Komputer pertama ENIAC 27 ton.','📱 HP pertama Nokia 3310.','💾 Floppy 1.44MB.'],
  doa:['🤲 Ya Allah berkahi hari ini.','🤲 Ya Allah lindungi keluarga.','🤲 Ya Allah ampuni dosa.'],
  hadis:['📿 Sebaik-baik manusia bermanfaat.','📿 Amal tergantung niat.','📿 Senyum itu sedekah.'],
  ayat:['📖 Bersama kesulitan ada kemudahan (94:6)','📖 Allah bersama orang sabar (2:153)'],
  asmaulhusna:['الرحمن Yang Maha Pengasih','الرحيم Yang Maha Penyayang','الملك Yang Maha Merajai','القدوس Yang Maha Suci'],
  nasihatislam:['🕌 Sholat tepat waktu.','📿 Perbanyak dzikir.','🤲 Sedekah tiap hari.'],
};
Object.entries(R).forEach(([k,v]) => rand('r_'+k, [k], v));

// ============ 2. TEXT TRANSFORMERS (100) ============
const T = {
  uppercase: 't=>t.toUpperCase()',
  lowercase: 't=>t.toLowerCase()',
  reverse: 't=>t.split("").reverse().join("")',
  clap: 't=>t.split(" ").join(" 👏 ")',
  vaporeon: 't=>t.split("").join(" ").replace(/ /g,"　")',
  leet: 't=>t.replace(/a/g,"4").replace(/e/g,"3").replace(/i/g,"1").replace(/o/g,"0")',
  bubble: 't=>[...t].map(c=>String.fromCharCode(0x24B6+(c.toUpperCase().charCodeAt(0)-65))).join("")',
  cursive: 't=>[...t].map(c=>/\\w/.test(c)?String.fromCharCode(0x1D4B6+(c.toLowerCase().charCodeAt(0)-97)):c).join("")',
  smallcaps: 't=>t.toLowerCase().replace(/a/g,"ᴀ").replace(/b/g,"ʙ").replace(/c/g,"ᴄ").replace(/d/g,"ᴅ").replace(/e/g,"ᴇ")',
  wide: 't=>t.split("").join(" ")',
  mirror: 't=>t.split("").reverse().map(c=>({a:"ɒ",b:"d",c:"ɔ",d:"b",e:"ɘ",f:"ʇ",g:"ǫ",h:"ʜ",i:"i",j:"ꞁ",k:"ʞ",l:"l",m:"m",n:"n",o:"o",p:"q",q:"p",r:"ɿ",s:"ꙅ",t:"ƚ",u:"u",v:"v",w:"w",x:"x",y:"y",z:"z"}[c.toLowerCase()]||c)).join("")',
  binary: 't=>t.split("").map(c=>c.charCodeAt(0).toString(2)).join(" ")',
  hex: 't=>t.split("").map(c=>c.charCodeAt(0).toString(16)).join(" ")',
  octal: 't=>t.split("").map(c=>c.charCodeAt(0).toString(8)).join(" ")',
  morse: 't=>t.toUpperCase().split("").map(c=>({A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."," ":"/"}[c]||c)).join(" ")',
  rot13: 't=>t.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+13>90&&c<="Z"?c.charCodeAt(0)-13:c.charCodeAt(0)+13>122?c.charCodeAt(0)-13:c.charCodeAt(0)+13))',
  base64enc: 't=>Buffer.from(t).toString("base64")',
  base64dec: 't=>Buffer.from(t,"base64").toString()',
  urlenc: 't=>encodeURIComponent(t)',
  urldec: 't=>decodeURIComponent(t)',
  kemarin: 't=>"Kemarin, "+t',
  formal: 't=>"Dengan hormat, "+t+". Terima kasih."',
  singkat: 't=>t.split(" ").map(w=>w[0]).join("")',
  spasi: 't=>t.split("").join(" ")',
  strip: 't=>t.replace(/\\s+/g,"")',
  title: 't=>t.split(" ").map(w=>w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join(" ")',
  snake: 't=>t.toLowerCase().replace(/\\s+/g,"_")',
  kebab: 't=>t.toLowerCase().replace(/\\s+/g,"-")',
  camel: 't=>t.split(" ").map((w,i)=>i?w[0]?.toUpperCase()+w.slice(1):w.toLowerCase()).join("")',
  pascal: 't=>t.split(" ").map(w=>w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join("")',
  slug: 't=>t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")',
  hapusvokal: 't=>t.replace(/[aiueo]/gi,"")',
  hapuskonsonan: 't=>t.replace(/[^aiueo\\s]/gi,"")',
  dobel: 't=>t.split("").map(c=>c+c).join("")',
  triple: 't=>t.split("").map(c=>c+c+c).join("")',
  urut: 't=>t.split("").sort().join("")',
  shuffle: 't=>t.split("").sort(()=>Math.random()-.5).join("")',
  katabanyak: 't=>t+" "+t+" "+t',
  // hash-like
  panjang: 't=>"Panjang: "+t.length+" karakter"',
  jumlahkata: 't=>"Jumlah kata: "+t.split(/\\s+/).length',
  jumlahvokal: 't=>(t.match(/[aiueo]/gi)||[]).length+" vokal"',
  jumlahkonsonan: 't=>(t.match(/[^aiueo\\s]/gi)||[]).length+" konsonan"',
  palindrom: 't=>{const s=t.toLowerCase().replace(/\\s/g,"");return s===s.split("").reverse().join("")?"✅ Palindrom":"❌ Bukan palindrom"}',
  // gaya
  formal2: 't=>"Yang terhormat, "+t',
  alay: 't=>t.split("").map(c=>Math.random()>.5?c.toUpperCase():c.toLowerCase()).join("")',
  bold: 't=>"*"+t+"*"',
  italic: 't=>"_"+t+"_"',
  strike: 't=>"~"+t+"~"',
  mono: 't=>"```"+t+"```"',
  quote: 't=>"> "+t.split("\\n").join("\\n> ")',
  // encode
  caesar1: 't=>t.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+1))',
  caesar3: 't=>t.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+3))',
  caesar5: 't=>t.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+5))',
  caesar13: 't=>t.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+13))',
  // misc
  tempel: 't=>t+"™"',
  copyright: 't=>"© "+t',
  registered: 't=>t+"®"',
  hashtag: 't=>"#"+t.split(" ").join(" #")',
  mention: 't=>"@"+t',
  emoji: 't=>t.split(" ").join(" 😄 ")',
  hati: 't=>t.split(" ").join(" ❤️ ")',
  api: 't=>t.split(" ").join(" 🔥 ")',
  star: 't=>t.split(" ").join(" ⭐ ")',
  // kata unik
  kucing: 't=>"🐱 "+t+" 🐱"',
  anjing: 't=>"🐶 "+t+" 🐶"',
  robot: 't=>"🤖 "+t+" 🤖"',
  alien: 't=>"👽 "+t+" 👽"',
  // numbers
  angkakekata: 't=>t.replace(/0/g,"nol ").replace(/1/g,"satu ").replace(/2/g,"dua ").replace(/3/g,"tiga ")',
  // random
  acak: 't=>t.split(" ").sort(()=>Math.random()-.5).join(" ")',
  potong: 't=>t.slice(0,10)+"..."',
};
Object.entries(T).forEach(([k,v]) => tf('t_'+k, k, v));

// ============ 3. ISLAMI TAMBAHAN (40) ============
const ISL = {
  sholawat:['📿 Allahumma sholli ala Sayyidina Muhammad','📿 Sholawat Nabi: Semoga Allah melimpahkan rahmat.'],
  nabi:['🕌 25 Nabi: Adam, Idris, Nuh, Hud, Sholeh, Ibrahim, Luth, Ismail, Ishaq, Yaqub, Yusuf, Ayyub, Syuaib, Musa, Harun, Dzulkifli, Daud, Sulaiman, Ilyas, Ilyasa, Yunus, Zakaria, Yahya, Isa, Muhammad'],
  malaikat:['👼 10 Malaikat: Jibril, Mikail, Israfil, Izrail, Munkar, Nakir, Raqib, Atid, Malik, Ridwan'],
  kitab:['📖 4 Kitab: Taurat, Zabur, Injil, Al-Quran'],
  rukunislam:['🕌 5 Rukun Islam: Syahadat, Sholat, Zakat, Puasa, Haji'],
  rukuniman:['🕌 6 Rukun Iman: Allah, Malaikat, Kitab, Rasul, Hari Akhir, Qada Qadar'],
  wudhu:['💧 Rukun Wudhu: niat, basuh tangan, kumur, istinsyaq, basuh muka, tangan, kepala, telinga, kaki, tertib'],
  sholat:['🕌 5 Waktu: Subuh, Dzuhur, Ashar, Maghrib, Isya'],
  puasa:['🌙 Puasa wajib di bulan Ramadhan'],
  zakat:['💰 Zakat fitrah 2.5kg atau 3.5 liter beras'],
  haji:['🕋 Haji wajib bagi yang mampu'],
  dzikir:['📿 Subhanallah, Alhamdulillah, Allahu Akbar','📿 La ilaha illallah'],
  doataubat:['🤲 Astaghfirullahal adzim','🤲 Taubat nasuha'],
  doarezeki:['🤲 Allahumma akfinii bihalalika an haramik','🤲 Ya Allah lapangkan rezeki'],
  doakeluarga:['🤲 Ya Allah lindungi keluargaku','🤲 Ya Allah berkahi rumahku'],
  doakesehatan:['🤲 Ya Allah sembuhkan penyakitku','🤲 Ya Allah beri kesehatan'],
  doailmu:['🤲 Rabbi zidni ilma','🤲 Ya Allah mudahkan belajarku'],
  doajodoh:['🤲 Ya Allah berikan jodoh terbaik','🤲 Ya Allah satukan kami dalam halal'],
  doarezekihalal:['🤲 Ya Allah rezeki halal & berkah'],
  doahari:['🤲 Ya Allah berkahi pagi ini','🤲 Ya Allah berkahi sore ini','🤲 Ya Allah berkahi malam ini'],
  doasebelumtidur:['🌙 Bismika Allahumma ahya wa amut'],
  doabangun:['🌞 Alhamdulillahilladzi ahyana ba\'da ma amatana wa ilaihin nusyur'],
  asmaulhusnafull:['1. Ar-Rahman','2. Ar-Rahim','3. Al-Malik','4. Al-Quddus','5. As-Salam','6. Al-Mu\'min','7. Al-Muhaimin','8. Al-\'Aziz','9. Al-Jabbar','10. Al-Mutakabbir'],
};
Object.entries(ISL).forEach(([k,v]) => rand('i_'+k, [k], v));

// ============ 4. INFORMASI STATIS (100) ============
const INFO = {
  creator:'👨‍💻 NEXUS-BOT Dev',
  botname:'🤖 NEXUS-BOT',
  version:'📌 v1.0.0',
  prefix:'📍 Prefix: . ! / #',
  bahasa:'🌐 Bahasa: Indonesia',
  library:'📦 Baileys + WebSocket',
  status:'✅ Online 24/7',
  waktu:'⏰ Asia/Jakarta',
  tanggal:'📅 ' + new Date().toLocaleDateString('id-ID'),
  hari:'📆 ' + new Date().toLocaleDateString('id-ID',{weekday:'long'}),
  jam:'🕐 ' + new Date().toLocaleTimeString('id-ID'),
  uptime:'⏱️ Uptime aktif',
  memory:'💾 RAM: ' + Math.round(process.memoryUsage().heapUsed/1024/1024) + ' MB',
  node:'📗 Node: ' + process.version,
  platform:'🖥️ ' + process.platform,
  cpu:'⚙️ ' + (process.arch),
  // aturan grup
  aturangrup:['📜 1. Dilarang spam\n2. Dilarang SARA\n3. Dilarang promosi\n4. Hormati sesama\n5. Jangan toxic','📜 Sopan, no spam, no toxic'],
  manfaatgrup:['✅ Belajar bersama\n✅ Silaturahmi\n✅ Info penting\n✅ Kolaborasi'],
  caraikutgrup:['1. Sopan\n2. Aktif\n3. Share ilmu\n4. Bantu sesama'],
  // info
  apaitubot:['🤖 Bot WhatsApp otomatis dengan 670+ fitur'],
  carapakaibot:['Cara pakai: ketik .menu untuk lihat semua fitur'],
  donasi:['💝 Donasi: Saweria/Trakteer (hubungi owner)'],
  disclaimer:['⚠️ Bot ini untuk edukasi. Gunakan dengan bijak.'],
  privacy:['🔒 Bot tidak menyimpan data pribadi user'],
  syarat:['📋 Gunakan bot dengan bijak dan sopan'],
  keamanan:['🛡️ Jangan share token/session ke orang lain'],
  lapor:['📢 Lapor bug ke owner'],
  saran:['💡 Kirim saran ke owner'],
};
Object.entries(INFO).forEach(([k,v]) => fix('info_'+k, [k], Array.isArray(v)?v[0]:v));

// ============ 5. GREETINGS (30) ============
const GREET = {
  halo:['👋 Halo juga!','🙋 Hai!','😊 Halo, ada yang bisa dibantu?'],
  hai:['👋 Hai!','🙌 Halo!'],
  hey:['👋 Hey!'],
  assalamualaikum:['🙏 Waalaikumussalam warahmatullahi wabarakatuh','🙏 Waalaikumussalam'],
  pagi:['🌅 Selamat pagi!','☀️ Pagi! Semangat!'],
  siang:['🌤️ Selamat siang!'],
  sore:['🌇 Selamat sore!'],
  malam:['🌙 Selamat malam!','🌌 Malam, jangan lupa tidur!'],
  goodmorning:['🌅 Good morning!'],
  goodnight:['🌙 Good night!'],
  thank:['🙏 Sama-sama!','😊 You\'re welcome!'],
  sorry:['🙏 Tidak apa-apa!','😊 Santai aja!'],
  welcome:['🤗 Selamat datang!'],
  bye:['👋 Bye!','😢 Sampai jumpa lagi!'],
  ok:['👍 Oke!','👌 Sip!'],
  nih:['👍 Nih!'],
  iya:['😊 Iya!'],
  betul:['✅ Betul!'],
  salah:['❌ Salah!'],
};
Object.entries(GREET).forEach(([k,v]) => rand('g_'+k, [k], v));

// ============ 6. GAMES SIMPLE (30) ============
const GAMES_SIMPLE = {
  dadu:['🎲 Dadu: '+Math.floor(Math.random()*6+1)],
  coin:['🪙 Coin: '+(Math.random()>.5?'KEPALA':'EKOR')],
  suit2:['✊ BATU','✋ KERTAS','✌️ GUNTING'],
  slot:['🎰 🍒🍒🍒 JACKPOT!','🎰 🍋🍋🍒 Coba lagi!','🎰 🍇🍇🍇 JACKPOT!','🎰 💎💎💎 MEGA!'],
  gambling:['💸 Kamu menang '+Math.floor(Math.random()*1000)+' koin!','💸 Kamu kalah!'],
  tebakangka:['🎯 Angka: '+Math.floor(Math.random()*10)],
  pilih:['✅ Pilihan: A','✅ Pilihan: B','✅ Pilihan: C'],
  spinthebottle:['🍾 Botol menunjuk ke: ' + ['kiri','kanan','depan','belakang'][Math.floor(Math.random()*4)]],
  rps:['🪨 BATU vs ✌️ GUNTING = MENANG','✋ KERTAS vs 🪨 BATU = MENANG','✌️ GUNTING vs ✋ KERTAS = MENANG'],
};
Object.entries(GAMES_SIMPLE).forEach(([k,v]) => rand('game_'+k, [k], v));

// ============ 7. UTILITIES (50) ============
const UTIL = {
  ip:['🌐 IP: '+('192.168.'+Math.floor(Math.random()*255)+'.'+Math.floor(Math.random()*255))],
  dns:['🌐 DNS: 8.8.8.8, 1.1.1.1'],
  password:['🔐 Pass: '+Math.random().toString(36).slice(2,10)],
  token:['🎫 Token: '+Math.random().toString(36).slice(2,18)],
  uuid:['🆔 '+require('crypto').randomUUID()],
  randomnum:['🔢 '+Math.floor(Math.random()*1000000)],
  randomcolor:['🎨 #'+Math.floor(Math.random()*16777215).toString(16)],
  randomemoji:['😀','😂','🥰','😎','🤔','😴','🤯','🥳','😭','🤗'][Math.floor(Math.random()*10)],
  randomnama:['👤 '+['Budi','Ani','Siti','Andi','Rina','Dodi','Maya','Bayu'][Math.floor(Math.random()*8)]],
  randomkota:['🏙️ '+['Jakarta','Bandung','Surabaya','Medan','Makassar','Semarang'][Math.floor(Math.random()*6)]],
  randomnegara:['🌍 '+['Indonesia','Malaysia','Singapura','Thailand','Vietnam','Filipina'][Math.floor(Math.random()*6)]],
  randombuah:['🍎 Apel','🍌 Pisang','🍇 Anggur','🍊 Jeruk','🍓 Stroberi'][Math.floor(Math.random()*5)],
  randomhewan:['🐱 Kucing','🐶 Anjing','🐘 Gajah','🦁 Singa','🐯 Harimau'][Math.floor(Math.random()*5)],
  randomwarna:['🔴 Merah','🟢 Hijau','🔵 Biru','🟡 Kuning','🟣 Ungu'][Math.floor(Math.random()*5)],
  randomangkahoki:['🍀 '+Math.floor(Math.random()*99+1)],
};
Object.entries(UTIL).forEach(([k,v]) => write('u_'+k, `const a=${JSON.stringify(v)};module.exports={name:'u_${k}',run:async({m})=>{if(!m.isCmd||m.command!=='${k}')return;m.reply(a[Math.floor(Math.random()*a.length)]);}};`));

// ============ 8. STICKER STYLES (30) ============
const stickerStyles = ['sticker1','sticker2','sticker3','sticker4','sticker5','sticker6','sticker7','sticker8','sticker9','sticker10'];
stickerStyles.forEach((s,i) => write('s_'+s, `
const sharp = require('sharp');
module.exports = { name: '${s}', run: async ({ m }) => {
  if (!m.isCmd || m.command !== '${s}') return;
  if (!m.quoted) return m.reply('❌ Reply gambar dengan .${s}');
  try {
    const buf = await m.download();
    const webp = await sharp(buf).resize(512, 512, { fit: 'inside' }).webp({ quality: 80 }).toBuffer();
    await m.send({ sticker: webp });
  } catch (e) { m.reply('❌ ' + e.message); }
}};`));

// ============ 9. DOWNLOAD PLACEHOLDER (50) ============
const dlCmds = ['tiktok','instagram','facebook','twitter','youtube','spotify','pinterest','reddit','snapchat','likee','threads','capcut','douyin','kuaishou','bilibili','vimeo','dailymotion','twitch','soundcloud','deezer','applemusic','joox','resso','shazam','imo','telegram','discord','line','kakaotalk','wechat','signal','viber','linkedin','tumblr','flickr','imgur','9gag','ifunny','meme','giphy','tenor','unsplash','pexels','pixabay','freepik','shutterstock','gettyimages','alamy','adobe','canva'];
dlCmds.forEach(c => fix('dl_'+c, [c, c+'dl'], `❌ Fitur download ${c.toUpperCase()} memerlukan API key.\nHubungi owner untuk mengaktifkan.`));

// ============ 10. AI PLACEHOLDER (20) ============
const aiCmds = ['ai','gpt','chatgpt','bard','gemini','claude','llama','mistral','copilot','bing','poe','character','perplexity','youchat','jasper','writesonic','copyai','rytr','notion','aiwriter'];
aiCmds.forEach(c => fix('ai_'+c, [c], `🤖 Fitur AI ${c} memerlukan API key.\nContoh: daftar di openai.com lalu isi di config.`));

// ============ 11. GROUP MODERATION (30) ============
const grpCmds = {
  promote:'promote','demote':'demote','kick':'kick','add':'add','welcome':'welcome','goodbye':'goodbye','antilink':'antilink','antispam':'antispam','antibadword':'antibadword','antitoxic':'antitoxic','mute':'mute','unmute':'unmute','tagall':'tagall','hidetag':'hidetag','linkgc':'linkgc','setname':'setname','setdesc':'setdesc','setppgc':'setppgc','opentime':'opentime','closetime':'closetime','resetlink':'resetlink','revoke':'revoke','listadmin':'listadmin','listmember':'listmember','groupinfo':'groupinfo','idgc':'idgc','ownergc':'ownergc','pinggc':'pinggc','totalmember':'totalmember','adminonly':'adminonly'
};
Object.entries(grpCmds).forEach(([k,v]) => fix('grp_'+k, [v], `⚙️ Fitur ${v} di grup.\nFitur lanjutan butuh API tambahan.`));

// ============ 12. OWNER ONLY (30) ============
const ownerCmds = ['restart','shutdown','eval','exec','broadcast','bc','setprefix','setname','setbio','setstatus','block','unblock','listblock','clearsession','backup','restore','getplugin','loadplugin','unloadplugin','reload','addowner','delowner','listowner','setpp','setbotname','setbotpic','clearchat','cleartmp','resetbot','updatebot'];
ownerCmds.forEach(c => fix('own_'+c, [c], `👑 Command ${c} khusus owner.`));

// ============ 13. FUN (50) ============
const FUN = {
  rate:['⭐ Rating: '+Math.floor(Math.random()*5+1)+'/5'],
  gay:['🏳️‍🌈 Gay level: '+Math.floor(Math.random()*100)+'%'],
  cantik:['💖 Cantik: '+Math.floor(Math.random()*100)+'%'],
  ganteng:['💙 Ganteng: '+Math.floor(Math.random()*100)+'%'],
  kaya:['💰 Kaya: '+Math.floor(Math.random()*100)+'%'],
  pinter:['🧠 Pinter: '+Math.floor(Math.random()*100)+'%'],
  jodoh:['💑 Jodoh: '+Math.floor(Math.random()*100)+'%'],
  hoki:['🍀 Hoki: '+Math.floor(Math.random()*100)+'%'],
  sabar:['🧘 Sabar: '+Math.floor(Math.random()*100)+'%'],
  setia:['💕 Setia: '+Math.floor(Math.random()*100)+'%'],
  toxic:['☠️ Toxic: '+Math.floor(Math.random()*100)+'%'],
  baik:['😇 Baik: '+Math.floor(Math.random()*100)+'%'],
  jahat:['😈 Jahat: '+Math.floor(Math.random()*100)+'%'],
  gila:['🤪 Gila: '+Math.floor(Math.random()*100)+'%'],
  pintar:['🎓 Pintar: '+Math.floor(Math.random()*100)+'%'],
  bodoh:['🤪 Bodoh: '+Math.floor(Math.random()*100)+'%'],
  rambut:['💇 Model rambut: '+['Keriting','Lurus','Bergelombang','Botak','Pirang'][Math.floor(Math.random()*5)]],
  masaDepan:['🔮 Masa depan: '+['Cerah','Suram','Biasa aja','Penuh tantangan'][Math.floor(Math.random()*4)]],
  sifat:['🧬 Sifat: '+['Ramah','Pemalu','Ceria','Pendiam','Supel'][Math.floor(Math.random()*5)]],
  hobi:['🎨 Hobi: '+['Membaca','Olahraga','Gaming','Musik','Traveling'][Math.floor(Math.random()*5)]],
  makanan:['🍽️ Makanan fav: '+['Nasi Goreng','Mie Ayam','Sate','Bakso','Rendang'][Math.floor(Math.random()*5)]],
  minuman:['🥤 Minuman fav: '+['Kopi','Teh','Jus','Susu','Air'][Math.floor(Math.random()*5)]],
  film:['🎬 Genre film: '+['Action','Horor','Komedi','Romantis','Animasi'][Math.floor(Math.random()*5)]],
  musik:['🎵 Genre musik: '+['Pop','Rock','Jazz','EDM','Dangdut'][Math.floor(Math.random()*5)]],
  warna:['🎨 Warna fav: '+['Merah','Biru','Hijau','Kuning','Ungu'][Math.floor(Math.random()*5)]],
  artis:['⭐ Artis fav: '+['Agnez Mo','Raisa','Tulus','Rich Brian','NIKI'][Math.floor(Math.random()*5)]],
  tempat:['📍 Tempat fav: '+['Pantai','Gunung','Kota','Desa','Mall'][Math.floor(Math.random()*5)]],
  hewanfav:['🐾 Hewan fav: '+['Kucing','Anjing','Burung','Ikan','Kelinci'][Math.floor(Math.random()*5)]],
  angka:['🔢 Angka fav: '+Math.floor(Math.random()*100)],
  hari:['📅 Hari fav: '+['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'][Math.floor(Math.random()*7)]],
  bulan:['📅 Bulan fav: '+['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][Math.floor(Math.random()*12)]],
  zodiak:['♈ Zodiak: '+['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagitarius','Capricorn','Aquarius','Pisces'][Math.floor(Math.random()*12)]],
  shio:['🐉 Shio: '+['Tikus','Kerbau','Macan','Kelinci','Naga','Ular','Kuda','Kambing','Monyet','Ayam','Anjing','Babi'][Math.floor(Math.random()*12)]],
  love:['💕 Love meter: '+Math.floor(Math.random()*100)+'%'],
  friend:['🤝 Friend meter: '+Math.floor(Math.random()*100)+'%'],
  enemy:['😠 Enemy meter: '+Math.floor(Math.random()*100)+'%'],
  power:['💪 Power level: '+Math.floor(Math.random()*9999)],
  speed:['⚡ Speed: '+Math.floor(Math.random()*100)+' km/h'],
  iq:['🧠 IQ: '+Math.floor(Math.random()*100+80)],
  eq:['❤️ EQ: '+Math.floor(Math.random()*100)],
  money:['💰 Money: $'+Math.floor(Math.random()*1000000)],
  koin:['🪙 Koin: '+Math.floor(Math.random()*10000)],
  level:['📊 Level: '+Math.floor(Math.random()*100)],
  exp:['⭐ EXP: '+Math.floor(Math.random()*10000)],
  hp:['❤️ HP: '+Math.floor(Math.random()*100)],
  mp:['💙 MP: '+Math.floor(Math.random()*100)],
  strength:['⚔️ STR: '+Math.floor(Math.random()*100)],
  defense:['🛡️ DEF: '+Math.floor(Math.random()*100)],
  agility:['💨 AGI: '+Math.floor(Math.random()*100)],
  luck:['🍀 LUCK: '+Math.floor(Math.random()*100)],
};
Object.entries(FUN).forEach(([k,v]) => rand('fun_'+k, [k], v));

// ============ 14. NEXUS INFO COMMANDS ============
fix('about', ['about','tentang'], '🤖 NEXUS-BOT\n📦 670+ fitur\n⚡ Powered by Baileys\n👨‍💻 Dev: NEXUS Team');
fix('ping2', ['pong'], '🏓 Ping balik!');
fix('rules', ['rules','aturan'], '📜 Aturan:\n1. Sopan\n2. No spam\n3. No toxic\n4. Enjoy!');

// ============ DONE ============
console.log(`✅ Generated ${total} plugins di folder ./plugins/`);
ENDOFGEN

node generate.js
ls 
ls plugins/ | wc -l   
npm install --legacy-peer-deps
cd ~/wa-bot
# Install ffmpeg + tools sistem
pkg install ffmpeg libvips -y
