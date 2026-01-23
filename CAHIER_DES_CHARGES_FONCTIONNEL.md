# Cahier des Charges Fonctionnel - Application Web "DailyFix"

## 1. Introduction

### 1.1 Contexte

L'application web "DailyFix" est une plateforme centralisée permettant aux utilisateurs de gérer leur quotidien à travers plusieurs modules intégrés : gestion des tâches, suivi de santé, finances, organisation domestique, relations sociales et bien-être mental.

### 1.2 Objectif

Simplifier la vie quotidienne des utilisateurs en centralisant tous les outils de gestion personnelle dans une seule application web intuitive et moderne.

---

## 2. Périmètre Fonctionnel

### 2.1 Modules Principaux

1. **Gestion des Tâches et Calendrier**
2. **Suivi de la Santé et Bien-être**
3. **Gestion des Finances**
4. **Organisation Domestique**
5. **Relations Sociales et Événements**
6. **Bien-être Mental et Développement Personnel**

### 2.2 Utilisateurs Cibles

- Particuliers souhaitant mieux organiser leur quotidien
- Personnes soucieuses de leur santé et bien-être
- Utilisateurs cherchant à mieux gérer leurs finances
- Individus voulant améliorer leur productivité

---

## 3. Fonctionnalités Détaillées

### 3.1 Module : Gestion des Tâches et Calendrier

#### 3.1.1 Gestion des Tâches

**Description** : Système de gestion de tâches inspiré de Jira avec vue Kanban et vue Liste.

**Fonctionnalités** :

- **Création de tâches**
  - Titre (obligatoire)
  - Description (optionnelle)
  - Date d'échéance (optionnelle)
  - Priorité : Faible, Basse, Moyenne, Haute, Très haute
  - Statut : À faire, En cours, En révision, Terminé
  - Assigné à (optionnel)
  - Rapporté par (optionnel)
  - Labels/Tags (optionnels)
  - Story Points (optionnel)
  - Catégorie (optionnelle)
  - Rappel (optionnel)

- **Modification de tâches**
  - Modification de tous les champs
  - Changement de statut
  - Mise à jour automatique de la date de modification

- **Suppression de tâches**
  - Suppression avec confirmation

- **Affichage des tâches**
  - **Vue Kanban** : Colonnes par statut avec drag & drop
  - **Vue Liste** : Liste avec toutes les informations
  - Filtres : Par statut, priorité, assigné, catégorie
  - Recherche : Par titre ou description

- **Statistiques**
  - Nombre de tâches par statut
  - Pourcentage de complétion
  - Tâches complétées aujourd'hui

**Règles métier** :
- Une tâche ne peut avoir qu'un seul statut à la fois
- Le statut "Terminé" équivaut à "complété"
- Les dates d'échéance peuvent être dans le passé (tâches en retard)

#### 3.1.2 Calendrier

**Description** : Calendrier mensuel pour visualiser et gérer les événements et rappels.

**Fonctionnalités** :

- **Affichage**
  - Vue mensuelle avec grille
  - Navigation entre les mois
  - Indication du jour actuel

- **Gestion des événements**
  - Création d'événements (titre, description, date de début, date de fin optionnelle)
  - Création de rappels (titre, description, date)
  - Modification d'événements/rappels
  - Suppression d'événements/rappels
  - Coloration personnalisée des événements

- **Affichage multi-jours**
  - Les événements qui s'étendent sur plusieurs jours sont colorés avec la même couleur
  - Tous les jours concernés sont visuellement identifiables

- **Filtrage**
  - Affichage uniquement des événements et rappels (pas de tâches)

**Règles métier** :
- Les tâches ne sont pas affichées dans le calendrier
- Un événement peut avoir une date de fin différente de la date de début
- Les rappels sont des événements ponctuels (une seule date)

---

### 3.2 Module : Suivi de la Santé et Bien-être

#### 3.2.1 Suivi Alimentaire

**Fonctionnalités** :
- Enregistrement des repas (petit-déjeuner, déjeuner, dîner, collations)
- Saisie des calories par repas
- Calcul automatique des calories totales de la journée
- Historique des repas
- Suggestions de repas équilibrés

**Règles métier** :
- Un repas peut être enregistré plusieurs fois par jour
- Les calories sont additionnées pour obtenir le total journalier

#### 3.2.2 Suivi d'Activité Physique

