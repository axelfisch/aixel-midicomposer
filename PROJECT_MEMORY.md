# Mémoire du projet — AiXel MIDI Composer

Ce fichier est la référence durable du projet. Il doit être relu avant toute nouvelle phase de conception ou de développement.

## Vision

**AiXel MIDI Composer** est un instrument personnel de composition MIDI conçu autour de l’identité musicale d’Axel Fisch. Ce n’est pas un DAW généraliste et il ne doit pas devenir une usine à gaz.

L’application vise une composition rapide, musicale et élégante : jazz, bossa nova, fusion, pop sophistiquée, mélodies chantantes, voicings raffinés, orchestration expressive et couleur cinématique.

Le produit est d’abord une web app React/TypeScript, avec une future distribution macOS via Tauri et une éventuelle version iOS plus tard.

## Principes immuables

- MIDI uniquement : aucune piste audio.
- Moteur sonore interne pour écouter le MIDI.
- Export MIDI, puis export WAV dans une phase ultérieure.
- Interface simple, premium et immédiatement musicale.
- Aucun plugin VST externe et aucun faux terme technique « VST ».
- Les sons sont nommés **AiXel Internal Instruments**.
- Séparation stricte entre modèle musical, UI, état et moteur audio.
- Toute fonction visible doit agir, expliquer son indisponibilité ou être clairement désactivée.
- Toujours privilégier la mélodie, puis la couleur, puis la complexité.

## Identité visuelle

- Bleu nuit, or et champagne.
- Ambiance de studio nocturne et carnet d’orchestration moderne.
- Chrome subtil, lumière discrète et excellente lisibilité.
- Éviter le turquoise dominant, l’arcade, l’esthétique EDM et les effets « jouet ».
- Ne pas changer cette identité sans raison fonctionnelle précise.

## Architecture actuelle

Technologies :

- React 18
- TypeScript
- Vite
- Zustand
- Tone.js
- `@tonejs/midi`
- Lucide React

Organisation principale :

```text
src/
├── App.tsx       # interface, piano-roll, transport et inspecteur
├── audio.ts      # lecture Tone.js, mix, sends, loop et métronome
├── midi.ts       # création et téléchargement des fichiers MIDI
├── store.ts      # état du projet et commandes musicales
├── data.ts       # instruments et morceau de démonstration
├── types.ts      # contrats Project, Track, Note et Instrument
└── styles.css    # identité visuelle
```

Le modèle musical utilise des beats indépendants du rendu visuel. Une note contient `pitch`, `start`, `duration` et `velocity`. Une piste possède ses notes, son instrument, volume, pan, mute, solo et les deux sends.

## Les 12 instruments internes

1. GrandPianoSoft
2. ElectricPianoWarm
3. DoubleBassJazz
4. BassFingerRound
5. NylonGuitarWarm
6. ElectricGuitarLead
7. ElectricGuitarClean
8. ChamberStringsModern
9. FunkyBrassQuartet
10. WoodWindsClassical
11. VocalSectionSoul
12. DrumKitHybrid

Familles : Keys, Bass, Guitars, Orchestra, Soul/Pop et Rhythm.

## Effets prévus

- HallReverb
- StereoDelay

Chaque piste possède Reverb Send et Delay Send. La V0.1 applique déjà ces sends au moteur Tone.js. Les contrôles master détaillés et l’export WAV restent réservés à V3.

## État validé — V0.1 “No Dead Buttons”

Fonctionnel :

- trois pistes MIDI de démonstration ;
- lecture, pause, stop et retour au début ;
- tempo de 40 à 240 BPM ;
- boucle et métronome Tone.js ;
- sélection de piste ;
- mute et solo en temps réel ;
- sélection des 12 instruments ;
- volume, pan, Hall Reverb Send et Stereo Delay Send ;
- création de note par double-clic ;
- sélection simple ou multiple ;
- vélocité à la molette ;
- suppression des notes sélectionnées ;
- grille Snap cyclique ;
- quantification réelle ;
- zoom horizontal ;
- déplacement de la tête de lecture ;
- affichage/masquage de l’inspecteur ;
- sauvegarde locale JSON ;
- export MIDI standard ;
- confirmations et messages pour les actions futures.

Validation obtenue :

- build TypeScript/Vite réussi ;
- aucune erreur ou alerte console sur le test final ;
- fichier MIDI parsé avec signature `MThd` ;
- fichier de validation : 378 octets, 3 pistes, 29 notes, tempo 108 BPM.

## Fonctions volontairement différées

