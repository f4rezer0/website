# farezero.org

Sito di APS Fare Zero Makers Fab Lab. È un sito statico (HTML, CSS, JavaScript), senza PHP né database.

## Indice

- [Gestire gli eventi dal calendario](#gestire-gli-eventi-dal-calendario)
- [Link NFC con conteggio accessi](#link-nfc-con-conteggio-accessi)
- [Pubblicare modifiche al sito](#pubblicare-modifiche-al-sito)
- [Struttura del sito](#struttura-del-sito)
- [Problemi noti](#problemi-noti)

---

## Gestire gli eventi dal calendario

Gli eventi del sito vengono letti dal calendario Google **Fare Zero Makers**. Per pubblicare, modificare o togliere un evento **non serve toccare il sito**: basta modificare l'evento nel calendario. Le modifiche sono visibili subito, ricaricando la pagina.

Il sito usa:

| Campo del calendario | Dove compare |
|---|---|
| Titolo | titolo dell'evento |
| Data e ora di inizio/fine | data, orario e countdown |
| Luogo | "Dove" e link a Google Maps |
| Descrizione | testo dell'evento, più i tag spiegati sotto |

> Controllate bene orario di inizio e fine: se sono sbagliati nel calendario, sono sbagliati anche sul sito.

### I tag

I tag si scrivono **nella descrizione** dell'evento, in qualsiasi punto. Sul sito non vengono mostrati.

| Tag | Cosa fa |
|---|---|
| `#sito` | L'evento compare nella lista **Calendario attività** in home. Senza questo tag l'evento resta privato (es. riunioni). |
| `#evidenza` | L'evento diventa quello **principale** in home, nel riquadro grande con il countdown. Se più eventi hanno il tag, viene mostrato il più vicino; quando finisce, passa da solo al successivo. |
| `#icona 🎃` | Mostra l'emoji accanto all'evento, al posto del logo Fare Zero. Funziona con qualsiasi emoji. |
| `#pagina https://...` | "Scopri di più" apre questa pagina invece di quella automatica. Serve solo per eventi con una pagina fatta a mano, come `linuxday/`. |

`#sito` e `#evidenza` sono indipendenti: per avere l'evento sia nel riquadro grande sia nella lista, mettete entrambi.

### Link e moduli di iscrizione

Ogni link nella descrizione diventa un **pulsante** nella pagina dell'evento. Il testo scritto **prima del link, sulla stessa riga**, diventa il testo del pulsante:

```
Iscrizione adulti: https://forms.gle/...
Iscrizione bambini: https://forms.gle/...
```

Senza testo prima, un modulo Google diventa "Iscriviti" e gli altri link "Apri il link". Il primo pulsante è verde, gli altri sono bordati.

### Locandina

Un link a un'immagine (che finisce in `.jpg`, `.png`, `.webp` o `.svg`) nella descrizione viene mostrato come locandina nella pagina dell'evento e al posto del logo in home. L'immagine deve essere pubblica: un link a Google Drive non funziona.

### Esempio completo

```
Serata a tema Halloween con giochi da tavolo e di ruolo per ragazzi e adulti.

Iscrizione adulti: https://forms.gle/xxxx
Iscrizione bambini: https://forms.gle/yyyy

#icona 🎃
#sito #evidenza
```

### La pagina dell'evento

"Scopri di più" apre `farezero.org/evento/?id=...`, una pagina creata in automatico con titolo, countdown, data, luogo con mappa, descrizione, pulsanti dei link e il pulsante **Aggiungi al calendario** per chi visita.

### Luoghi

Se il luogo contiene "Barbaro Forleo", il sito mostra **Biblioteca Comunale «G. Calò»** con l'indirizzo sotto. Per aggiungere altri luoghi: lista `PLACES` in `js/calendar.js`.

---

## Link NFC con conteggio accessi

`https://farezero.org/nfc/` porta alla home e conta gli accessi. È il link da scrivere nei tag NFC.

- Il conteggio è su **GoatCounter**: https://farezero.goatcounter.com (serve il login), percorso `/nfc`.
- GoatCounter non usa cookie e non salva IP: si vedono solo i totali, non i singoli visitatori.
- Chi usa un ad blocker non viene contato.
- Il redirect funziona anche se GoatCounter non risponde.

---

## Pubblicare modifiche al sito

Ogni push sul branch `main` pubblica il sito su Tophost in automatico (`.github/workflows/deploy.yml`):

1. GitHub Actions copia il repo sul server di appoggio;
2. `lftp` sincronizza i file con `/htdocs` su Tophost.

L'avanzamento si vede in **Actions**, alla voce "Deploy to Tophost".

Attenzione:
- il deploy usa `mirror --delete`: **un file cancellato dal repo viene cancellato anche dal sito**. Non caricate file sul server via FTP a mano: verrebbero cancellati al deploy successivo;
- le credenziali FTP e SSH sono nei *secrets* del repo (Settings → Secrets and variables → Actions), non nel codice.

### Modificare un file da telefono

Su github.com: aprite il file, matita ✏️, modificate e premete **Commit changes** su `main`. Il deploy parte da solo.

### Cache

Dopo una modifica a `css/style.css` o ai file in `js/`, aumentate il numero di versione nel tag che li carica (es. `calendar.js?v=4` → `?v=5`) in `index.html` e `evento/index.html`. Altrimenti i telefoni possono continuare a usare la versione vecchia.

---

## Struttura del sito

| Percorso | Contenuto |
|---|---|
| `index.html` | home |
| `css/style.css` | stile della home |
| `js/script.js` | menu, animazioni, mappa |
| `js/calendar.js` | lettura del calendario Google, lista eventi ed evento in evidenza |
| `js/garden.js` | indicatore "giardino aperto/chiuso" (da `api.farezero.org`) |
| `evento/` | pagina automatica dell'evento |
| `linuxday/` | pagina fatta a mano del Linux Day 2026 |
| `nfc/` | redirect con conteggio per i tag NFC |
| `3d-models/` | visualizzatore modelli 3D per tablet (vedi `3d-models/GUIDA-TABLET.md`) |
| `privacy/` | privacy e cookie policy |

Se aggiungete un servizio esterno (script, font, contatori), aggiornate la tabella dei servizi di terze parti in `privacy/index.html`.

---

## Problemi noti

- **Chiave API di Google su `farezero.org` senza "www"**: la chiave usata in `js/calendar.js` accetta richieste solo da `www.farezero.org`. Se il sito si apre anche senza "www" e non reindirizza, gli eventi non compaiono. Soluzione: nella Google Cloud Console, aggiungere `https://farezero.org/*` ai referrer autorizzati della chiave.
- **Anteprime social**: la pagina `evento/` è generata nel browser, quindi WhatsApp e Facebook mostrano un'anteprima generica. Per un'anteprima con titolo e immagine dell'evento serve una pagina fatta a mano (con `#pagina`).
- **Leaflet da unpkg**: la mappa in home carica Leaflet da `unpkg.com` senza controllo di integrità (SRI).
