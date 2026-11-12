
let strip: neopixel.Strip = null

// LIGHTPAD - Zukunftstag
// P16: 10 NeoPixel
// P0: Potentiometer
// P15: Metalltaster links
// P1: Metalltaster rechts
//
// A = Zufallsfarben
// B = Lichtshow
// C = Einschlaflicht
// D = Reaktionsspiel

let modus = 0
let startmodus = 0
let lichtfarbe = neopixel.rgb(255, 120, 40)
let effekt = 0
let tempo = 1
let lichtAus = false

let speichernOffen = false
let speichernAb = 0
let letzteAnimation = 0
let animationNeu = true

let timerZeiten = [5, 10, 15, 25]
let timerWahl = 3
let timerLaeuft = false
let timerEnde = 0
let angezeigteMinuten = -1

let spielStatus = 0
let runde = 0
let punkte = 0
let zielLinks = true
let naechstesSignal = 0
let signalEnde = 0
let feedbackEnde = 0
let antwortRichtig = false

let letzteLinks = -1000
let letzteRechts = -1000

let effektFarben = [
    neopixel.rgb(255, 30, 100),
    neopixel.rgb(0, 150, 255),
    neopixel.rgb(130, 0, 255),
    neopixel.rgb(0, 255, 110),
    neopixel.rgb(255, 130, 0),
    neopixel.rgb(255, 0, 40)
]

// -------------------------------
// SPEICHERUNG
// -------------------------------

function speichernAnfordern() {
    speichernOffen = true
    speichernAb = input.runningTime() + 3000
}

function speichern() {
    flashstorage.put("lichtfarbe", "" + lichtfarbe)
    flashstorage.put("lichtmodus", "" + startmodus)
    flashstorage.put("lichteffekt", "" + effekt)
    flashstorage.put("lichttempo", "" + tempo)
    speichernOffen = false
}

// -------------------------------
// ZUFALLSFARBEN
// -------------------------------

function neueZufallsfarbe() {
    let r = randint(0, 200)
    let g = randint(0, 200)
    let b = randint(0, 200)

    // Mindestens ein Farbkanal ist hell
    // Damit entstehen kraeftige Farben
    let kanal = randint(0, 2)

    if (kanal == 0) {
        r = 255
    } else if (kanal == 1) {
        g = 255
    } else {
        b = 255
    }

    lichtfarbe = neopixel.rgb(r, g, b)
    speichernAnfordern()
}

// -------------------------------
// LED-MATRIX: MINUTENANZEIGE
// 1 LED = 1 MINUTE
// -------------------------------

function minutenAnzeigen(minuten: number) {
    minuten = Math.constrain(minuten, 0, 25)

    basic.clearScreen()

    for (let i = 0; i < 25; i++) {
        let x = i % 5
        let y = Math.idiv(i, 5)

        if (i < minuten) {
            led.plot(x, y)
        } else {
            led.unplot(x, y)
        }
    }

    angezeigteMinuten = minuten
}

// -------------------------------
// REAKTIONSSPIEL
// -------------------------------

function spielStarten() {
    runde = 0
    punkte = 0
    spielStatus = 1

    naechstesSignal =
        input.runningTime() + randint(1200, 3000)

    basic.showIcon(IconNames.SmallDiamond)
}

function spielAntwort(links: boolean) {
    if (spielStatus == 4) {
        spielStarten()
        return
    }

    if (spielStatus != 2) {
        return
    }

    antwortRichtig = links == zielLinks

    if (antwortRichtig) {
        punkte += 1
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }

    spielStatus = 3
    feedbackEnde = input.runningTime() + 600
}

// -------------------------------
// MODUSWECHSEL
// -------------------------------

function modusAnzeigen() {
    if (modus == 0) {
        basic.showString("A")
    } else if (modus == 1) {
        basic.showString("B")
    } else if (modus == 2) {
        basic.showString("C")
        minutenAnzeigen(timerZeiten[timerWahl])
    } else {
        basic.showString("D")
    }
}

function modusWechseln(neu: number) {
    modus = neu
    timerLaeuft = false
    animationNeu = true
    letzteAnimation = 0
    angezeigteMinuten = -1

    if (modus == 0 || modus == 1) {
        startmodus = modus
        speichernAnfordern()
    }

    modusAnzeigen()

    if (modus == 3) {
        spielStarten()
    }
}

// -------------------------------
// LINKER METALLTASTER P15
// -------------------------------

