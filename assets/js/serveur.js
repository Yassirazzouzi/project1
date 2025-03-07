const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Connexion à la base de données
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour enregistrer les cookies en base de données
app.post('/set-consent', async (req, res) => {
    const { email, essential, analytics, marketing } = req.body;

    if (!email) {
        return res.status(400).send('Email requis.');
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Vérifier si l'utilisateur existe
        let [user] = await connection.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        let userId = user.length > 0 ? user[0].id : null;

        // Insérer l'utilisateur s'il n'existe pas
        if (!userId) {
            const [userResult] = await connection.query(
                'INSERT INTO utilisateurs (email) VALUES (?)',
                [email]
            );
            userId = userResult.insertId;
        }

        // Insérer ou mettre à jour les cookies
        await connection.query(
            'INSERT INTO cookies (user_id, essential, analytics, marketing, created_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE essential = VALUES(essential), analytics = VALUES(analytics), marketing = VALUES(marketing), created_at = NOW()',
            [userId, essential ? 1 : 0, analytics ? 1 : 0, marketing ? 1 : 0]
        );

        res.cookie('cookies-consent', JSON.stringify({ essential, analytics, marketing }), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });

        await connection.commit();
        res.send('Consentement enregistré en base de données et en cookie !');
    } catch (err) {
        await connection.rollback();
        console.error('Erreur lors de lenregistrement des cookies:', err);
        res.status(500).send('Erreur interne du serveur.');
    } finally {
        connection.release();
    }

    app.post('/set-consent', async (req, res) => {
        console.log("Données reçues :", req.body); // Vérifier les données côté serveur
        const { email, essential, analytics, marketing } = req.body;
    
        if (!email) {
            return res.status(400).send('Email requis.');
        }
});});

// Route pour récupérer le consentement des cookies
app.get('/get-consent', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send('Email requis.');
    }

    const connection = await db.promise().getConnection();
    try {
        const [rows] = await connection.query('SELECT essential, analytics, marketing FROM cookies WHERE user_id = (SELECT id FROM utilisateurs WHERE email = ?)', [email]);
        res.json(rows.length > 0 ? rows[0] : {});
    } catch (err) {
        console.error('Erreur lors de la récupération des cookies:', err);
        res.status(500).send('Erreur interne du serveur.');
    } finally {
        connection.release();
    }
});