- Undo/Redo : V1
- Ajout/suppression complète de pistes : V1
- Outil crayon avancé, drag et resize : V1
- Mixer complet : V1
- Changement de signature : V1
- Chargement de projet local : V1
- ScoreEdition avec VexFlow : V2
- Export WAV et rendu hors-ligne : V3
- Contrôles master HallReverb/StereoDelay : V3
- AiXel Voicing Helper : V4
- AiXel Humanize : V4
- AiXel Orchestrate : V4
- AiXel Colors et templates : V4
- PWA, Capacitor et optimisation iOS : V5

## ADN harmonique AxelFisch

Le dictionnaire complet contient 20 couleurs signature :

1. Lydian Gold Maj9 — Cmaj9#11
2. Champagne Maj13 — Cmaj13
3. Bossa 6/9 — C6/9
4. Velvet Minor 9 — Cm9
5. Open Minor 11 — Cm11
6. Minor 6/9 Saudade — Cm6/9
7. Soul Dominant 13 — C13
8. Lydian Dominant 13#11 — C13#11
9. Altered Fire 7alt — C7alt
10. Suspended Gospel 13sus — C13sus4
11. Phrygian Suspense b9sus — C7sus4b9
12. Half-Dim Moon — Cm11b5
13. Dim Passing Spark — Cdim7
14. Quartal Cloud — empilement quartal
15. Pop Add9 Pearl — Cadd9
16. Minor Add9 Noir — Cmadd9
17. Augmented Dream — Cmaj7#5
18. Minor-Major Secret — CmMaj9
19. Pedal Lydian Stack — Cmaj9/D
20. Soul Cluster 13 — C13sus/add3

Règles : favoriser 9, 11, #11, 13 et 6/9 ; conserver tierce et septième ; omettre la quinte si nécessaire ; privilégier les voicings ouverts et respirants.

## Presets AiXel Colors prévus

- Velvet Jazz
- Bossa Moon
- Soul Chamber
- Quantum Ballad
- Funky Brass Night
- Naomi Savannah
- Kara MoonNight
- L’IÀm Cosmic
- Champagne Nocturne
- Blue Gold Studio

## Roadmap

- **V0** : preuve technique MIDI.
- **V0.1** : stabilisation “No Dead Buttons”, terminée.
- **V0.2 AiXelMidiComposer++** : mini-DAW MIDI plus utilisable, avec undo/redo, multi-drag, copy/paste, add/delete tracks, load local, mixer latéral, build/test validés.
- **V1** : édition MIDI complète mais simple, format de projet versionné, renommage, signature rythmique et bibliothèque complète.
- **V2** : ScoreEdition synchronisée.
- **V3** : effets finalisés et export WAV.
- **V4** : intelligence musicale AxelFisch.
- **V5** : PWA et iOS.

## Distribution macOS recommandée

Utiliser Tauri 2 seulement après stabilisation de V1 et du format de projet. Garder la web app comme source de vérité, ajouter `src-tauri/` comme enveloppe, puis remplacer progressivement les téléchargements web par les dialogues natifs. Tester WebAudio, sandbox, signature et notarisation macOS avant distribution.

## Interdictions actuelles

Ne pas ajouter maintenant :

- ScoreEdition ;
- export WAV ;
- version iOS ;
- IA supplémentaire ;
- pistes audio ;
- plugins externes ;
- cloud collaboratif ;
- fenêtres inutiles ;
- architecture plus complexe sans besoin démontré.

## Notes d'environnement (Mac local)

- `pnpm` n'est pas installé globalement sur cette machine et `npm install -g` / `corepack enable` échouent (permissions sur `/usr/local`, install Node sur le volume externe "Axel Drive"). Utiliser `npx pnpm install` puis `npx pnpm dev` / `npx pnpm run build` — fonctionne sans installation globale.
- Le dossier du projet est dans `~/Documents/Codex/...`, synchronisé iCloud avec "Optimiser le stockage Mac". Des fichiers (y compris parfois `node_modules`, `pnpm-lock.yaml` ou des fichiers `src/`) peuvent redevenir des placeholders cloud-only après un moment d'inactivité, ce qui casse `git add`, `tsc` ou `pnpm install` avec une erreur `Resource deadlock avoided` / `Unknown system error -35`. Solution : ouvrir les fichiers concernés (Finder → clic droit → Télécharger) ou les re-matérialiser avant de bosser dessus.

## Commandes de référence

```bash
pnpm install
pnpm dev
pnpm validate:midi
pnpm build
```

## Décision produit centrale

AiXel MIDI Composer doit rester un **petit atelier MIDI élégant avec l’accent harmonique d’Axel Fisch**. Il ne cherche pas à concurrencer Logic, Cubase, Ableton, Dorico ou Sibelius.
