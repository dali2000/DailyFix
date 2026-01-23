# Besoins Fonctionnels - Application Web "DailyFix"

## 1. Objectifs du Projet

### 1.1 Description Générale

L'application web "DailyFix" vise à résoudre une série de problèmes du quotidien en offrant une plateforme centralisée qui aide les utilisateurs à mieux organiser leur emploi du temps, gérer leur santé, suivre leurs finances, et plus encore. L'objectif est de simplifier la vie des utilisateurs en centralisant plusieurs outils pratiques dans une seule application web.

### 1.2 Objectifs Spécifiques

- Offrir des outils de gestion de tâches et d'agenda
- Fournir des recommandations de bien-être (santé physique, mentale, alimentation)
- Aider à gérer les finances personnelles avec suivi du salaire et des dépenses
- Faciliter l'organisation des courses, des tâches ménagères et des événements sociaux
- Proposer une interface simple, intuitive et accessible avec un design moderne inspiré de Notion

---

## 2. Fonctionnalités Principales

### 2.1 Gestion des Tâches et de l'Emploi du Temps

#### Calendrier
- Vue hebdomadaire, mensuelle et quotidienne
- Possibilité de visualiser et modifier les événements
- Ajout d'événements et de rappels uniquement (pas de tâches dans le calendrier)
- Coloration des jours pour les événements multi-jours avec la même couleur

#### Gestion des Tâches (Style Jira)
- **Vue Kanban** : Colonnes par statut (À faire, En cours, En révision, Terminé)
- **Vue Liste** : Affichage en liste avec filtres
- **Drag & Drop** : Déplacer les tâches entre les colonnes
- **Champs détaillés** :
  - Titre et description
  - Priorité (Faible, Basse, Moyenne, Haute, Très haute)
  - Statut (À faire, En cours, En révision, Terminé)
  - Assigné à / Rapporté par
  - Labels (tags)
  - Story Points
  - Catégorie
  - Date d'échéance
  - Rappel
  - Dates de création et modification

#### Rappels et Notifications
- Configurer des rappels pour chaque tâche, événement ou rendez-vous
- Affichage des tâches à venir dans le dashboard
- Notifications pour les échéances importantes

---

### 2.2 Suivi de la Santé et du Bien-être

#### Suivi Alimentaire
- Saisie des repas (petit-déjeuner, déjeuner, dîner, collations)
- Calcul des calories consommées
- Suggestions de repas équilibrés

#### Suivi d'Activité Physique
- Ajouter des activités physiques (marche, course, sport)
- Durée et intensité des activités
- Suggestions d'exercices
- Calcul des minutes d'activité par jour

#### Suivi du Sommeil
- Enregistrement des heures de sommeil
- Heure de coucher et de réveil
- Conseils pour améliorer la qualité du sommeil

#### Hydratation
- Suivi de la consommation d'eau quotidienne
- Objectifs personnalisables

#### Méditation et Relaxation
- Enregistrement des sessions de méditation
- Durée et type de méditation
- Suivi des progrès

#### Score de Santé
- Calcul automatique d'un score de santé basé sur :
  - Calories consommées
  - Activité physique
  - Hydratation
  - Qualité du sommeil

---

### 2.3 Gestion des Finances

#### Suivi du Salaire
- Ajout de salaires (mensuel ou annuel)
- Calcul automatique du salaire mensuel disponible
- Historique des salaires

#### Suivi des Dépenses
- Enregistrer et catégoriser les dépenses :
  - Alimentation
  - Shopping
  - Santé
  - Loisirs
  - Transport
  - Factures
  - Autre
- Moyen de paiement
- Date et description

#### Analyse des Dépenses
- Graphiques pour suivre les tendances des dépenses mensuelles
- Dépenses par catégorie
- Vue d'ensemble mensuelle

#### Budget
- Création de budgets par catégorie
- Périodes : hebdomadaire, mensuelle, annuelle
- Suivi de l'utilisation du budget avec barres de progression
- Alertes lorsque le budget est dépassé

