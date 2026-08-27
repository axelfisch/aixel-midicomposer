# AiXel MIDI Composer

Version **V0.2 “Mini-DAW qui respire”** d’un instrument personnel de composition MIDI. Cette phase garde l’esprit V0.1 “No Dead Buttons”, puis rend le prototype plus réellement utilisable : historique, édition multi-notes, clipboard, pistes dynamiques, chargement local et mixer latéral.

La mémoire produit complète et les décisions à préserver sont consignées dans [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md).

## Démarrage

```bash
pnpm install
pnpm dev
```

Build de production :

```bash
pnpm build
```

Validation structurelle de l’export MIDI :

```bash
pnpm validate:midi
```

## Fonctionnel en V0.1

- **Transport** : Lecture, Pause, Stop, retour au début, position, tempo 40–240 BPM, Loop et métronome.
- **Pistes** : sélection, ajout de piste MIDI, suppression de la piste active, Mute et Solo avec mise à jour du moteur pendant la lecture.
- **Inspecteur** : sélection réelle parmi les 12 instruments internes, volume, panoramique, Hall Reverb Send et Stereo Delay Send.
- **Piano-roll** : création par double-clic, sélection simple/multiple, multi-drag, resize, vélocité à la molette, suppression, grille Snap cyclique et quantification réelle.
- **Affichage** : zoom horizontal par boutons ou slider, déplacement de la tête de lecture et affichage/masquage de l’inspecteur.
- **Édition** : Undo/Redo, copier/coller des notes sélectionnées au curseur de lecture, raccourcis clavier usuels.
- **Mixer latéral** : affichage optionnel de toutes les pistes avec volume, pan, mute et solo.
- **Projet** : sauvegarde JSON dans `localStorage`, chargement local et confirmation visible.
- **Export MIDI** : téléchargement `.mid` et confirmation visible ; validateur automatisé de l’en-tête, du tempo, des pistes et des notes.
- **Aide** : rappel contextuel des gestes du piano-roll.

Les réglages audio sont appliqués immédiatement aux nœuds Tone.js pendant la lecture. Solo coupe les pistes non solo ; Mute conserve sa priorité.

## Contrôles volontairement indisponibles

Ces contrôles sont visibles mais désactivés avec un libellé de version et un tooltip :

- ScoreEdition — V2 ;
- changement de signature rythmique — V1 ;
- Sound Library complète — V1 ;
- outil crayon — V1 ;
- export Audio / WAV — V3.

Le nom du projet, le menu général et la couleur harmonique restent cliquables uniquement pour afficher un message court indiquant leur phase future. Aucun faux menu n’est ouvert.

## Architecture

```text
src/
├── App.tsx       # composition UI : transport, pistes, piano-roll, inspecteur
├── audio.ts      # moteur de lecture Tone.js, sans dépendance à React
├── midi.ts       # sérialisation et export MIDI
├── store.ts      # état musical Zustand et commandes d’édition
├── data.ts       # catalogue des 12 instruments et projet de démonstration
├── types.ts      # contrats Project / Track / Note / Instrument
└── styles.css    # direction visuelle et layout
```

La règle structurante est simple : les composants affichent et déclenchent des commandes, le store possède le projet, `audio.ts` joue ce projet et `midi.ts` l’exporte. ScoreEdition pourra lire les mêmes `MidiTrack[]` sans dupliquer la logique musicale.

## Modèle musical

- Les positions et durées sont exprimées en beats, indépendamment du rendu visuel.
- Une note contient `pitch`, `start`, `duration` et `velocity`.
- Une piste contient ses notes, son instrument et son mix simple.
- Un instrument interne est un preset AiXel ; ce n’est pas présenté comme un VST réel.

## Roadmap conseillée

1. **V0.2 actuel** — mini-DAW MIDI utilisable : transport, piano-roll, historique, multi-drag, clipboard, pistes, sauvegarde/chargement, mixer simple et export MIDI.
2. **V1** — format de projet versionné, renommage propre, signature rythmique, bibliothèque complète et polish d’édition.
3. **V2** — ScoreEdition VexFlow synchronisée sur le modèle MIDI commun.
4. **V3** — HallReverb, StereoDelay et rendu WAV hors-ligne.
5. **V4** — dictionnaire des 20 accords, Voicing Helper, Humanize et Orchestrate.
6. **V5** — PWA tactile, puis Capacitor après validation sur iPad/iPhone.

## Limite volontaire

Le bouton Audio est explicitement désactivé jusqu’à la phase V3 : aucun faux export WAV n’est simulé. Score et Mixer restent également des destinations futures, afin que le V0.1 prouve d’abord le cœur de l’instrument.

## Audit V0.1

- build TypeScript/Vite de production validé ;
- état de tous les boutons visibles audité dans `src/App.tsx` ;
- Lecture/Pause/Stop et remise à zéro vérifiés ;
- changement d’instrument, volume, pan, sends, mute/solo et mixer reliés à l’état React ;
- sauvegarde locale et chargement local reliés au store ;
- export MIDI parsé : signature `MThd`, 3 pistes, 29 notes et tempo attendu ;
- build production sans erreur TypeScript.

## Commandes de vérification

```bash
pnpm install
pnpm dev
pnpm validate:midi
pnpm build
```

Adresse locale attendue en développement :

```text
http://localhost:5173
```

## Préparation macOS avec Tauri

Ne pas intégrer Tauri avant d’avoir figé V1 et le format de projet. La bonne étape suivante sera d’ajouter un shell **Tauri 2** autour du build Vite existant, sans déplacer la logique musicale :

1. conserver `src/` et le moteur Tone.js comme application web ;
2. initialiser `src-tauri/` séparément ;
3. pointer `devUrl` vers Vite et `frontendDist` vers `dist/` ;
4. remplacer progressivement les téléchargements navigateur par les dialogues et écritures de fichiers Tauri ;
5. tester en priorité AudioContext/WebAudio, sandbox macOS, signature et notarisation.

Cette approche garde la web app comme source de vérité et évite un fork macOS prématuré.
