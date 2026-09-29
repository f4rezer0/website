(function () {
  "use strict";

  var API_URL = "https://api.farezero.org/garden/status";
  var badge = document.getElementById("gardenBadge");
  if (!badge) return;

  var dot = badge.querySelector(".garden-dot");
  var label = badge.querySelector(".garden-label");

  function update(state) {
    var isOpen = state && state.open;
    badge.classList.toggle("garden-open", isOpen);
    badge.classList.toggle("garden-closed", !isOpen);
    dot.classList.toggle("pulse", isOpen);
    label.textContent = isOpen ? "Giardino aperto" : "Giardino chiuso";
    badge.title = isOpen
      ? "Il giardino è aperto dal " + formatDate(state.since)
      : "Il giardino è attualmente chiuso";
    badge.style.display = "";
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  function fetch_status() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_URL);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { update(JSON.parse(xhr.responseText)); } catch (e) {}
      }
    };
    xhr.send();
  }

  fetch_status();
  setInterval(fetch_status, 60000);
})();
