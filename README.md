# DailyFix

# DailyFix - Application de Gestion Personnelle

Application web complète pour la gestion de votre vie quotidienne : tâches, calendrier, santé, finances, organisation de la maison, social et bien-être.

## 🌐 Déploiement

L'application est déployée sur GitHub Pages : [https://dali2000.github.io/DailyFix/](https://dali2000.github.io/DailyFix/)

## 🚀 Développement

### Prérequis

- Node.js (version 20 ou supérieure)
- npm

### Installation

```bash
npm install
```

### Serveur de développement

```bash
npm start
# ou
ng serve
```

Naviguez vers `http://localhost:4200/`. L'application se rechargera automatiquement si vous modifiez les fichiers source.

### Build pour production

```bash
npm run build
```

Les artefacts de build seront stockés dans le répertoire `dist/`.

### Build pour GitHub Pages

```bash
npm run build:gh-pages
```

## 📦 Fonctionnalités

- ✅ **Gestion des tâches** - Kanban et vue liste
- 📅 **Calendrier** - Vue mensuelle, hebdomadaire et quotidienne
- ❤️ **Santé** - Suivi de la santé et de l'hydratation
- 💰 **Finances** - Gestion des dépenses et revenus
- 🏡 **Organisation de la maison** - Listes de courses et tâches ménagères
- 👥 **Social** - Gestion des événements et suggestions
- 🧘 **Bien-être** - Journal et gestion du stress

## 🛠️ Technologies

- Angular 17
- TypeScript
- CSS3 (Design inspiré de Notion)

## 📝 Structure du projet

```
src/
├── app/
│   ├── components/     # Composants de l'application
│   ├── services/       # Services Angular
│   └── models/         # Modèles de données
├── assets/             # Ressources statiques
└── styles.css          # Styles globaux
```

## 🔧 Configuration GitHub Pages

Le déploiement est automatique via GitHub Actions. À chaque push sur la branche `main`, l'application est automatiquement déployée sur GitHub Pages.

## 📄 License

Ce projet est un projet personnel.
