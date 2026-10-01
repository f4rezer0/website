(function () {
  "use strict";

  var API_URL = "https://api.farezero.org/garden/status";
  var el = document.getElementById("gardenIndicator");
  var text = document.getElementById("gardenText");
  if (!el || !text) return;

  function update(state) {
    var isOpen = state && state.open;
    el.classList.toggle("garden-open", isOpen);
    el.classList.toggle("garden-closed", !isOpen);
    text.innerHTML = isOpen ? "Giardino<br>aperto" : "Giardino<br>chiuso";
    el.style.display = "";
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
