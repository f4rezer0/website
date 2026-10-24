(function () {
  "use strict";

  var API_KEY = "AIzaSyCikAZUPGhLxmwAp0VSuSD1v1cqyMinXmk";
  var CALENDAR_ID = "96cf05352a109587823a6db3f673f2ac0590896da054040a4aa4d7ab07e0439e@group.calendar.google.com";
  var MAX_EVENTS = 6;
  var SITE_TAG = "#sito";
  var FEATURED_TAG = "#evidenza";

  var container = document.getElementById("calendarEvents");
  if (!container) return;

  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
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

  function renderEvent(event) {
    var start = getStart(event);
    var day = start.getDate();
    var month = MONTHS[start.getMonth()];
    var dayName = DAYS[start.getDay()];

    var timeStr;
    if (isAllDay(event)) {
      if (isMultiDay(event)) {
        var end = getEnd(event);
        var endDisplay = new Date(end.getTime() - 86400000);
        timeStr = "Dal " + day + " " + month + " al " + endDisplay.getDate() + " " + MONTHS[endDisplay.getMonth()];
      } else {
        timeStr = "Tutto il giorno";
      }
    } else {
      timeStr = formatTime(start);
      if (event.end && event.end.dateTime) {
        timeStr += " – " + formatTime(getEnd(event));
      }
    }

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

  // Le descrizioni di Google Calendar possono contenere HTML: le riduce a testo
  // semplice (DOMParser non esegue script) e toglie i tag del sito.
  function descriptionText(html) {
    var text = (html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
    return new DOMParser().parseFromString(text, "text/html").body.textContent || "";
  }

  function cleanDescription(html) {
    return descriptionText(html)
      .split(SITE_TAG).join("")
      .split(FEATURED_TAG).join("")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasTag(event, tag) {
    return (event.description || "").indexOf(tag) !== -1;
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
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
  // Il link del pulsante e' il primo URL nella descrizione, altrimenti
  // l'evento su Google Calendar. Un URL che finisce in .png/.jpg/.jpeg/.webp/.svg
  // viene usato come immagine al posto del logo.
  function renderFeatured(events) {
    var box = document.getElementById("featuredEvent");
    if (!box) return;

    var event = null;
    for (var i = 0; i < events.length; i++) {
      if (hasTag(events[i], FEATURED_TAG)) { event = events[i]; break; }
    }
    if (!event) return;

    var start = getStart(event);
    var end = getEnd(event);
    var text = descriptionText(event.description);
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

    var when = DAYS[start.getDay()] + " " + start.getDate() + " " + MONTHS[start.getMonth()] + " " + start.getFullYear();
    if (!isAllDay(event)) {
      when += ", ore " + formatTime(start);
      if (event.end && event.end.dateTime) when += " – " + formatTime(end);
    }

    document.getElementById("fe-title").textContent = event.summary || "Evento";
    document.getElementById("fe-info").textContent =
      "📅 " + when + (event.location ? " · 📍 " + event.location : "");
    document.getElementById("fe-link").href = link || event.htmlLink;
    if (image) {
      var img = document.getElementById("fe-img");
      img.src = image;
      img.alt = event.summary || "";
    }

    var badge = document.getElementById("fe-badge");
    var cd = document.getElementById("fe-countdown");
    var ids = ["fe-days", "fe-hours", "fe-mins", "fe-secs"];
    var timer;
    function tick() {
      var diff = start - Date.now();
      if (diff <= 0) {
        badge.textContent = "In corso";
        cd.innerHTML = '<span style="color:var(--yellow);font-weight:800;font-size:1.1rem">\u{1F389} L\'evento è iniziato!</span>';
        clearInterval(timer);
        return;
      }
      document.getElementById(ids[0]).textContent = Math.floor(diff / 86400000);
      document.getElementById(ids[1]).textContent = Math.floor((diff % 86400000) / 3600000);
      document.getElementById(ids[2]).textContent = Math.floor((diff % 3600000) / 60000);
      document.getElementById(ids[3]).textContent = Math.floor((diff % 60000) / 1000);
    }
    timer = setInterval(tick, 1000);
    tick();

    box.hidden = false;
    // Il riquadro compare dopo la risposta del calendario: se l'utente ha gia'
    // superato quel punto, l'animazione "reveal" non scatterebbe piu'.
    box.classList.add("is-visible");
  }

  function fetchEvents() {
    var now = new Date().toISOString();
    var url = "https://www.googleapis.com/calendar/v3/calendars/" +
      encodeURIComponent(CALENDAR_ID) +
      "/events?key=" + API_KEY +
      "&timeMin=" + now +
      "&maxResults=25" +
      "&singleEvents=true&orderBy=startTime";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          var all = data.items || [];
          renderFeatured(all);
          var filtered = all.filter(function (e) {
            return hasTag(e, SITE_TAG);
          });
          render(filtered.slice(0, MAX_EVENTS));
        } catch (e) {
          render([]);
        }
      } else {
        render([]);
      }
    };
    xhr.onerror = function () { render([]); };
    xhr.send();
  }

  fetchEvents();
})();
