(function () {
  "use strict";

  var API_URL = "https://api.farezero.org/garden/status";
  var fab = document.getElementById("gardenFab");
  var tooltip = document.getElementById("gardenTooltip");
  if (!fab || !tooltip) return;

  var tooltipTimer = null;

  function update(state) {
    var isOpen = state && state.open;
    fab.classList.toggle("garden-open", isOpen);
    fab.classList.toggle("garden-closed", !isOpen);
    fab.style.display = "";

    var msg = isOpen ? "🌿 Giardino aperto" : "🔒 Giardino chiuso";
    if (isOpen && state.since) {
      msg += " dal " + formatDate(state.since);
    }
    tooltip.textContent = msg;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) +
      " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  fab.addEventListener("click", function () {
    var open = tooltip.classList.contains("visible");
    if (open) {
      tooltip.classList.remove("visible");
      clearTimeout(tooltipTimer);
    } else {
      tooltip.classList.add("visible");
      tooltipTimer = setTimeout(function () {
        tooltip.classList.remove("visible");
      }, 4000);
    }
  });

  document.addEventListener("click", function (e) {
    if (!fab.contains(e.target)) {
      tooltip.classList.remove("visible");
      clearTimeout(tooltipTimer);
    }
  });

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
