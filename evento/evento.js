(function () {
  "use strict";

  var C = window.FZCal;
  var state = document.getElementById("ev-state");

  function $(id) { return document.getElementById(id); }

  function showError() {
    state.innerHTML = 'Evento non trovato. <a href="../#eventi">Torna agli eventi</a>';
  }

  // Data in formato Google Calendar: 20261030T170000Z, o 20261030 per tutto il giorno
  function gcalDate(event, which) {
    var raw = event[which];
    if (raw.date) return raw.date.replace(/-/g, "");
    return new Date(raw.dateTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  // Testo con i link resi cliccabili, costruito senza innerHTML
  function fillLinked(el, text) {
    var re = /https?:\/\/[^\s<>"]+/g;
    var last = 0;
    var m;
    while ((m = re.exec(text))) {
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement("a");
      a.href = m[0];
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = m[0];
      el.appendChild(a);
      last = m.index + m[0].length;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }

  function render(event) {
    var start = C.getStart(event);
    var extras = C.eventExtras(event);
    var title = event.summary || "Evento";

    document.title = title + " | Fare Zero";
    $("ev-title").textContent = title;
    $("ev-subtitle").textContent = "Francavilla Fontana · " + C.longDate(event);
    $("ev-date").textContent = C.longDate(event);
    $("ev-time").textContent = C.isAllDay(event) ? C.timeRange(event) : "Ore " + C.timeRange(event);

    if (extras.icon) {
      var icon = document.createElement("span");
      icon.className = "hero-icon";
      icon.textContent = extras.icon;
      icon.setAttribute("aria-hidden", "true");
      $("ev-logos").appendChild(icon);
    }

    if (extras.image) {
      $("ev-poster-img").src = extras.image;
      $("ev-poster-img").alt = "Locandina " + title;
      $("ev-poster-link").href = extras.image;
      $("ev-poster").hidden = false;
    }

    var location = event.location || "";
    var place = C.placeName(location);
    $("ev-place").textContent = place || location || "Da definire";
    $("ev-address").textContent = place ? location : "";
    if (location) {
      $("ev-map").href = "https://maps.google.com/?q=" + encodeURIComponent(location);
    } else {
      $("ev-map").hidden = true;
    }

    var body = C.descriptionBody(event.description);
    if (body) {
      fillLinked($("ev-desc"), body);
      $("ev-desc-section").hidden = false;
    }

    $("ev-gcal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(title) +
      "&dates=" + gcalDate(event, "start") + "/" + gcalDate(event, "end") +
      "&details=" + encodeURIComponent(body + "\n\nhttps://www.farezero.org/evento/?id=" + event.id) +
      "&location=" + encodeURIComponent(location) +
      "&ctz=Europe/Rome";

    if (C.getEnd(event) <= Date.now()) {
      $("ev-label").textContent = "Concluso";
      $("countdown").hidden = true;
    } else {
      C.countdown(start, ["cd-days", "cd-hours", "cd-mins", "cd-secs"], function () {
        $("ev-label").textContent = "In corso";
        $("countdown").innerHTML = '<p style="color:var(--yellow);font-weight:800;font-size:1.2rem">\u{1F389} Ci siamo! L\'evento è iniziato!</p>';
      });
    }

    state.hidden = true;
    $("ev-page").hidden = false;
  }

  var id = new URLSearchParams(location.search).get("id");
  if (id) {
    C.fetchEvent(id, function (event) {
      if (event && event.status !== "cancelled") render(event); else showError();
    });
  } else {
    C.fetchEvents(function (events) {
      var event = events && C.findFeatured(events);
      if (event) render(event); else showError();
    });
  }
})();