#### Solde Disponible
- Calcul automatique : **Salaire - Dépenses = Reste disponible**
- Affichage dans le dashboard
- Carte bancaire virtuelle avec :
  - Nom du titulaire
  - RIB (Relevé d'Identité Bancaire)
  - Numéro de carte
  - Date d'expiration
  - Solde disponible

#### Objectifs d'Épargne
- Créer des objectifs d'épargne
- Montant cible et montant actuel
- Date limite optionnelle
- Suivi de progression avec barres de progression

#### Suggestions d'Économies
- Conseils automatiques pour réduire certaines dépenses
- Suggestions basées sur l'analyse des dépenses

---

### 2.4 Organisation Domestique

#### Listes de Courses
- Créer des listes de courses
- Générer des listes basées sur les repas planifiés
- Cocher les articles achetés
- Catégorisation des articles

#### Tâches Ménagères
- Créer un planning pour le nettoyage, le rangement
- Tâches récurrentes avec dates d'échéance
- Suivi des tâches à venir
- Affichage dans le dashboard

#### Astuces et Conseils Domestiques
- Offrir des idées pour maintenir la maison propre
- Suggestions de produits écologiques

---

### 2.5 Gestion des Relations Sociales et Événements

#### Calendrier d'Événements
- Ajouter des événements sociaux
- Titre, description, date, lieu
- Liste des participants
- Type d'événement (anniversaire, sortie, etc.)

#### Rappels d'Événements
- Rappels pour les événements sociaux importants
- Affichage des événements à venir dans le dashboard
- Compteur d'événements à venir

#### Suggestions d'Activités
- Proposer des idées de sorties ou d'activités
- Activités à réaliser avec des proches

---

### 2.6 Bien-être Mental et Développement Personnel

#### Journal Intime
- Permettre à l'utilisateur d'écrire ses pensées
- Objectifs et gratitudes
- Entrées datées
- Recherche dans les entrées

#### Suivi des Objectifs Personnels
- Créer des objectifs personnels
- Suivi des progrès réalisés
- Dates de début et de fin
- Statut (en cours, terminé, abandonné)

#### Gestion du Stress
- Enregistrer les niveaux de stress
- Techniques de gestion du stress
- Conseils de motivation
- Exercices de relaxation

---

## 3. Interface Utilisateur

### 3.1 Design

#### Style Notion
- Design minimaliste et épuré
- Typographie claire et lisible
- Espacements généreux
- Couleurs subtiles et professionnelles
- Animations douces et transitions fluides

#### Navigation
- **Sidebar fixe** : Navigation principale avec icônes
  - Accueil
  - Tâches
  - Calendrier
  - Santé
  - Finances
  - Maison
  - Social
  - Bien-être
- **Navbar fixe** : En haut de la page
  - Logo DailyFix
  - Badge "Version Gratuite"
  - Widget météo (température, ville, icône)
  - Notifications
  - Paramètres
  - Profil utilisateur

#### Responsive Design
- Adaptation automatique pour :
  - Ordinateurs de bureau
  - Tablettes
  - Smartphones
- Sidebar rétractable sur petits écrans

### 3.2 Dashboard (Page d'Accueil)

#### Cartes de Statistiques
- Tâches complétées aujourd'hui
- Score de santé
- Reste disponible (finances)
- Nombre d'événements à venir

#### Sections Détaillées
- Gestion des tâches (progression)
- Suivi santé (résumé du jour)
- Finances (dépenses et reste)
- Organisation domestique (tâches à venir)
- Événements sociaux (prochains événements)
- Développement personnel (objectifs actifs)

---

## 4. Fonctionnalités Transversales

### 4.1 Authentification
- Connexion avec email et mot de passe
- Inscription de nouveaux utilisateurs
- Gestion de session utilisateur

### 4.2 Météo
- Affichage de la météo actuelle dans la navbar
- Géolocalisation automatique
- Température, description et icône météo
- Nom de la ville détectée automatiquement

### 4.3 Recherche et Filtres
- Recherche dans les tâches
- Filtres par catégorie, statut, priorité
- Recherche dans le journal intime

### 4.4 Export et Partage
- Export de données (à venir)
- Partage de calendriers (à venir)

---

**Version du Document** : 1.0  
**Date de Création** : 2024


