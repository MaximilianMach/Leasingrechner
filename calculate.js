/* FORMATIERUNGEN */
/* -------------- */
function format(number) {
  if (!isNaN(number)) {
    return number.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR"
    });
  } else return "0,00 €";
}
// Prozent-Formatierung
function pFormat(number) {
  if (!isNaN(number)) {
    return number.toLocaleString("de-DE", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else return "0,00 %";
}
// Deformatierung (fürs rechnen)
function deformat(number) {
  while (number.includes(".")) {
    number = number.replace(".", "");
  }
  number = number.replace("€", "");
  number = number.trim();
  number = number.replace(",", ".");
  return parseFloat(number);
}
/* Input konfigurieren */
/* ------------------- */
function input(input) {
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

/* Funktionen abrufen */
/* ------------------ */
function setUp() {
  setUpKaufpreis();
  setUpLaufzeit();
  setUpEigenleistung();
  setUpRestwert();
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
vertragsmodell.oninput = function() {
  setUp();
};

/* Tarifmodell konfiguration */
/* ------------------------- */
var tarifmodell = document.getElementById("tm");
tarifmodell.oninput = function() {
  setUpBearbeitungsgebühr();
  setUp();
};

/* Kaufpreis konfiguration */
/* ----------------------- */
var kaufpreis = document.getElementById("kp");
kaufpreis.oninput = function() {
  input(kaufpreis);
  setUp();
};
// Handling bei ungültiger Eingabe
function falsch(output) {
  if (deformat(output.value) != parseFloat(deformat(output.value))) {
    let get = document.getElementsByClassName("output");
    let clear = [];
    for (var i = get.length; i--; clear.unshift(get[i]));
    clear.splice(0, 5);
    for (let i = 0; i < clear.length; i++) {
      clear[i].value = "";
    }
  }
  setUpBearbeitungsgebühr();
}
// überprüft, ob die inputs vom kaufpreis disabled wurden
var lock = true;
function setUpKaufpreis() {
  /* INPUT KONFIGURATION */

  // zu deaktivierende Elemente
  var input = new Array(
    eigenleistungInput,
    eigenleistungRange,
    restwertInput,
    restwertRange
  );
  // zu löschende inhalte
  // Inputs aktivieren wenn kaufpreis != leer
  if (deformat(kaufpreis.value) > 0) {
    lock = false;
    for (let i = 0; i < input.length; i++) {
      input[i].disabled = false;
    }
  }
  // Inputs deaktivieren wenn kaufpreis == leer od. 0
  else {
    lock = true;
    for (let i = 0; i < input.length; i++) {
      input[i].disabled = true;
    }
  }
}
/*  mit n auf focus überprüfen 
    sonst würde bei keiner änderung des kaufpreis.values, 
    der Dezimalpunkt entfernt werden                  */
var n = 0;
kaufpreis.onblur = function() {
  kaufpreis.value = format(kaufpreis.value.replace(",", ".") * 1.0);
  n = 0;
};
/*  Bei focus -> Deformat()    
    Da es sonst beim Format() zum Fehler kommt:   */
kaufpreis.onfocus = function() {
  kaufpreis.value = kaufpreis.value || 0;
  if (n == 0) kaufpreis.value = deformat(kaufpreis.value);
  n++;
  kaufpreis.select();
};

/* Laufzeit konfiguration */
/* ---------------------- */
var laufzeitInput = document.getElementById("lzi");
var laufzeitRange = document.getElementById("lzr");
var laufzeitOutput = document.getElementById("lzo");
laufzeitRange.oninput = function() {
  setUp();
};
laufzeitInput.oninput = function() {
  setUp();
  falsch(laufzeitOutput);
};
function setUpLaufzeit() {
  if (laufzeitInput.value > 0) {
    laufzeitRange.disabled = true;
    if (laufzeitInput.value > 23) {
      if (laufzeitInput.value < 73)
        laufzeitOutput.value = Math.round(laufzeitInput.value);
      else laufzeitOutput.value = "zu lange";
    } else laufzeitOutput.value = "zu kurz";
  } else {
    laufzeitRange.disabled = false;
    laufzeitOutput.value = laufzeitRange.value;
  }
}

/* Eigenleistung konfigurieren */
/* --------------------------- */
var eigenleistungInput = document.getElementById("eli");
var eigenleistungRange = document.getElementById("elr");
var eigenleistungOutput = document.getElementById("elo");
var eigenleistungPercent = document.getElementById("elp");

eigenleistungRange.oninput = function() {
  setUp();
};
eigenleistungInput.oninput = function() {
  setUp();
  falsch(eigenleistungOutput);
};
function setUpEigenleistung() {
  if (eigenleistungInput.value > 0) {
    eigenleistungRange.disabled = true;
    if (eigenleistungInput.value / deformat(kaufpreis.value) > 0.4666666666)
      eigenleistungOutput.value = "zu viel";
    else eigenleistungOutput.value = format(eigenleistungInput.value * 1.0);
  } else {
    eigenleistungOutput.value = format(
      (eigenleistungRange.value * deformat(kaufpreis.value)) / 1000.0
    );
    if (lock == false) eigenleistungRange.disabled = false;
  }
  isNaN(deformat(eigenleistungOutput.value))
    ? (eigenleistungPercent.value = "-")
    : (eigenleistungPercent.value = pFormat(
        deformat(eigenleistungOutput.value) / deformat(kaufpreis.value)
      ));
}

/* Restwert konfigurieren */
/* ---------------------- */
var restwertInput = document.getElementById("rwi");
var restwertRange = document.getElementById("rwr");
var restwertOutput = document.getElementById("rwo");
var restwertPercent = document.getElementById("rwp");

restwertRange.oninput = function() {
  setUp();
};
restwertInput.oninput = function() {
  setUp();
  falsch(restwertOutput);
};
function setUpRestwert() {
  if (restwertInput.value > 0) {
    restwertRange.disabled = true;
    if (restwertInput.value / deformat(kaufpreis.value) < 0.1)
      restwertOutput.value = "zu wenig";
    else if (restwertInput.value / deformat(kaufpreis.value) > 0.5)
      restwertOutput.value = "zu viel";
    else restwertOutput.value = format(restwertInput.value * 1.0);
  } else {
    if (lock == false) restwertRange.disabled = false;
    restwertOutput.value = format(
      (deformat(kaufpreis.value) * restwertRange.value) / 1000.0
    );
  }
  isNaN(deformat(restwertOutput.value))
    ? (restwertPercent.value = "-")
    : (restwertPercent.value = pFormat(
        deformat(restwertOutput.value) / deformat(kaufpreis.value)
      ));
}

/* Entgelt konfigurieren */
/* --------------------- */
var entgelt = document.getElementById("eg");
var entgeltValue; // gegen Rundungsfehler
function setUpEntgelt() {
  var zins = (0.0225 + (1 - vertragsmodell.value) * 0.0025) / 12.0,
    zzr = deformat(laufzeitOutput.value);
  let bw =
    (deformat(kaufpreis.value) - deformat(eigenleistungOutput.value)) *
    (1 + tarifmodell.value / 100.0);
  let zw = -deformat(restwertOutput.value);
  entgeltValue = -rmz(zins, zzr, bw, zw, 0);
  entgelt.value = format(entgeltValue);
}

// Excel function
function rmz(zins, zzr, bw, zw, f) {
  if (!zw) zw = 0;
  if (!f) f = 0;

  if (zins == 0) return -(bw + zw) / zzr;

  var tmp = Math.pow(1 + zins, zzr);
  var rmz = (zins / (tmp - 1)) * -(bw * tmp + zw);

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
      (deformat(entgelt.value) * 36 + deformat(eigenleistungOutput.value)) *
        0.01
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
          deformat(laufzeitOutput.value),
          -entgeltValue,
          deformat(kaufpreis.value) -
            deformat(eigenleistungOutput.value) -
            deformat(bearbeitungsgebühr.value) -
            deformat(rechtsgeschäftsgebühr.value),
          -deformat(restwertOutput.value),
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
    entgeltValue * deformat(laufzeitOutput.value) +
      deformat(eigenleistungOutput.value) +
      deformat(restwertOutput.value) +
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
    deformat(kaufpreis.value) - deformat(eigenleistungOutput.value)
  );
}
