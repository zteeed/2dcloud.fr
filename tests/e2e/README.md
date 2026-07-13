# Tests end-to-end

Tests E2E du site (carrousel, thème clair/sombre, layout du hero) pilotant le
**Chrome système** via `playwright-core` — aucun navigateur n'est téléchargé.

## Prérequis

- Google Chrome installé
- Le site servi en local:

```bash
# depuis la racine du repo
docker compose up -d      # → http://localhost:8080
```

## Lancer les tests

```bash
cd tests/e2e
npm install
npm test
```

Couverture (23 assertions):

- **Thème**: défaut selon la préférence système, bascule clair/sombre, changement
  effectif du fond, `aria-pressed`, persistance via `localStorage`, absence d'erreur JS.
- **Carrousel**: volet initial, flèches préc./suiv., points, `translateX`, point actif,
  navigation clavier (←/→), boucle 05→01.
- **Autoplay**: avance automatique (~7 s), bouton pause, reprise, pause au survol des volets.
- **Layout hero**: deux colonnes ≥ 1280px (animation à droite), empilé ≤ 1024px.

## Variables d'environnement

| Variable      | Défaut                                   |
|---------------|------------------------------------------|
| `BASE_URL`    | `http://localhost:8080/`                 |
| `CHROME_PATH` | `/Applications/Google Chrome.app/…`      |

```bash
BASE_URL=http://localhost:8080/ npm test
```
