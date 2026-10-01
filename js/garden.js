(function () {
  "use strict";

  var API_URL = "https://api.farezero.org/garden/status";
  var strip = document.getElementById("gardenStrip");
  var text = document.getElementById("gardenText");
  if (!strip || !text) return;

  function update(state) {
    var isOpen = state && state.open;
    strip.classList.toggle("garden-open", isOpen);
    strip.classList.toggle("garden-closed", !isOpen);
    text.textContent = isOpen ? "Giardino aperto" : "Giardino chiuso";
    strip.style.display = "";
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
