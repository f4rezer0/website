(function () {
  "use strict";

  var API_KEY = "AIzaSyCikAZUPGhLxmwAp0VSuSD1v1cqyMinXmk";
  var CALENDAR_ID = "96cf05352a109587823a6db3f673f2ac0590896da054040a4aa4d7ab07e0439e@group.calendar.google.com";
  var MAX_EVENTS = 6;
  var SITE_TAG = "#sito";
  var FEATURED_TAG = "#evidenza";
  // "#icona 🎃" nella descrizione: emoji mostrata al posto del logo
  var ICON_RE = /#icona[ \t ]*(\S+)/i;

  // Luoghi noti: indirizzo del calendario -> nome da mostrare
  var PLACES = [
    { match: "Barbaro Forleo", name: "Biblioteca Comunale «G. Calò»" }
  ];

  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var MONTHS_LONG = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  function pad(n) { return n < 10 ? "0" + n : n; }

  function formatTime(date) {
    return pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function isAllDay(event) {
    return !!event.start.date;
  }

  function getStart(event) {
    return new Date(event.start.dateTime || event.start.date);
  }

  function getEnd(event) {
    return new Date(event.end.dateTime || event.end.date);
  }

  function isMultiDay(event) {
    var start = getStart(event);
    var end = getEnd(event);
    if (isAllDay(event)) {
      var diff = (end - start) / 86400000;
      return diff > 1;
    }
    return start.toDateString() !== end.toDateString();
  }

  function timeRange(event) {
    if (isAllDay(event)) {
      if (isMultiDay(event)) {
        var start = getStart(event);
        var endDisplay = new Date(getEnd(event).getTime() - 86400000);
        return "Dal " + start.getDate() + " " + MONTHS[start.getMonth()] + " al " + endDisplay.getDate() + " " + MONTHS[endDisplay.getMonth()];
      }
      return "Tutto il giorno";
    }
    var str = formatTime(getStart(event));
    if (event.end && event.end.dateTime) {
      str += " – " + formatTime(getEnd(event));
    }
    return str;
  }

  function longDate(event) {
    var d = getStart(event);
    return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS_LONG[d.getMonth()] + " " + d.getFullYear();
  }

  // Le descrizioni di Google Calendar possono contenere HTML: le riduce a testo
  // semplice (DOMParser non esegue script).
  function descriptionText(html) {
    var text = (html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
    return new DOMParser().parseFromString(text, "text/html").body.textContent || "";
  }

  // Testo della descrizione senza i tag del sito, con gli a capo
  function descriptionBody(html) {
    return descriptionText(html)
      .replace(ICON_RE, "")
      .split(SITE_TAG).join("")
      .split(FEATURED_TAG).join("")
      .replace(/[ \t ]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function cleanDescription(html) {
    return descriptionBody(html).replace(/\s+/g, " ").trim();
  }

  function hasTag(event, tag) {
    return (event.description || "").indexOf(tag) !== -1;
  }

  // Dati extra presi dalla descrizione: icona, immagine e link
  function eventExtras(event) {
    var text = descriptionText(event.description);
    var icon = text.match(ICON_RE);
    var urls = text.match(/https?:\/\/[^\s<>"]+/g) || [];
    var image = null;
    var link = null;
    urls.forEach(function (u) {
      if (/\.(png|jpe?g|webp|svg)(\?.*)?$/i.test(u)) {
        if (!image) image = u;
      } else if (!link) {
        link = u;
      }
    });
    return { icon: icon ? icon[1] : null, image: image, link: link };
  }

  function placeName(location) {
    if (!location) return null;
    for (var i = 0; i < PLACES.length; i++) {
      if (location.indexOf(PLACES[i].match) !== -1) return PLACES[i].name;
    }
    return null;
  }

  function placeLabel(location) {
    return placeName(location) || location || "";
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function apiUrl(path, params) {
    return "https://www.googleapis.com/calendar/v3/calendars/" +
      encodeURIComponent(CALENDAR_ID) + path + "?key=" + API_KEY + (params || "");
  }

  function getJson(url, done) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { done(JSON.parse(xhr.responseText)); return; } catch (e) {}
      }
      done(null);
    };
    xhr.onerror = function () { done(null); };
    xhr.send();
  }

  // Eventi futuri o in corso, in ordine di inizio
  function fetchEvents(done) {
    var now = new Date().toISOString();
    getJson(apiUrl("/events", "&timeMin=" + now + "&maxResults=25&singleEvents=true&orderBy=startTime"), function (data) {
      done(data ? data.items || [] : null);
    });
  }

  function fetchEvent(id, done) {
    getJson(apiUrl("/events/" + encodeURIComponent(id)), done);
  }

  function findFeatured(events) {
    for (var i = 0; i < events.length; i++) {
      if (hasTag(events[i], FEATURED_TAG)) return events[i];
    }
    return null;
  }

  // Link alla pagina dell'evento: un link nella descrizione (es. una pagina
  // fatta a mano come linuxday/) ha la precedenza sulla pagina automatica.
  function eventPageUrl(event, base) {
    return eventExtras(event).link || (base || "") + "evento/?id=" + encodeURIComponent(event.id);
  }

  // Countdown nei 4 elementi ids (giorni, ore, minuti, secondi)
  function countdown(start, ids, onStart) {
    var timer;
    function tick() {
      var diff = start - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        onStart();
        return;
      }
      document.getElementById(ids[0]).textContent = Math.floor(diff / 86400000);
      document.getElementById(ids[1]).textContent = Math.floor((diff % 86400000) / 3600000);
      document.getElementById(ids[2]).textContent = Math.floor((diff % 3600000) / 60000);
      document.getElementById(ids[3]).textContent = Math.floor((diff % 60000) / 1000);
    }
    timer = setInterval(tick, 1000);
    tick();
  }

  window.FZCal = {
    MONTHS: MONTHS,
    DAYS: DAYS,
    getStart: getStart,
    getEnd: getEnd,
    isAllDay: isAllDay,
    timeRange: timeRange,
    longDate: longDate,
    descriptionBody: descriptionBody,
    eventExtras: eventExtras,
    placeName: placeName,
    placeLabel: placeLabel,
    fetchEvents: fetchEvents,
    fetchEvent: fetchEvent,
    findFeatured: findFeatured,
    countdown: countdown
  };

  /* ---------- home page ---------- */

  var container = document.getElementById("calendarEvents");
  if (!container) return;

  function renderEvent(event) {
    var start = getStart(event);
    var day = start.getDate();
    var month = MONTHS[start.getMonth()];
    var dayName = DAYS[start.getDay()];

    var timeStr = timeRange(event);
    var location = event.location || "";
    var description = cleanDescription(event.description);
    if (description.length > 120) {
      description = description.substring(0, 117) + "…";
    }

    var card = document.createElement("a");
    card.className = "cal-card";
    card.href = event.htmlLink;
    card.target = "_blank";
    card.rel = "noopener";

    card.innerHTML =
      '<div class="cal-date-badge">' +
        '<span class="cal-day">' + day + '</span>' +
        '<span class="cal-month">' + month + '</span>' +
      '</div>' +
      '<div class="cal-info">' +
        '<div class="cal-title">' + escapeHtml(event.summary || "Evento") + '</div>' +
        '<div class="cal-meta">' +
          '<span class="cal-meta-item">' + dayName + ' · ' + timeStr + '</span>' +
          (location ? '<span class="cal-meta-item cal-location">' + escapeHtml(location) + '</span>' : '') +
        '</div>' +
        (description ? '<div class="cal-desc">' + escapeHtml(description) + '</div>' : '') +
      '</div>';

    return card;
  }

  function render(events) {
    container.innerHTML = "";

    if (!events || events.length === 0) {
      container.innerHTML = '<div class="cal-empty">Nessun evento in programma al momento.</div>';
      return;
    }

    events.forEach(function (event) {
      container.appendChild(renderEvent(event));
    });
  }

  // Evento in evidenza: il primo evento futuro (o in corso) con #evidenza.
  // Il pulsante porta alla pagina dell'evento (vedi eventPageUrl). Al posto del
  // logo: l'emoji di "#icona", altrimenti un URL di immagine nella descrizione.
  function renderFeatured(events) {
    var box = document.getElementById("featuredEvent");
    if (!box) return;

    var event = findFeatured(events);
    if (!event) return;

    var start = getStart(event);
    var extras = eventExtras(event);
    var when = DAYS[start.getDay()] + " " + start.getDate() + " " + MONTHS[start.getMonth()] + " " + start.getFullYear();
    if (!isAllDay(event)) when += ", ore " + timeRange(event);

    document.getElementById("fe-title").textContent = event.summary || "Evento";
    document.getElementById("fe-info").textContent =
      "📅 " + when + (event.location ? " · 📍 " + placeLabel(event.location) : "");

    var link = document.getElementById("fe-link");
    link.href = eventPageUrl(event);
    if (!extras.link) {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }

    var logo = document.getElementById("fe-logo");
    if (extras.icon) {
      logo.textContent = extras.icon;
      logo.classList.add("event-card-icon");
      logo.setAttribute("role", "img");
      logo.setAttribute("aria-label", event.summary || "");
    } else if (extras.image) {
      var img = document.getElementById("fe-img");
      img.src = extras.image;
      img.alt = event.summary || "";
    }

    var badge = document.getElementById("fe-badge");
    var cd = document.getElementById("fe-countdown");
    countdown(start, ["fe-days", "fe-hours", "fe-mins", "fe-secs"], function () {
      badge.textContent = "In corso";
      cd.innerHTML = '<span style="color:var(--yellow);font-weight:800;font-size:1.1rem">\u{1F389} L\'evento è iniziato!</span>';
    });

    box.hidden = false;
    // Il riquadro compare dopo la risposta del calendario: se l'utente ha gia'
    // superato quel punto, l'animazione "reveal" non scatterebbe piu'.
    box.classList.add("is-visible");
  }

  fetchEvents(function (all) {
    if (!all) {
      render([]);
      return;
    }
    try {
      renderFeatured(all);
    } catch (e) {}
    render(all.filter(function (e) {
      return hasTag(e, SITE_TAG);
    }).slice(0, MAX_EVENTS));
  });
})();
