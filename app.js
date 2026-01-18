

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const app = express();
var session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const cookieParser=require('cookie-parser'); 
app.use(cookieParser());

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
	maxAge: 10000
	}
	}));
const port = 6789;
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views / layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată

const fs = require('fs');

app.get('/chestionar', (req, res) => {
    console.log(req.body);
	fs.readFile('intrebari.json', (err, data) => {
		listaIntrebari = JSON.parse(data);
 // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
    res.render('chestionar', { intrebari: listaIntrebari  });
	});
});

//'use strict';

//console.log(data);
//imi creeaza un obiect din json in obiect JavaScript

app.post('/rezultat-chestionar', (req, res) => {
	console.log(req.body);
	fs.readFile('intrebari.json', (err, data) => {
		listaIntrebari = JSON.parse(data);
		
		var nrCorecte = 0;
		var index = 0;
		var i=0;
		for (index in req.body) {
			console.log(index);
				
				console.log("Req" + req.body[index]);
				//am nevoie sa extrag urmat caracter dupa q index=q0,q1,)
				i=parseInt(index.substring(1));
				console.log("i:" +i);
			if (req.body['q' + i] == listaIntrebari[i].corect) {
				nrCorecte++;
			}
		}
		console.log('Corecte:' + nrCorecte);
		
		res.render('rezultat-chestionar', { raspunsuri: nrCorecte,user1: req.session.utilizator});
	});
});

app.get('/autentificare', (req, res) => {
    res.render('autentificare',{eroare: req.cookies.mesajEroare, user1: req.session.utilizator });
});


app.get('/', (req, res) => {

	res.clearCookie('mesajEroare');
	res.render('index', { utilizator1: req.cookies.utilizator,
			user1: req.session.utilizator,produse:req.cookies.produse});		
});


app.post('/verificare-autentificare', (req, res) => {
    console.log(req.body);
    fs.readFile('utilizatori.json', (err, data) => {
        if (err) {
            console.error('Eroare la citirea fisierului utilizatori.json:', err);
            return res.status(500).send('Eroare la server');
        }

        const lista_utilizatori = JSON.parse(data);
        console.log("Lista"+lista_utilizatori);

        let autentificat = false;

        for (let i = 0; i < lista_utilizatori.length; i++) {
            if (req.body.fuser === lista_utilizatori[i].utilizator && req.body.fp === lista_utilizatori[i].parola) {
                res.cookie('utilizator', req.body.fuser);
                console.log(req.cookies.utilizator);
                req.session.user = lista_utilizatori[i].utilizator;
                req.session.utilizator = lista_utilizatori[i].utilizator;
				console.log(lista_utilizatori[i].utilizator);

                req.session.parola= lista_utilizatori[i].parola;
                
                res.redirect('/');
                autentificat = true;
                break; // Ieșiți din buclă după autentificare reușită
            }
        }

        if (!autentificat) {
            res.cookie('mesajEroare', 'Nume utilizatorului sau parola nu este corectă!');
            console.log(req.cookies.mesajEroare);
            res.redirect('/autentificare');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/autentificare');
});




app.get('/CreareBd',(req, res) => 
   {
	var db = new sqlite3.Database('cumparaturi1Db.db', (err) => {
		if (err) {
			console.error('Eroare la conectarea cu baza de date:', err.message);
			return res.status(500).send('Eroare la conectarea cu baza de date');
		}
		console.log('Conexiune reușită cu baza de date SQLite.');
	});
	
	  db.run(`CREATE TABLE IF NOT EXISTS produse (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nume TEXT NOT NULL,
		pret REAL NOT NULL
    )`, (err) => {
        if (err) {
            console.log("Eroare la crearea tabelei", err);
        } else {
            console.log("Tabela produse a fost creata cu succes!");
        }
    });
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Conexiunea cu baza de date SQLite a fost închisă.');
    });


   res.redirect('/');

});

app.get('/IncarcareBd', (req, res) => {
	var db = new sqlite3.Database('cumparaturi1Db.db', (err) => {
		if (err) {
			console.error('Eroare la conectarea cu baza de date:', err.message);
			return res.status(500).send('Eroare la conectarea cu baza de date');
		}
		console.log('Conexiune reușită cu baza de date');
	});
	

    let produse = [
        ['iPhone 13', 3000],
        ['Samsung Galaxy S21', 1400],
        ['Google Pixel 6', 2500],
        ['OnePlus 9', 2700],
        ['Sony Xperia 5 II', 840]
    ];

    for (let produs of produse) {
        db.run(`INSERT INTO produse (nume, pret) VALUES (?, ?)`, produs, function(err) {
            if (err) {
                console.log('Eroare la inserare:', err.message);
            }
        });
    }

	res.redirect('/');
});


app.get('/AfisareProduse', (req, res) => {
	var db = new sqlite3.Database('cumparaturi1Db.db', (err) => {
		if (err) {
			console.error('Eroare la conectarea cu baza de date:', err.message);
			return res.status(500).send('Eroare la conectarea cu baza de date');
		}
		console.log('Conexiune reușită cu baza de date SQLite.');
	});
	

	console.log('S-a apasat afisare');
    db.serialize(() => {
        let tabela = "SELECT * FROM produse";
        db.all(tabela, [], (err, rows) => {
            if (err) {
                console.log("Eroare la extragere datelor " + err.message);
            } else {
                console.log("Date au fost extrase");
                res.cookie('produse', rows);
                res.redirect('/');
            }
        });
    });
});
 
app.post('/adaugare_cos', (req, res) => {
    // Produsid - name la input
    if (!req.session.cos_cumparaturi) {
        req.session.cos_cumparaturi = []; 
    }
    
    req.session.cos_cumparaturi.push(req.body.Produsid); 
    console.log(req.session.cos_cumparaturi);
    res.redirect('/'); 
});


app.get('/VizualizareCos', (req, res) => {
    res.render('vizualizare-cos', { cos: req.session.cos_cumparaturi,user1: req.session.utilizator });
});



app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));