**Fonctionnalités** :
- Enregistrement d'activités (marche, course, sport, etc.)
- Saisie de la durée en minutes
- Saisie de l'intensité (faible, modérée, élevée)
- Calcul automatique des minutes d'activité par jour
- Suggestions d'exercices
- Historique des activités

**Règles métier** :
- Objectif recommandé : 30 minutes d'activité par jour
- Plusieurs activités peuvent être enregistrées par jour

#### 3.2.3 Suivi du Sommeil

**Fonctionnalités** :
- Enregistrement de l'heure de coucher
- Enregistrement de l'heure de réveil
- Calcul automatique de la durée du sommeil
- Historique des nuits
- Conseils pour améliorer la qualité du sommeil

**Règles métier** :
- Durée recommandée : 7 à 9 heures par nuit
- Un seul enregistrement de sommeil par jour

#### 3.2.4 Hydratation

**Fonctionnalités** :
- Enregistrement de la consommation d'eau (en litres)
- Objectif personnalisable (défaut : 2L par jour)
- Suivi quotidien
- Historique

**Règles métier** :
- Objectif par défaut : 2 litres par jour
- L'objectif peut être modifié par l'utilisateur

#### 3.2.5 Méditation et Relaxation

**Fonctionnalités** :
- Enregistrement de sessions de méditation
- Durée de la session
- Type de méditation (optionnel)
- Suivi des progrès
- Historique

#### 3.2.6 Score de Santé

**Fonctionnalités** :
- Calcul automatique d'un score sur 100
- Basé sur :
  - Calories consommées (25 points si entre 0 et 2500)
  - Activité physique (25 points si ≥ 30 minutes)
  - Hydratation (25 points si ≥ 2L)
  - Sommeil (25 points si entre 7 et 9 heures)
- Affichage dans le dashboard

**Règles métier** :
- Score maximum : 100 points
- Chaque critère contribue pour 25 points maximum

---

### 3.3 Module : Gestion des Finances

#### 3.3.1 Gestion du Salaire

**Fonctionnalités** :
- Ajout de salaires
  - Montant (obligatoire)
  - Période : Mensuel ou Annuel
  - Date (optionnelle, défaut : date actuelle)
  - Description (optionnelle)
- Modification de salaires
- Suppression de salaires
- Historique des salaires

**Règles métier** :
- Les salaires annuels sont automatiquement convertis en mensuels (divisés par 12)
- Le salaire mensuel disponible est la somme des salaires mensuels du mois en cours + les salaires annuels de l'année en cours divisés par 12

#### 3.3.2 Gestion des Dépenses

**Fonctionnalités** :
- Enregistrement de dépenses
  - Description (obligatoire)
  - Montant (obligatoire)
  - Catégorie : Alimentation, Shopping, Santé, Loisirs, Transport, Factures, Autre
  - Date (défaut : date actuelle)
  - Moyen de paiement (optionnel)
- Modification de dépenses
- Suppression de dépenses
- Liste des dépenses (triée par date, plus récentes en premier)

**Règles métier** :
- Les montants sont en euros
- Les dépenses sont catégorisées pour faciliter l'analyse

#### 3.3.3 Analyse des Dépenses

**Fonctionnalités** :
- Vue d'ensemble mensuelle
- Dépenses totales du mois en cours
- Dépenses par catégorie
- Graphiques de répartition par catégorie
- Évolution des dépenses sur 6 mois

**Règles métier** :
- Les dépenses sont regroupées par mois
- Les graphiques sont générés automatiquement

#### 3.3.4 Gestion des Budgets

**Fonctionnalités** :
- Création de budgets
  - Catégorie (obligatoire)
  - Limite (obligatoire)
  - Période : Hebdomadaire, Mensuelle, Annuelle
- Suivi de l'utilisation
  - Montant dépensé vs limite
  - Barre de progression
  - Pourcentage d'utilisation
- Alertes visuelles lorsque le budget est dépassé
- Modification de budgets
- Suppression de budgets

**Règles métier** :
- Un budget peut être créé pour chaque catégorie
- Le budget mensuel est la somme des budgets mensuels
- Le budget est comparé aux dépenses du mois en cours

#### 3.3.5 Solde Disponible

