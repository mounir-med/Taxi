# 🚕 Taxi Luxe Backend API

Une application backend robuste pour une application de transport Taxi Luxe, utilisant **Neo4j** comme base de données principale avec authentification JWT et gestion des rôles.

## 🏗️ Architecture

### Stack Technique
- **Node.js** avec ES6+
- **Neo4j** (Graph Database)
- **Express.js** (Framework Web)
- **JWT** (Authentification)
- **bcryptjs** (Hashage des mots de passe)
- **Joi** (Validation des données)

### Structure du Projet
```
src/
├── config/
│   └── neo4j.js          # Configuration Neo4j
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── driver.controller.js
│   └── admin.controller.js
├── middleware/
│   └── auth.js           # Middleware d'authentification
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── driver.routes.js
│   └── admin.routes.js
├── services/
│   ├── auth.service.js
│   ├── trip.service.js
│   ├── complaint.service.js
│   └── admin.service.js
├── schema/
│   └── taxi.schema.js    # Schéma GraphQL Neo4j
├── validation/
│   └── validation.js     # Schémas de validation Joi
└── server.js             # Point d'entrée principal
```

## 🚦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd backneo4j
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

4. **Démarrer Neo4j**
Assurez-vous que Neo4j est en cours d'exécution sur `localhost:7687`

5. **Démarrer le serveur**
```bash
npm run dev    # Mode développement
npm start      # Mode production
```

## 🔐 Authentification & Rôles

### Rôles Disponibles
- **USER** : Client qui peut réserver des voyages
- **DRIVER** : Chauffeur qui accepte et réalise les voyages
- **ADMIN** : Administrateur qui gère le système

### JWT Tokens
Les tokens expirent après 7 jours. Inclure le token dans les requêtes protégées :
```
Authorization: Bearer <votre-jwt-token>
```

## 📚 API Endpoints

### Authentication
```
POST /api/auth/register/user    # Inscription client
POST /api/auth/register/driver  # Inscription chauffeur
POST /api/auth/register/admin   # Inscription admin
POST /api/auth/login/user       # Connexion client
POST /api/auth/login/driver     # Connexion chauffeur
POST /api/auth/login/admin      # Connexion admin
GET  /api/auth/profile/user     # Profil client (protégé)
GET  /api/auth/profile/driver   # Profil chauffeur (protégé)
GET  /api/auth/profile/admin    # Profil admin (protégé)
```

### User Routes (protégées)
```
POST /api/user/trips                    # Réserver un voyage
GET  /api/user/trips                    # Mes voyages
GET  /api/user/trips/:tripId            # Détails d'un voyage
POST /api/user/complaints               # Déposer une plainte
GET  /api/user/complaints               # Mes plaintes
GET  /api/user/drivers/available        # Chauffeurs disponibles
```

### Driver Routes (protégées)
```
POST /api/driver/trips/start            # Commencer un voyage
POST /api/driver/trips/complete          # Terminer un voyage
GET  /api/driver/trips                  # Mes voyages
GET  /api/driver/trips/:tripId          # Détails d'un voyage
GET  /api/driver/complaints             # Mes plaintes
GET  /api/driver/wallet                 # Mon portefeuille
POST /api/driver/location               # Mettre à jour ma position
```

### Admin Routes (protégées)
```
# Gestion des chauffeurs
POST   /api/admin/drivers                # Créer un chauffeur
GET    /api/admin/drivers                # Liste des chauffeurs
GET    /api/admin/drivers/:driverId      # Détails chauffeur
PUT    /api/admin/drivers/:driverId/status # Mettre à jour statut
POST   /api/admin/drivers/:driverId/ban  # Bannir chauffeur
POST   /api/admin/drivers/:driverId/pause # Suspendre chauffeur

# Gestion des voyages
GET    /api/admin/trips                   # Tous les voyages

# Gestion des plaintes
GET    /api/admin/complaints              # Toutes les plaintes
PUT    /api/admin/complaints/:complaintId/process # Traiter plainte
GET    /api/admin/complaints/stats        # Statistiques plaintes

# Statistiques et portefeuille
GET    /api/admin/stats                   # Statistiques générales
GET    /api/admin/wallet                  # Portefeuille admin
```

## 🧠 Modèle Neo4j

### Nœuds
- **User** : Client avec informations personnelles
- **Driver** : Chauffeur avec statut et informations véhicule
- **Admin** : Administrateur système
- **Trip** : Voyage avec détails et tarification
- **Complaint** : Plainte liée à un voyage
- **Wallet** : Portefeuille pour transactions financières

### Relations
- `(User)-[:BOOKED]->(Trip)` : Client a réservé un voyage
- `(Driver)-[:ASSIGNED_TO]->(Trip)` : Chauffeur assigné à un voyage
- `(User)-[:FILED]->(Complaint)` : Client a déposé une plainte
- `(Complaint)-[:AGAINST]->(Driver)` : Plainte contre un chauffeur
- `(Complaint)-[:ABOUT]->(Trip)` : Plainte concernant un voyage
- `(Driver)-[:OWNS]->(Wallet)` : Chauffeur possède un portefeuille
- `(Admin)-[:COLLECTS]->(Wallet)` : Admin collecte les taxes

## 💰 Logique Métier

### Tarification
- **Distance calculée** : Formule Haversine entre coordonnées GPS
- **Prix de base** : 1 km = 3 DH
- **TVA** : 8% du prix final
- **Répartition** : Chauffeur reçoit (prix - TVA), Admin reçoit TVA

### Règles de Plaintes Automatiques
- **7+ plaintes** : Chauffeur BANNI automatiquement
- **3-6 plaintes** : Chauffeur SUSPENDU 3 jours automatiquement
- **0-2 plaintes** : Statut ACTIF maintenu

### Statuts de Voyage
- **PENDING** : En attente d'assignation
- **ASSIGNED** : Assigné à un chauffeur
- **STARTED** : Voyage commencé
- **COMPLETED** : Voyage terminé (paiement effectué)
- **CANCELLED** : Voyage annulé

## 🔧 Développement

### Scripts Disponibles
```bash
npm run dev      # Serveur avec nodemon
npm start        # Serveur production
npm test         # Tests (à implémenter)
```

### Validation
Toutes les entrées API sont validées avec Joi :
- Format email valide requis
- Mot de passe minimum 6 caractères
- Coordonnées GPS valides
- UUID valides pour les IDs

### Sécurité
- **Helmet** : Protection des en-têtes HTTP
- **Rate Limiting** : 100 requêtes/15 minutes par IP
- **CORS** : Configuration pour origines autorisées
- **JWT** : Tokens sécurisés avec expiration
- **bcrypt** : Hashage des mots de passe (12 rounds)

## 📊 Monitoring

### Health Check
```bash
GET /health
```
Retourne le statut du service et informations système.

### Logs
Les erreurs sont loggées dans la console avec gestion centralisée.

## 🚀 Déploiement

### Variables d'Environnement Requises
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=votre_mot_de_passe
PORT=4000
JWT_SECRET=votre_secret_jwt_tres_securise
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.com
```

### Production
1. Configurer `NODE_ENV=production`
2. Utiliser un JWT secret très sécurisé
3. Configurer un reverse proxy (nginx)
4. Activer HTTPS
5. Configurer les backups Neo4j

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Créer une Pull Request

## 📝 Licence

Ce projet est sous licence ISC.
