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
  var temp = input.value.replace(",", ".");
  if (!(temp == parseFloat(temp))) {
    if (input.value[input.value.length - 1] != ",")
      input.value = input.value.replace(
        input.value[input.value.length - 1],
        ""
      );
  }
  var tmp = input.value.indexOf(",");
  // nicht mehr als ein Komma möglich
  if (input.value.includes(",", ++tmp)) {
    var n = input.value.indexOf(",", tmp);
    var s = input.value.substring(0, n);
    input.value = s;
  }
}

/* Funktionen abrufen */
/* ------------------ */
function call() {
  kaufpreis();
  laufzeit();
  eigenleistung();
  restwert();
  entgelt();
  rechtsgeschäftsgebühr();
  effektivzinssatz();
  gesamtbelastung();
  gesamtzinsen();
  finanzierungsbeitrag();
}

/* Vertragsmodell konfiguration */
/* ---------------------------- */
vg.oninput = function() {
  call();
};
/* Tarifmodell konfiguration */
/* ------------------------- */
tm.oninput = function() {
  Bearbeitungsgebühr();
  call();
};
/* Kaufpreis konfiguration */
/* ----------------------- */
kp.oninput = function() {
  input(kp);
  call();
};

// Handling bei ungültiger Eingabe
function falsch(output) {
  if (output.value != parseFloat(output.value)) {
    var get = document.getElementsByClassName("output");
    var clear = [];
    for (var i = get.length; i--; clear.unshift(get[i]));
    clear.splice(0, 5);
    for (i = 0; i < clear.length; i++) {
      clear[i].value = "";
    }
  }
  Bearbeitungsgebühr();
}

// überprüft, ob die inputs vom kp disabled wurden
var lock = true;
function kaufpreis() {
  /* INPUT KONFIGURATION */

  // zu deaktivierende Elemente
  var input = new Array(eli, elr, rwi, rwr);
  // zu löschende inhalte
  // Inputs aktivieren wenn kp != leer
  if (deformat(kp.value) > 0) {
    lock = false;
    for (i = 0; i < input.length; i++) {
      input[i].disabled = false;
    }
  }
  // Inputs deaktivieren wenn kp == leer od. 0
  else {
    lock = true;
    for (i = 0; i < input.length; i++) {
      input[i].disabled = true;
    }
  }
}
/*  mit n auf focus überprüfen 
    sonst würde bei keiner änderung des kp.values, 
    der Dezimalpunkt entfernt werden                  */
var n = 0;
kp.onblur = function() {
  kp.value = format(kp.value.replace(",", ".") * 1.0);
  n = 0;
};
/*  Bei focus -> Deformat()    
    Da es sonst beim Format() zum Fehler kommt:   */
kp.onfocus = function() {
  kp.value = kp.value || 0;
  if (n == 0) kp.value = deformat(kp.value);
  n++;
  kp.select();
};

/* Laufzeit konfiguration */
/* ---------------------- */
lzr.oninput = function() {
  call();
};
lzi.oninput = function() {
  call();
  falsch(lzo);
};
function laufzeit() {
  if (lzi.value > 0) {
    lzr.disabled = true;
    if (lzi.value > 23) {
      if (lzi.value < 73) lzo.value = Math.round(lzi.value);
      else lzo.value = "zu lange";
    } else lzo.value = "zu kurz";
  } else {
    lzr.disabled = false;
    lzo.value = lzr.value;
  }
}

/* Eigenleistung konfigurieren */
/* --------------------------- */
elr.oninput = function() {
  call();
};
eli.oninput = function() {
  call();
  falsch(elo);
};
function eigenleistung() {
  if (eli.value > 0) {
    elr.disabled = true;
    if (eli.value / deformat(kp.value) > 0.4666666666) elo.value = "zu viel";
    else elo.value = format(eli.value * 1);
  } else {
    elo.value = format((elr.value * deformat(kp.value)) / 1000.0);
    if (lock == false) elr.disabled = false;
  }
  isNaN(deformat(elo.value))
    ? (elp.value = "-")
    : (elp.value = pFormat(deformat(elo.value) / deformat(kp.value)));
}

/* Restwert konfigurieren */
/* ---------------------- */
rwr.oninput = function() {
  call();
};
rwi.oninput = function() {
  call();
  falsch(rwo);
};
function restwert() {
  if (rwi.value > 0) {
    rwr.disabled = true;
    if (rwi.value / deformat(kp.value) < 0.1) rwo.value = "zu wenig";
    else if (rwi.value / deformat(kp.value) > 0.5) rwo.value = "zu viel";
    else rwo.value = format(rwi.value);
  } else {
    if (lock == false) rwr.disabled = false;
    rwo.value = format((deformat(kp.value) * rwr.value) / 1000.0);
  }
  isNaN(deformat(rwo.value))
    ? (rwp.value = "-")
    : (rwp.value = pFormat(deformat(rwo.value) / deformat(kp.value)));
}

/* Entgelt konfigurieren */
/* --------------------- */
var egVal; // gegen Rundungsfehler
function entgelt() {
  var zins = (0.0225 + (1 - vg.value) * 0.0025) / 12.0,
    zzr = deformat(lzo.value);
  bw = (deformat(kp.value) - deformat(elo.value)) * (1 + tm.value / 100.0);
  zw = -deformat(rwo.value);
  egVal = -rmz(zins, zzr, bw, zw, 0);
  eg.value = format(egVal);
}

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
function rechtsgeschäftsgebühr() {
  rg.value = format(
    Math.round((deformat(eg.value) * 36 + deformat(elo.value)) * 0.01) *
      vg.value
  );
}
/* Bearbeitungsgebühr konfigurieren */
/* -------------------------------- */
Bearbeitungsgebühr = () => (bg.value = format(tm.value * 50));

/* Effektivzinssatz konfigurieren */
/* ------------------------------ */
function effektivzinssatz() {
  ez.value = pFormat(
    Math.pow(
      1 +
        Zins(
          deformat(lzo.value),
          -egVal,
          deformat(kp.value) -
            deformat(elo.value) -
            deformat(bg.value) -
            deformat(rg.value),
          -deformat(rwo.value),
          1
        ),
      12
    ) - 1.0
  );
}
function Zins(zins, rmz, bw, zw, f, sw) {
  sw = typeof sw !== "undefined" ? sw : 0.1;

  // Sets the limits for possible guesses to any
  // number between 0% and 100%
  var lowerLimit = 0.0;
  var upperLimit = 1.0;

  // Defines a tolerance of up to +/- 0.00005% of pmt, to accept
  // the solution as valid.
  var toleranz = Math.abs(0.0000000005 * rmz);

  // Tries at most 40 times to find a solution within the tolerance.
  for (var i = 0; i < 40; i++) {
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
function gesamtbelastung() {
  gb.value = format(
    egVal * deformat(lzo.value) +
      deformat(elo.value) +
      deformat(rwo.value) +
      deformat(rg.value) +
      deformat(bg.value)
  );
}

/* Gesamtzinsen konfigurieren */
/* -------------------------- */
function gesamtzinsen() {
  gz.value = format(deformat(gb.value) - deformat(kp.value));
}
/* Finanzierungsbeitrag konfigurieren */
/* ---------------------------------- */
function finanzierungsbeitrag() {
  fb.value = format(deformat(kp.value) - deformat(elo.value));
}