function tasteLinks() {
    let jetzt = input.runningTime()

    if (jetzt - letzteLinks < 130) {
        return
    }

    letzteLinks = jetzt

    if (lichtAus) {
        return
    }

    if (modus == 0) {
        // A: Neue Zufallsfarbe
        neueZufallsfarbe()

    } else if (modus == 1) {
        // B: Naechster Effekt
        effekt = (effekt + 1) % 4
        animationNeu = true
        basic.showNumber(effekt + 1)
        speichernAnfordern()

    } else if (modus == 2) {
        // C: Timerdauer waehlen
        timerLaeuft = false
        timerWahl = (timerWahl + 1) % 4

        minutenAnzeigen(timerZeiten[timerWahl])

    } else if (modus == 3) {
        // D: Gruen = links
        spielAntwort(true)
    }
}

// -------------------------------
// RECHTER METALLTASTER P1
// -------------------------------

function tasteRechts() {
    let jetzt = input.runningTime()

    if (jetzt - letzteRechts < 130) {
        return
    }

    letzteRechts = jetzt

    if (lichtAus) {
        return
    }

    if (modus == 0) {
        // A: Ebenfalls neue Zufallsfarbe
        neueZufallsfarbe()

    } else if (modus == 1) {
        // B: Geschwindigkeit aendern
        tempo = (tempo + 1) % 3
        basic.showNumber(tempo + 1)
        speichernAnfordern()

    } else if (modus == 2) {
        // C: Timer starten oder stoppen
        if (timerLaeuft) {
            timerLaeuft = false
            minutenAnzeigen(timerZeiten[timerWahl])
        } else {
            timerLaeuft = true
            timerEnde = jetzt +
                timerZeiten[timerWahl] * 60000

            minutenAnzeigen(timerZeiten[timerWahl])
        }

    } else if (modus == 3) {
        // D: Rot = rechts
        spielAntwort(false)
    }
}

// -------------------------------
// MICRO:BIT A, B UND A+B
// -------------------------------

input.onButtonPressed(Button.A, function () {
    if (!lichtAus) {
        modusWechseln((modus + 1) % 4)
    }
})

input.onButtonPressed(Button.B, function () {
    if (!lichtAus) {
        modusWechseln((modus + 3) % 4)
    }
})

input.onButtonPressed(Button.AB, function () {
    lichtAus = !lichtAus

    if (lichtAus) {
        timerLaeuft = false
        strip.clear()
        strip.show()
        basic.clearScreen()
    } else {
        animationNeu = true
        modusAnzeigen()

        if (modus == 3) {
            spielStarten()
        }
    }
})

// -------------------------------
// METALLTASTER
// Bestehende High-Puls-Erkennung
// -------------------------------

pins.onPulsed(DigitalPin.P15, PulseValue.High, function () {
    tasteLinks()
})

pins.onPulsed(DigitalPin.P1, PulseValue.High, function () {
    tasteRechts()
})

// -------------------------------
// EINSTELLUNGEN LADEN
// -------------------------------

let gespeicherteFarbe = flashstorage.get("lichtfarbe")
let gespeicherterModus = flashstorage.get("lichtmodus")
let gespeicherterEffekt = flashstorage.get("lichteffekt")
let gespeichertesTempo = flashstorage.get("lichttempo")

if (gespeicherteFarbe != "") {
    lichtfarbe = parseInt(gespeicherteFarbe)
}

if (gespeicherterModus != "") {
    let wert = parseInt(gespeicherterModus)
    if (wert == 0 || wert == 1) {
        startmodus = wert
    }
}

if (gespeicherterEffekt != "") {
    let wert = parseInt(gespeicherterEffekt)
    if (wert >= 0 && wert <= 3) {
        effekt = wert
    }
}

if (gespeichertesTempo != "") {
    let wert = parseInt(gespeichertesTempo)
    if (wert >= 0 && wert <= 2) {
        tempo = wert
    }
}

modus = startmodus

// -------------------------------
// NEOPIXEL INITIALISIEREN
// -------------------------------

strip = neopixel.create(
    DigitalPin.P16,
    10,
    NeoPixelMode.RGB
)

strip.setBrightness(100)
strip.showColor(lichtfarbe)

modusAnzeigen()

// -------------------------------
// HAUPTSCHLEIFE
// -------------------------------

