const bilder = [
  { mappe: "./bilder/aladdin-1993" },
  { mappe: "./bilder/gangbro-1979" },
  { mappe: "./bilder/torget-1984" }
];

let gjeldendeIndex = 0;
let data = {};
let harGjettet = false;
let kart, brukerPin, fasitPin;

function startSpill() {
  document.getElementById("start-skjerm").style.display = "none";
  document.getElementById("spill-container").style.display = "block";
  initialiserKart();
  lastBilde();
}

function initialiserKart() {
  kart = L.map('kart').setView([59.12, 11.39], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap-bidragsytere'
  }).addTo(kart);

  kart.on('click', function (e) {
    if (brukerPin) kart.removeLayer(brukerPin);
    brukerPin = L.marker(e.latlng).addTo(kart);
    brukerPin.coords = [e.latlng.lat, e.latlng.lng];
  });
}

function lastBilde() {
  const mappe = bilder[gjeldendeIndex].mappe;

  fetch(`${mappe}/bilde.json`)
    .then(response => response.json())
    .then(json => {
      data = json;
      harGjettet = false;

      document.getElementById("spill-bilde").src = `${mappe}/bilde.jpg`;
      document.getElementById("gjetning").value = "";
      document.getElementById("gjetning").disabled = false;
      document.getElementById("tilbakemelding").textContent = "";
      document.getElementById("info").textContent = "";
      document.getElementById("beskrivelse").innerHTML = "";
      document.getElementById("neste-knapp").style.display = "none";
      document.querySelector("button[onclick='sjekkGjetning()']").style.display = "inline-block";

      if (brukerPin) {
        kart.removeLayer(brukerPin);
        brukerPin = null;
      }
    })
    .catch(error => {
      console.error("Feil ved lasting av bilde.json:", error);
      document.getElementById("tilbakemelding").textContent = "Kunne ikke laste bildeinformasjon.";
    });
}

function sjekkGjetning() {
  if (harGjettet) return;

  const input = document.getElementById("gjetning").value;
  if (!brukerPin) {
    alert("Klikk på kartet for å plassere pin!");
    return;
  }

  const årstallGjettet = parseInt(input);
  const årstallFasit = parseInt(data.svar);
  const årDiff = Math.abs(årstallGjettet - årstallFasit);
 
  
  const [lat1, lon1] = brukerPin.coords;
  const [lat2, lon2] = data.koordinat;
  const meterUnna = beregnAvstand(lat1, lon1, lat2, lon2);

  const tilbakemelding = document.getElementById("tilbakemelding");
  tilbakemelding.innerHTML = `Du var <strong>${årDiff}</strong> år unna og <strong>${meterUnna.toFixed(0)}</strong> meter fra riktig sted.`;
  info.innerHTML = '<i>Informasjon om bildet:<i>'

  document.getElementById("beskrivelse").innerHTML = data.beskrivelse;
  document.getElementById("neste-knapp").style.display = "inline-block";
  document.getElementById("gjetning").disabled = true;
  harGjettet = true;

  // Vis rød markør for riktig posisjon
if (fasitPin) kart.removeLayer(fasitPin);

const [riktLat, riktLng] = data.koordinat;
fasitPin = L.marker([riktLat, riktLng], {
  icon: L.icon({
    iconUrl: 'https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png',
    iconSize: [12, 12]
  })
}).addTo(kart);

// Sentrer kartet mellom brukerens gjetning og fasit
const bounds = L.latLngBounds([
  [riktLat, riktLng],
  brukerPin.coords
]);
kart.fitBounds(bounds, { padding: [30, 30] });
}

function nesteBilde() {
  gjeldendeIndex++;
  if (gjeldendeIndex < bilder.length) {
    lastBilde();
  } else {
    document.getElementById("spill-bilde").style.display = "none";
    document.getElementById("gjetning").style.display = "none";
    document.querySelector("button[onclick='sjekkGjetning()']").style.display = "none";
    document.getElementById("neste-knapp").style.display = "none";
    document.getElementById("tilbakemelding").textContent = "Spillet er ferdig!";
    document.getElementById("beskrivelse").innerHTML = "";
  }
}

function beregnAvstand(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meter
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
