const db = require ('../db');    //veri bağlantısını içeri aldım 

function requireChildAccess(req, res, next) {

    // Kullanıcı bilgisi yoksa 401 hatası döndürür.
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied. No user information.' });
    }
  
    // İstek parametrelerinden childId'yi alır ve geçerli bir sayı olup olmadığını kontrol eder.
    const childId = Number(req.params.childId);
    if (!Number.isInteger(childId)) {
        return res.status(400).json({ error: 'Invalid child ID.' });
    }

    //Kullanıcı çocuk ise ilerler ve kendi childId'si ile eşleşiyorsa izin verir yoksa 403 hatası döndürür.
    if (req.user.role === 'child'){
        if (req.user.id === childId) {
            return next();
        } else {
            return res.status(403).json({ error: 'No permission for this action.' });
        }
    }

    // Kullanıcı parent veya specialist ise child ile ilişkisi var mı yok mu kontrol edielir.
    const relation = db.prepare(
        'SELECT * FROM relations WHERE child_id = ? AND related_user_id = ?'
    ).get(childId, req.user.id);

    // Eğer ilişki varsa kullanıcıya izin verilir aksi takdirde 403 hatası döndürülür.
    if(relation){
        return next();
    }
    else{
        return res.status(403).json({ error: 'No permission for this action.' });
    }
}

//bu fonksiyon, belirli bir çocuğa erişim izni gerektiren yerlerde kullanılabilir.
module.exports = { requireChildAccess };