basic.forever(function () {
    let jetzt = input.runningTime()

    // Einstellungen nach 3 Sekunden speichern
    if (speichernOffen && jetzt >= speichernAb) {
        speichern()
    }

    // Potentiometer: Helligkeit
    let helligkeit = 5 + Math.idiv(
        pins.analogReadPin(AnalogPin.P0) * 200,
        1023
    )

    // ---------------------------
    // SPIELLOGIK
    // ---------------------------

    if (!lichtAus && modus == 3) {

        if (spielStatus == 1 &&
            jetzt >= naechstesSignal) {

            zielLinks = randint(0, 1) == 0
            spielStatus = 2
            signalEnde = jetzt + 2200
            basic.clearScreen()
        }

        if (spielStatus == 2 &&
            jetzt >= signalEnde) {

            antwortRichtig = false
            spielStatus = 3
            feedbackEnde = jetzt + 600
            basic.showIcon(IconNames.No)
        }

        if (spielStatus == 3 &&
            jetzt >= feedbackEnde) {

            runde += 1

            if (runde >= 10) {
                spielStatus = 4
                basic.showNumber(punkte)
            } else {
                spielStatus = 1
                naechstesSignal =
                    jetzt + randint(1000, 3000)

                basic.showIcon(IconNames.SmallDiamond)
            }
        }
    }

    // ---------------------------
    // LICHT AUS
    // ---------------------------

    if (lichtAus) {
        strip.clear()
        strip.show()

    } else if (modus == 0) {

        // -----------------------
        // A: ZUFALLSFARBE
        // -----------------------

        strip.setBrightness(helligkeit)
        strip.showColor(lichtfarbe)

    } else if (modus == 1) {

        // -----------------------
        // B: LICHTSHOW
        // -----------------------

        let intervall = 180 - tempo * 65

        if (animationNeu ||
            jetzt - letzteAnimation >= intervall) {

            strip.setBrightness(helligkeit)

            if (effekt == 0) {
                // Laufender Regenbogen
                if (animationNeu) {
                    strip.showRainbow(1, 360)
                } else {
                    strip.rotate(1)
                }

            } else if (effekt == 1) {
                // Sanftes Atmen
                let dauer = 3600 - tempo * 900
                let halb = Math.idiv(dauer, 2)
                let phase = jetzt % dauer

                if (phase > halb) {
                    phase = dauer - phase
                }

                let faktor = 20 +
                    Math.idiv(phase * 235, halb)

                strip.setBrightness(
                    Math.idiv(helligkeit * faktor, 255)
                )

                strip.showColor(
                    neopixel.rgb(130, 25, 255)
                )

            } else if (effekt == 2) {
                // Automatischer Farbwechsel
                let wechselzeit = 1300 - tempo * 400
                let index =
                    Math.idiv(jetzt, wechselzeit) %
                    effektFarben.length

                strip.showColor(effektFarben[index])

            } else {
                // Funkeln
                strip.showColor(
                    neopixel.rgb(10, 3, 35)
                )

                strip.setPixelColor(
                    randint(0, 9),
                    neopixel.rgb(180, 80, 255)
                )

                strip.setPixelColor(
                    randint(0, 9),
                    neopixel.rgb(80, 190, 255)
                )
            }

            strip.show()
            animationNeu = false
            letzteAnimation = jetzt
        }

    } else if (modus == 2) {

        // -----------------------
        // C: EINSCHLAFLICHT
        // -----------------------

        let nachtHelligkeit = helligkeit

        if (timerLaeuft) {
            let restzeit = timerEnde - jetzt

            if (restzeit <= 0) {
                // Countdown beendet
                timerLaeuft = false
                lichtAus = true
                minutenAnzeigen(0)

                strip.clear()
                strip.show()

            } else {
                // Verbleibende Minuten aufrunden
                let minuten = Math.idiv(
                    restzeit + 59999,
                    60000
                )

                // Eine LED pro Minute aus
                if (minuten != angezeigteMinuten) {
                    minutenAnzeigen(minuten)
                }

                // Letzte Minute langsam dimmen
                if (restzeit <= 60000) {
                    nachtHelligkeit = Math.idiv(
                        helligkeit * restzeit,
                        60000
                    )
                }
            }

        } else {
            // Vor dem Start: gewaehlte Dauer
            if (angezeigteMinuten !=
                timerZeiten[timerWahl]) {

                minutenAnzeigen(
                    timerZeiten[timerWahl]
                )
            }
        }

        if (!lichtAus) {
            strip.setBrightness(nachtHelligkeit)
            strip.showColor(
                neopixel.rgb(255, 120, 35)
            )
        }

    } else if (modus == 3) {

        // -----------------------
        // D: REAKTIONSSPIEL
        // -----------------------

        strip.setBrightness(
            Math.max(80, helligkeit)
        )

        if (spielStatus == 1) {
            // Warten
            strip.setBrightness(25)
            strip.showColor(
                neopixel.rgb(40, 0, 100)
            )

        } else if (spielStatus == 2) {
            if (zielLinks) {
                // Gruen -> links
                strip.showColor(
                    neopixel.rgb(0, 255, 0)
                )
            } else {
                // Rot -> rechts
                strip.showColor(
                    neopixel.rgb(255, 0, 0)
                )
            }

        } else if (spielStatus == 3) {
            if (antwortRichtig) {
                strip.showColor(
                    neopixel.rgb(0, 255, 100)
                )
            } else {
                strip.showColor(
                    neopixel.rgb(255, 0, 0)
                )
            }

        } else {
            // Spielende
            strip.setBrightness(40)
            strip.showRainbow(1, 360)
        }
    }

    basic.pause(50)
})
