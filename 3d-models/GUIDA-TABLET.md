# Modelli 3D su tablet — guida rapida

## Installare la PWA

1. Apri Chrome sul tablet Android
2. Vai su `farezero.org/3d-models/app.html`
3. Aspetta che i due modelli si carichino (barra verde di progresso)
4. Tocca il menu ⋮ in alto a destra → **Aggiungi a schermata Home**
5. Conferma il nome "FZ 3D" → **Aggiungi**

L'app compare sulla home screen come un'icona normale. Da quel momento si apre senza barra dell'indirizzo e senza interfaccia del browser.

## Usare l'app

- **Frecce laterali** o **swipe sulla barra in basso**: passa da un modello all'altro
- **Trascina con un dito** sul modello: ruota
- **Pizzica con due dita**: zoom
- **Due dita e trascina**: sposta la vista
- **Pulsante "i"** in alto a destra: mostra/nasconde la scheda informativa del modello

## Uscire dall'app

L'app blocca la navigazione per evitare uscite accidentali. Per uscire:

1. Tocca l'icona **lucchetto** in basso a destra
2. Digita il PIN **2024** sul tastierino
3. L'app torna al sito principale

PIN sbagliato: i pallini diventano rossi e si resettano, riprova.

## Blocco totale del tablet (kiosk)

Per impedire anche il cambio app e i gesti di sistema di Android:

1. Apri **Impostazioni → Sicurezza → Fissaggio schermo** (Screen Pinning)
2. Attiva l'opzione
3. Apri l'app FZ 3D
4. Dalla schermata delle app recenti, tocca l'icona dell'app → **Fissa**

Per sbloccare: tieni premuti insieme **Indietro + Panoramica** (o il gesto equivalente sul tuo tablet).

## Funzionamento offline

Dopo il primo caricamento completo (entrambi i modelli visualizzati almeno una volta), l'app funziona senza connessione. I file 3D (~37 MB) restano nella cache del browser.

Se aggiorni i modelli sul sito, svuota la cache dell'app: Impostazioni Android → App → Chrome → Spazio di archiviazione → Svuota cache.

## Cambiare il PIN

Il PIN è nella variabile `PIN_CODE` all'interno di `3d-models/app.html`, riga:

```js
var PIN_CODE = '2024';
```

Sostituisci `'2024'` con il codice che preferisci (4 cifre), committa e pusha.