**Fonctionnalités** :
- Calcul automatique : Salaire mensuel - Dépenses du mois = Reste disponible
- Affichage dans le dashboard
- Carte bancaire virtuelle affichant :
  - Nom du titulaire
  - RIB (Relevé d'Identité Bancaire)
  - Numéro de carte
  - Date d'expiration
  - Solde disponible
- Couleur dynamique : Violet si positif, Rouge si négatif

**Règles métier** :
- Le solde peut être négatif si les dépenses dépassent le salaire
- Le calcul est effectué automatiquement à chaque modification

#### 3.3.6 Objectifs d'Épargne

**Fonctionnalités** :
- Création d'objectifs
  - Nom (obligatoire)
  - Montant cible (obligatoire)
  - Montant actuel (défaut : 0)
  - Date limite (optionnelle)
- Mise à jour du montant actuel
- Suivi de progression avec barre de progression
- Pourcentage de complétion
- Modification d'objectifs
- Suppression d'objectifs

**Règles métier** :
- Le pourcentage est calculé : (montant actuel / montant cible) × 100
- Le pourcentage est limité à 100%

#### 3.3.7 Suggestions d'Économies

**Fonctionnalités** :
- Analyse automatique des dépenses
- Suggestions basées sur :
  - Dépenses alimentaires > 30% du total → Suggestion de cuisiner plus
  - Dépenses loisirs > 20% du total → Suggestion d'activités gratuites
- Affichage des suggestions dans la vue d'ensemble

**Règles métier** :
- Les suggestions sont générées automatiquement
- Basées sur des seuils prédéfinis

---

### 3.4 Module : Organisation Domestique

#### 3.4.1 Listes de Courses

**Fonctionnalités** :
- Création de listes de courses
- Ajout d'articles
  - Nom de l'article (obligatoire)
  - Catégorie (optionnelle)
  - Quantité (optionnelle)
- Cocher/décocher les articles achetés
- Suppression d'articles
- Suppression de listes
- Génération automatique basée sur les repas planifiés (à venir)

**Règles métier** :
- Une liste peut contenir plusieurs articles
- Les articles peuvent être cochés individuellement

#### 3.4.2 Tâches Ménagères

**Fonctionnalités** :
- Création de tâches ménagères
  - Nom (obligatoire)
  - Fréquence : Quotidienne, Hebdomadaire, Mensuelle, Annuelle
  - Date de dernière réalisation (optionnelle)
  - Date d'échéance suivante (calculée automatiquement)
- Modification de tâches
- Suppression de tâches
- Marquage comme réalisée (met à jour la date de dernière réalisation)
- Affichage des tâches à venir dans le dashboard

**Règles métier** :
- La date d'échéance suivante est calculée automatiquement selon la fréquence
- Les tâches à venir sont celles dont la date d'échéance est dans le futur

---

### 3.5 Module : Relations Sociales et Événements

#### 3.5.1 Gestion des Événements Sociaux

**Fonctionnalités** :
- Création d'événements
  - Titre (obligatoire)
  - Description (optionnelle)
  - Date (obligatoire)
  - Lieu (optionnel)
  - Liste des participants (optionnelle, format texte)
  - Type d'événement (optionnel : anniversaire, sortie, etc.)
- Modification d'événements
- Suppression d'événements
- Liste des événements à venir
- Affichage dans le dashboard

**Règles métier** :
- Les participants sont saisis sous forme de texte (liste séparée par des virgules)
- Les événements passés peuvent être conservés dans l'historique

#### 3.5.2 Rappels d'Événements

**Fonctionnalités** :
- Affichage des événements à venir dans le dashboard
- Compteur d'événements à venir
- Tri par date (plus proches en premier)

**Règles métier** :
- Un événement est considéré comme "à venir" si sa date est >= aujourd'hui

---

### 3.6 Module : Bien-être Mental et Développement Personnel

#### 3.6.1 Journal Intime

**Fonctionnalités** :
- Création d'entrées de journal
  - Date (défaut : date actuelle)
  - Contenu (texte libre)
  - Tags (optionnels)
- Modification d'entrées
- Suppression d'entrées
- Recherche dans les entrées
- Affichage chronologique

**Règles métier** :
- Les entrées sont datées automatiquement
- Plusieurs entrées peuvent être créées par jour

#### 3.6.2 Suivi des Objectifs Personnels

**Fonctionnalités** :
- Création d'objectifs
  - Titre (obligatoire)
  - Description (optionnelle)
  - Date de début (défaut : date actuelle)
  - Date de fin (optionnelle)
  - Statut : En cours, Terminé, Abandonné
- Modification d'objectifs
- Changement de statut
- Suppression d'objectifs
- Affichage des objectifs actifs dans le dashboard

**Règles métier** :
- Un objectif "actif" est un objectif avec le statut "En cours"
- Les objectifs peuvent être marqués comme terminés ou abandonnés

#### 3.6.3 Gestion du Stress

**Fonctionnalités** :
- Enregistrement des niveaux de stress
  - Date (défaut : date actuelle)
  - Niveau (échelle de 1 à 10)
  - Notes (optionnelles)
- Techniques de gestion du stress (conseils)
- Conseils de motivation
- Exercices de relaxation
- Historique des enregistrements

**Règles métier** :
- Le niveau de stress est sur une échelle de 1 (très faible) à 10 (très élevé)

---

## 4. Interface Utilisateur

### 4.1 Navigation

**Fonctionnalités** :
- Sidebar fixe avec navigation principale
  - Accueil
  - Tâches
  - Calendrier
  - Santé
  - Finances
  - Maison
  - Social
  - Bien-être
- Navbar fixe en haut
  - Logo DailyFix
  - Badge "Version Gratuite"
  - Widget météo (température, ville, icône)
  - Notifications
  - Paramètres
  - Profil utilisateur
- Sidebar rétractable sur petits écrans

**Règles métier** :
- La sidebar et la navbar sont masquées sur la page de connexion
- La sidebar peut être réduite/étendue

### 4.2 Dashboard (Page d'Accueil)

**Fonctionnalités** :
- Cartes de statistiques rapides
  - Tâches complétées aujourd'hui
  - Score de santé
  - Reste disponible (finances)
  - Nombre d'événements à venir
- Graphiques
  - Avancement des tâches (par statut)
  - Dépenses par catégorie
  - Évolution des dépenses (6 mois)
- Sections détaillées par module
  - Gestion des tâches (progression)
  - Suivi santé (résumé du jour)
  - Finances (dépenses et reste)
  - Organisation domestique (tâches à venir)
  - Événements sociaux (prochains événements)
  - Développement personnel (objectifs actifs)
- Statistiques globales de l'application
  - Total des dépenses
  - Objectifs d'épargne
  - Enregistrements santé
  - Événements sociaux
  - Total des tâches

**Règles métier** :
- Les données sont mises à jour en temps réel
- Les graphiques sont générés automatiquement à partir des données

### 4.3 Design

**Fonctionnalités** :
- Design minimaliste inspiré de Notion
- Typographie claire et lisible
- Espacements généreux
- Couleurs subtiles et professionnelles
- Animations douces et transitions fluides
- Responsive (adaptation mobile, tablette, desktop)

**Règles métier** :
- Le design doit être cohérent sur toutes les pages
- Les couleurs doivent respecter les standards d'accessibilité

---

## 5. Fonctionnalités Transversales

### 5.1 Authentification

**Fonctionnalités** :
- Connexion avec email et mot de passe
- Inscription de nouveaux utilisateurs
- Gestion de session
- Déconnexion

**Règles métier** :
- L'email doit être valide
- Le mot de passe doit respecter des critères de sécurité (à définir)
- La session est maintenue entre les visites

### 5.2 Météo

**Fonctionnalités** :
- Affichage de la météo actuelle dans la navbar
- Géolocalisation automatique
- Affichage : Température, Description, Icône, Ville
- Fallback sur Paris en cas d'erreur de géolocalisation

**Règles métier** :
- La géolocalisation nécessite l'autorisation de l'utilisateur
- En cas d'erreur, affichage de la météo de Paris par défaut

### 5.3 Persistance des Données

**Fonctionnalités** :
- Sauvegarde automatique de toutes les données
- Chargement automatique au démarrage
- Données persistantes entre les sessions

**Règles métier** :
- Toutes les données sont sauvegardées localement
- Les données sont disponibles même après fermeture du navigateur

### 5.4 Recherche et Filtres

**Fonctionnalités** :
- Recherche dans les tâches (titre, description)
- Recherche dans le journal intime
- Filtres par catégorie, statut, priorité
- Tri des résultats

**Règles métier** :
- La recherche est insensible à la casse
- Les filtres peuvent être combinés

---

## 6. Règles Métier Globales

### 6.1 Gestion des Dates

- Toutes les dates sont stockées avec l'heure
- Les dates d'échéance peuvent être dans le passé
- Les dates futures sont valides
- Le format d'affichage est adapté au contexte (court, long, relatif)

### 6.2 Calculs Automatiques

- Les calculs sont effectués automatiquement
- Les totaux sont mis à jour en temps réel
- Les pourcentages sont arrondis à l'entier le plus proche

### 6.3 Validation des Données

- Les champs obligatoires doivent être remplis
- Les montants doivent être positifs
- Les dates doivent être valides
- Les formats doivent être respectés

### 6.4 Gestion des Erreurs

- Messages d'erreur clairs et compréhensibles
- Validation côté client avant soumission
- Gestion des cas limites (données vides, valeurs nulles)

---

## 7. Contraintes Fonctionnelles

### 7.1 Performance

- Temps de chargement acceptable (< 2 secondes)
- Animations fluides
- Réactivité de l'interface

### 7.2 Accessibilité

- Navigation au clavier
- Contraste de couleurs suffisant
- Textes alternatifs pour les icônes

### 7.3 Compatibilité

- Fonctionnement sur les navigateurs modernes
- Adaptation responsive (mobile, tablette, desktop)

---

## 8. Cas d'Usage Principaux

### 8.1 Cas d'Usage 1 : Créer et Gérer une Tâche

**Acteur** : Utilisateur

**Scénario** :
1. L'utilisateur accède à la page "Tâches"
2. Il clique sur "Nouvelle tâche"
3. Il remplit le formulaire (titre, description, priorité, etc.)
4. Il sauvegarde la tâche
5. La tâche apparaît dans la colonne "À faire" du Kanban
6. Il peut déplacer la tâche vers "En cours" par drag & drop
7. Il peut modifier ou supprimer la tâche

### 8.2 Cas d'Usage 2 : Suivre ses Finances

**Acteur** : Utilisateur

**Scénario** :
1. L'utilisateur accède à la page "Finances"
2. Il ajoute son salaire mensuel
3. Il enregistre ses dépenses au fur et à mesure
4. Le système calcule automatiquement le reste disponible
5. Il visualise ses dépenses par catégorie dans un graphique
6. Il crée un budget pour une catégorie
7. Le système suit l'utilisation du budget avec une barre de progression

### 8.3 Cas d'Usage 3 : Planifier un Événement

**Acteur** : Utilisateur

**Scénario** :
1. L'utilisateur accède au "Calendrier"
2. Il clique sur une date
3. Il crée un événement (titre, date de début, date de fin)
4. L'événement apparaît sur le calendrier
5. Tous les jours concernés sont colorés avec la même couleur
6. L'événement apparaît dans le dashboard

### 8.4 Cas d'Usage 4 : Suivre sa Santé

**Acteur** : Utilisateur

**Scénario** :
1. L'utilisateur accède à la page "Santé"
2. Il enregistre ses repas avec les calories
3. Il enregistre son activité physique
4. Il enregistre sa consommation d'eau
5. Il enregistre ses heures de sommeil
6. Le système calcule automatiquement son score de santé
7. Le score est affiché dans le dashboard

---

## 9. Priorités Fonctionnelles

### 9.1 Priorité 1 (Essentiel)

- Gestion des tâches (création, modification, suppression)
- Gestion des dépenses (création, modification, suppression)
- Calcul du solde disponible
- Affichage du dashboard
- Authentification

### 9.2 Priorité 2 (Important)

- Calendrier avec événements
- Suivi de santé (repas, activité, sommeil, eau)
- Gestion des budgets
- Objectifs d'épargne
- Graphiques et statistiques

### 9.3 Priorité 3 (Souhaitable)

- Suggestions d'économies
- Journal intime
- Objectifs personnels
- Gestion du stress
- Listes de courses intelligentes

---

## 10. Critères d'Acceptation

### 10.1 Critères Généraux

- Toutes les fonctionnalités doivent être accessibles et utilisables
- Les données doivent être persistantes
- L'interface doit être intuitive
- Les performances doivent être acceptables
- L'application doit être responsive

### 10.2 Critères Spécifiques par Module

**Tâches** :
- ✅ Création, modification, suppression fonctionnelles
- ✅ Drag & drop entre les colonnes
- ✅ Filtres et recherche opérationnels

**Finances** :
- ✅ Calcul automatique du solde
- ✅ Graphiques affichés correctement
- ✅ Carte bancaire virtuelle visible

**Calendrier** :
- ✅ Événements multi-jours colorés
- ✅ Navigation entre les mois
- ✅ Création/modification d'événements

**Santé** :
- ✅ Score de santé calculé correctement
- ✅ Enregistrement de toutes les données
- ✅ Historique disponible

---

**Version du Document** : 1.0  
**Date de Création** : 2024  
**Dernière Mise à Jour** : 2024


