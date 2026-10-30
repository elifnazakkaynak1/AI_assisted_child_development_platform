// bu modül hangi portun dinlenceğini ve uygulamanın hangi portta 
// çalışacağını belirler.

const app = require('./app'); // app.js içeri alıyoruz

const PORT = process.env.PORT || 3000; // .env dosyasında tanımlı PORT varsa onu kullan, yoksa 3000 portunu kullan

app.listen(PORT, () => { // app.js içindeki express uygulamasını belirtilen PORT üzerinde dinlemeye başlıyoruz.
  console.log(`Backend running on http://localhost:${PORT}`);
});