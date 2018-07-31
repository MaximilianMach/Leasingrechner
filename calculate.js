/* FORMATIERUNGEN */
/* -------------- */
function format(number) {
  if (!isNaN(number)) {
    return number.toLocaleString(
      "de-DE",
      {
        style: "currency",
        currency: "EUR"
      }
    );
  } else return "0,00 €";
}
// Prozent-Formatierung
function pFormat(number) {
  if (!isNaN(number)) {
    return number.toLocaleString(
      "de-DE",
      {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
  } else return "0,00 %";
}
// Deformatierung (fürs rechnen)
function deformat(number) {
  number = number.toString();
  while (number.includes(".")) {
    number = number.replace(".", "");
  }
  number = number.replace("€", "");
  number = number.trim();
  number = number.replace(",", ".");
  return parseFloat(number);
}
/*  Bei focus -> Deformat()    
    Da es sonst beim Format() zum Fehler kommt:   */
function gotFocus(input) {
  // Wenn noch kein Wert vorhanden -> wird zu 0
  input.value = input.value || 0;
  input.value = deformat(input.value);

  input.value = input.value.replace(".", ",");
  input.select();
}
/*  mit n auf focus überprüfen 
    sonst würde bei keiner änderung des input.values, 
    der Dezimalpunkt entfernt werden                  */
function lostFocus(input) {
  input.value = format(deformat(input.value) * 1.0);
  calculate();
  configAusgabe(input);
}
function configPercent(percent, input, max, min) {
  percent.value = deformat(input.value) / deformat(kaufpreis.value);
  if (max && percent.value > max)
    percent.value = "> " + (max * 100.0).toLocaleString("de-DE" , {minimumFractionDigits: 2}) + " %";
  else if (min && min > percent.value)
    percent.value = "< " + (min * 100.0).toLocaleString("de-DE", {minimumFractionDigits: 2}) +  " %";
  else percent.value = pFormat(percent.value * 1.0);
}

/* Input konfigurieren */
/* ------------------- */

// überprüft inputs auf nummer, macht ein komma aus punkt & erlaubt nur ein komma
function configInput(input) {
  // Dezimalpunkt in Komma umwandeln (aufgrund von Deformat())
  if (input.value.includes(".")) input.value = input.value.replace(".", ",");
  // Buchstaben rausschmeißen
  var num = input.value.replace(",", ".");
  if (!(num == parseFloat(num))) {
    if (input.value[input.value.length - 1] != ",")
      input.value = input.value.replace(
        input.value[input.value.length - 1],
        ""
      );
  }
  let tmp = input.value.indexOf(",");
  // nicht mehr als ein Komma möglich
  if (input.value.includes(",", ++tmp)) {
    let n = input.value.indexOf(",", tmp);
    let show = input.value.substring(0, n);
    input.value = show;
  }
}
// aktiviert ausgabe erst, wenn alle eingabe felder beschrieben sind
function configAusgabe() {
  var eingabe = Array (kaufpreis, laufzeitInput, eigenleistungInput, restwertInput);
    let get = document.getElementsByClassName("output");
  let ausgabe = []; // enthält die zu behandelnde elemente
  for (var i = get.length; i--; ausgabe.unshift(get[i])); // erstellt aus dem get node ein array
  ausgabe.splice(0, 2); // Percent outputs ignorieren
  calculate();
  // leert den Inhalt der Outputs
  for (let ein of eingabe) deformat(ein.value) ? ausgabe.value : ausgabe = ausgabe.map(x => x.value = ""); 
  setUpBearbeitungsgebühr();
  }

/* Funktionen abrufen */
/* ------------------ */
function calculate() {
  setUpEntgelt();
  setUpRechtsgeschäftsgebühr();
  setUpEffektivzinssatz();
  setUpGesamtbelastung();
  setUpGesamtzinsen();
  setUpFinanzierungsbeitrag();
}

/* Vertragsmodell konfiguration */
/* ---------------------------- */
var vertragsmodell = document.getElementById("vg");
vertragsmodell.oninput = () => configAusgabe();

/* Tarifmodell konfiguration */
/* ------------------------- */
var tarifmodell = document.getElementById("tm");
tarifmodell.oninput = () => configAusgabe();

/* Kaufpreis konfiguration */
/* ----------------------- */
var kaufpreis = document.getElementById("kp");
kaufpreis.oninput = function() {
  configInput(kaufpreis);
  setUpKaufpreis();
  // configAusgabe();
};
// überprüft, ob die inputs vom kaufpreis disabled wurden
function setUpKaufpreis() {
  /* INPUT KONFIGURATION */
  // zu deaktivierende Elemente
  var input = new Array(
    eigenleistungInput,
    eigenleistungRange,
    restwertInput,
    restwertRange
  );
  // Inputs aktivieren wenn kaufpreis != leer
  if (deformat(kaufpreis.value)) 
    for (let temp of input) temp.disabled = false;
  // inputs deaktivieren wenn kaufpreis ungültig oder 0
  else {
    for (let temp of input) {
      temp.disabled = true;
      temp.value = null;
    }
  }
}

kaufpreis.onfocus = () => gotFocus(kaufpreis);
kaufpreis.onchange = () => calculate();
kaufpreis.onblur = () => lostFocus(kaufpreis);

/* Laufzeit konfiguration */
/* ---------------------- */
var laufzeitInput = document.getElementById("lzi");
var laufzeitRange = document.getElementById("lzr");

laufzeitInput.oninput = function() {
  syncLaufzeit(false);
  configInput(laufzeitInput);
  // configAusgabe();
};
laufzeitRange.oninput = () => syncLaufzeit(true);

function syncLaufzeit(callingFromRange) {
  if (callingFromRange) laufzeitInput.value = format(laufzeitRange.value);
  else laufzeitRange.value = laufzeitInput.value;
}

laufzeitInput.onchange = function() {
  // aufrunden
  if (laufzeitInput.value.includes(",")) {
    let temp = laufzeitInput.value.replace(",", ".");
    temp = Math.round(parseFloat(temp));
    laufzeitInput.value = temp;
  }
  if (laufzeitInput.value < 24) laufzeitInput.value = 24;
  if (laufzeitInput.value > 72) laufzeitInput.value = 72;
};
laufzeitInput.onblur = () => configAusgabe();

/* Eigenleistung konfigurieren */
/* --------------------------- */
var eigenleistungInput = document.getElementById("eli");
var eigenleistungRange = document.getElementById("elr");
var eigenleistungPercent = document.getElementById("elp");

eigenleistungRange.oninput = () => syncEigenleistung(true);
eigenleistungInput.oninput = function() {
  configInput(eigenleistungInput);
  syncEigenleistung(false);
  // configAusgabe();
};

function changeEigenleistung() {
  if (
    deformat(eigenleistungInput.value) / deformat(kaufpreis.value) >
    0.4666666666
  )
    eigenleistungInput.value = format(deformat(kaufpreis.value) * 0.466);
  // user benachrichtigen
  else
    eigenleistungInput.value = format(deformat(eigenleistungInput.value) * 1.0);

  // configPercent(eigenleistungPercent, eigenleistungInput);
  syncEigenleistung(false);
}

function syncEigenleistung(callingFromRange) {
  if (callingFromRange) {
    eigenleistungInput.value = format(
      (eigenleistungRange.value * deformat(kaufpreis.value)) / 1000
    );
  } else if (!callingFromRange) {
    eigenleistungRange.value =
      (deformat(eigenleistungInput.value) / deformat(kaufpreis.value)) * 1000;
  }

  configPercent(eigenleistungPercent, eigenleistungInput, 0.466);
}

eigenleistungInput.onfocus = () => gotFocus(eigenleistungInput);
eigenleistungInput.onchange = () => changeEigenleistung();
eigenleistungInput.onblur = () => lostFocus(eigenleistungInput);

/* Restwert konfigurieren */
/* ---------------------- */
var restwertInput = document.getElementById("rwi");
var restwertRange = document.getElementById("rwr");
var restwertPercent = document.getElementById("rwp");

restwertInput.oninput = function() {
  syncRestwert(false);
  configInput(restwertInput);
  // configAusgabe(restwertInput);
};
restwertRange.oninput = () => syncRestwert(true);

function changeRestwert() {
  // user benachrichtigen
  // zu wenig
  if (deformat(restwertInput.value) / deformat(kaufpreis.value) < 0.1)
    restwertInput.value = format(deformat(kaufpreis.value) * 0.1);
  // zu viel
  if (deformat(restwertInput.value) / deformat(kaufpreis.value) > 0.5)
    restwertInput.value = format(deformat(kaufpreis.value) * 0.5);
  syncRestwert(false);
}

function syncRestwert(callingFromRange) {
  if (callingFromRange) {
    restwertInput.value = format(
      (deformat(kaufpreis.value) * restwertRange.value) / 1000.0
    );
  } else if (!callingFromRange) {
    restwertRange.value =
      (deformat(restwertInput.value) * 1000.0) / deformat(kaufpreis.value);
  }
  configPercent(restwertPercent, restwertInput, 0.5, 0.1);
}

restwertInput.onfocus = () => gotFocus(restwertInput);
restwertInput.onchange = () => changeRestwert();
restwertInput.onblur = () => lostFocus(restwertInput);

/* Entgelt konfigurieren */
/* --------------------- */
var entgelt = document.getElementById("eg");
var entgeltValue; // gegen Rundungsfehler
function setUpEntgelt() {
  let zins = (0.0225 + (1 - vertragsmodell.value) * 0.0025) / 12.0,
    zzr = deformat(laufzeitInput.value);
  let bw =
    (deformat(kaufpreis.value) - deformat(eigenleistungInput.value)) *
    (1 + tarifmodell.value / 100.0);
  let zw = -deformat(restwertInput.value);
  entgeltValue = -rmz(zins, zzr, bw, zw, 0);
  entgelt.value = format(entgeltValue);
}

// Excel function
function rmz(zins, zzr, bw, zw, f) {
  if (!zw) zw = 0;
  if (!f) f = 0;

  if (zins == 0) return -(bw + zw) / zzr;

  let tmp = Math.pow(1 + zins, zzr);
  let rmz = (zins / (tmp - 1)) * -(bw * tmp + zw);

  if (f == 1) {
    rmz /= 1 + zins;
  }

  return rmz;
}

/* Rechtsgeschäftsgebühr konfigurieren */
/* ----------------------------------- */
var rechtsgeschäftsgebühr = document.getElementById("rg");
var setUpRechtsgeschäftsgebühr = function setUpRechtsgeschäftsgebühr() {
  rechtsgeschäftsgebühr.value = format(
    Math.round(
      (deformat(entgelt.value) * 36 + deformat(eigenleistungInput.value)) * 0.01
    ) * vertragsmodell.value
  );
};

/* Bearbeitungsgebühr konfigurieren */
/* -------------------------------- */
var bearbeitungsgebühr = document.getElementById("bg");
function setUpBearbeitungsgebühr() {
  bearbeitungsgebühr.value = format(tarifmodell.value * 50);
}

/* Effektivzinssatz konfigurieren */
/* ------------------------------ */
var effektivzinssatz = document.getElementById("ez");
function setUpEffektivzinssatz() {
  effektivzinssatz.value = pFormat(
    Math.pow(
      1 +
        zins(
          deformat(laufzeitInput.value),
          -entgeltValue,
          deformat(kaufpreis.value) -
            deformat(eigenleistungInput.value) -
            deformat(bearbeitungsgebühr.value) -
            deformat(rechtsgeschäftsgebühr.value),
          -deformat(restwertInput.value),
          1
        ),
      12
    ) - 1.0
  );
}
function zins(zins, rmz, bw, zw, f, sw) {
  sw = typeof sw !== "undefined" ? sw : 0.1;

  // Sets the limits for possible guesses to any
  // number between 0% and 100%
  var lowerLimit = 0.0;
  var upperLimit = 1.0;

  // Defines a tolerance of up to +/- 0.00005% of pmt, to accept
  // the solution as valid.
  var toleranz = Math.abs(0.0000000005 * rmz);

  // Tries at most 40 times to find a solution within the tolerance.
  for (let i = 0; i < 40; i++) {
    // Resets the balance to the original pv.
    var balance = bw;

    // Calculates the balance at the end of the loan, based
    // on loan conditions.
    for (var j = 0; j < zins; j++) {
      if (f == 0) {
        // Interests applied before payment
        balance = balance * (1.0 + sw) + rmz;
      } else {
        // Payments applied before insterests
        balance = (balance + rmz) * (1.0 + sw);
      }
    }

    // Returns the guess if balance is within tolerance.  If not, adjusts
    // the limits and starts with a new guess.
    if (Math.abs(balance + zw) < toleranz) {
      return sw;
    } else if (balance + zw > 0.0) {
      // Sets a new highLimit knowing that
      // the current guess was too big.
      upperLimit = sw;
    } else {
      // Sets a new lowLimit knowing that
      // the current guess was too small.
      lowerLimit = sw;
    }

    // Calculates the new guess.
    sw = (upperLimit + lowerLimit) / 2.0;
  }

  // Returns null if no acceptable result was found after 40 tries.
  return null;
}

/* Gesamtbelastung konfigurieren */
/* ----------------------------- */
var gesamtbelastung = document.getElementById("gb");
function setUpGesamtbelastung() {
  gesamtbelastung.value = format(
    entgeltValue * deformat(laufzeitInput.value) +
      deformat(eigenleistungInput.value) +
      deformat(restwertInput.value) +
      deformat(rechtsgeschäftsgebühr.value) +
      deformat(bearbeitungsgebühr.value)
  );
}

/* Gesamtzinsen konfigurieren */
/* -------------------------- */
var gesamtzinsen = document.getElementById("gz");
function setUpGesamtzinsen() {
  gesamtzinsen.value = format(
    deformat(gesamtbelastung.value) - deformat(kaufpreis.value)
  );
}

/* Finanzierungsbeitrag konfigurieren */
/* ---------------------------------- */
var finanzierungsbeitrag = document.getElementById("fb");
function setUpFinanzierungsbeitrag() {
  finanzierungsbeitrag.value = format(
    deformat(kaufpreis.value) - deformat(eigenleistungInput.value)
  );
}