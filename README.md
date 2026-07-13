# 2D Cloud — site vitrine

Site statique (une page) dérivé de la plaquette commerciale 2D Cloud.
Cybersécurité managée pour TPE, PME & ETI.

## Structure

```
.
├── index.html            Page principale (hero animé + carrousel 01→05 + contact)
├── assets/
│   ├── css/styles.css    Styles (thème clair/sombre, carrousel, cluster animé)
│   ├── js/main.js        Thème, menu mobile, carrousel auto, header au scroll
│   └── img/              Logo + favicon
├── CNAME                 Domaine personnalisé (www.2dcloud.fr)
├── robots.txt            SEO
├── sitemap.xml           SEO
├── docker-compose.yml    Test local via nginx
└── .github/workflows/    Déploiement GitHub Pages
```

## Fonctionnalités

- **Thème clair / sombre**: suit la préférence système par défaut, choix mémorisé (localStorage).
- **Carrousel automatique** des 5 volets de la plaquette (pause au survol, flèches, points, barre de progression, swipe).
- **Hero animé**: cluster d'infrastructure résiliente (nœuds serveurs, flux de données, radar).
- **Année du pied de page** injectée au build par la pipeline (voir plus bas).

## Tester en local

**Avec Docker (nginx, comme en prod):**

```bash
docker compose up -d
# http://localhost:8080
docker compose down   # pour arrêter
```

**Sans Docker (Python):**

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Déploiement (GitHub Pages)

1. Pousser le repo sur GitHub.
2. Settings → Pages → Source: **GitHub Actions**.
3. Chaque push sur `main` déclenche le workflow `.github/workflows/deploy.yml`.

Le workflow **injecte l'année courante** (`date +%Y`) dans le pied de page au moment
du build, et se relance automatiquement le 1er de chaque mois (`schedule` cron) pour
que l'année reste à jour sans commit, y compris au passage à la nouvelle année.

### Domaine personnalisé

Le fichier `CNAME` cible `www.2dcloud.fr`. Configuration DNS chez le registrar:

| Type  | Nom / Hôte | Valeur                    |
|-------|------------|---------------------------|
| CNAME | `www`      | `<user>.github.io.`       |

Pour rediriger l'apex `2dcloud.fr` vers `www`, ajouter aussi les A/AAAA GitHub
sur l'apex (voir la doc GitHub Pages « Managing a custom domain »).
