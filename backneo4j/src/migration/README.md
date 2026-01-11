# 🔄 Migration Guide

Ce guide vous aide à migrer de l'ancien schéma de transport vers le nouveau schéma Taxi Luxe.

## 📋 Prérequis

1. **Neo4j doit être en cours d'exécution**
2. **Backup de votre base de données** recommandé
3. **Node.js** installé

## 🗂️ Ancien vs Nouveau Schéma

### Ancien Schéma (Transport)
- `Passager` → `User` (Client)
- `Station` → `StationBackup` (conservé pour référence)
- `Ligne` → Non utilisé dans le nouveau système

### Nouveau Schéma (Taxi)
- `User` (Client)
- `Driver` (Chauffeur)  
- `Admin` (Administrateur)
- `Trip` (Voyage)
- `Complaint` (Plainte)
- `Wallet` (Portefeuille)

## 🚀 Commandes de Migration

### 1. Vérifier le statut actuel
```bash
npm run migrate:status
```

### 2. Exécuter la migration
```bash
npm run migrate
```

### 3. Annuler la migration (si nécessaire)
```bash
npm run migrate:rollback
```

## 📊 Processus de Migration

### Étape 1: Analyse des données existantes
- Compte les `Passager`, `Station`, `Ligne` existants
- Vérifie que le nouveau schéma n'existe pas déjà

### Étape 2: Migration des Passagers → Users
- Chaque `Passager` devient un `User` avec rôle `USER`
- Email généré automatiquement si absent
- Mot de passe par défaut: `password123`
- Mapping conservé avec relation `MIGRATED_TO`

### Étape 3: Backup des Stations
- Les `Station` sont copiées dans `StationBackup`
- Connexions entre stations préservées
- Pour référence future si nécessaire

### Étape 4: Création Admin par défaut
- Email: `admin@taxiluxe.com`
- Mot de passe: `admin123`
- Portefeuille associé créé

### Étape 5: Création des contraintes et indexes
- Unicité sur emails et IDs
- Indexes pour performances

## 🔧 Après Migration

### Comptes créés automatiquement:
- **Admin**: `admin@taxiluxe.com` / `admin123`
- **Users**: Chaque passager migré avec mot de passe `password123`

### Actions recommandées:
1. **Changer les mots de passe par défaut**
2. **Ajouter des informations manquantes** (téléphones, emails)
3. **Créer des comptes chauffeurs** via l'API admin
4. **Tester les fonctionnalités**

## ⚠️ Notes Importantes

### Données non migrées:
- `Ligne` → Non utilisé dans le système taxi
- Relations `VOYAGE` → Remplacées par `Trip` structuré

### Sécurité:
- Changez immédiatement les mots de passe par défaut
- Configurez `JWT_SECRET` en production
- Activez HTTPS

### Backup:
- La migration crée des backups automatiquement
- `StationBackup` contient toutes les stations originales

## 🐨 Dépannage

### Erreur: "Users already exist"
```bash
npm run migrate:rollback
npm run migrate
```

### Erreur: Neo4j connection
- Vérifiez que Neo4j tourne sur `localhost:7687`
- Vérifiez les identifiants dans `.env`

### Erreur: Contraintes existantes
- Les contraintes sont créées avec `IF NOT EXISTS`
- Ne devrait pas causer d'erreurs

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de la migration
2. Utilisez `npm run migrate:status` pour diagnostiquer
3. Utilisez `rollback` pour revenir en arrière
4. Contactez le support technique
