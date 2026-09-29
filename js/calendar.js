(function () {
  "use strict";

  var API_KEY = "AIzaSyCikAZUPGhLxmwAp0VSuSD1v1cqyMinXmk";
  var CALENDAR_ID = "96cf05352a109587823a6db3f673f2ac0590896da054040a4aa4d7ab07e0439e@group.calendar.google.com";
  var MAX_EVENTS = 6;
  var SITE_TAG = "#sito";

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
    var description = (event.description || "").replace(SITE_TAG, "").trim();
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
          var filtered = all.filter(function (e) {
            return (e.description || "").indexOf(SITE_TAG) !== -1;
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
