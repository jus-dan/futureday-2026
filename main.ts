
let strip: neopixel.Strip = null

// ========================================
// LIGHTPAD - ZUKUNFTSTAG
// ========================================
//
// micro:bit V2
//
// P16 = 10 NeoPixel LEDs
// P0  = Potentiometer
// P15 = Metalltaster links
// P1  = Metalltaster rechts
//
// A = Zufallsfarben
// B = Einschlaflicht
// C = Lichtshow
// D = Reaktionsspiel
//
// micro:bit Taste A = Naechster Modus
// micro:bit Taste B = Vorheriger Modus
// A+B = Licht ein/aus
//
// ========================================

// GRUNDEINSTELLUNGEN

let modus = 0
let startmodus = 0
let lichtfarbe = neopixel.rgb(255, 120, 40)
let effekt = 0
let tempo = 1

let lichtAus = false
let schlafAbgelaufen = false

// Speicherung

let speichernOffen = false
let speichernAb = 0

// Animationen

let letzteAnimation = 0
let animationNeu = true

let effektFarben = [
    neopixel.rgb(255, 30, 100),
    neopixel.rgb(0, 150, 255),
    neopixel.rgb(130, 0, 255),
    neopixel.rgb(0, 255, 110),
    neopixel.rgb(255, 130, 0),
    neopixel.rgb(255, 0, 40)
]

// ========================================
// DISPLAY-HELLIGKEIT
// ========================================
//
// 0   = Aus
// 20  = Stark gedimmt
// 180 = Normal hell
//
// A/C: 15 Sekunden dimmen,
//      60 Sekunden ausschalten
//
// B:   15 Sekunden dimmen,
//      Countdown bleibt sichtbar
//
// D:   Beim Spiel hell,
//      60 Sekunden nach Ende aus

let displayAktivSeit = 0
let displayStufe = 0

function displayAufwecken() {
    displayAktivSeit = input.runningTime()
    displayStufe = 0
    led.setBrightness(180)
}

function displayAktualisieren(jetzt: number) {
    if (lichtAus) {
        return
    }

    let vergangen = jetzt - displayAktivSeit

    // D: Waehrend des Spiels immer hell
    if (modus == 3 && spielStatus != 4) {
        if (displayStufe != 0) {
            led.setBrightness(180)
            displayStufe = 0
        }
        return
    }

    // B: Countdown bleibt gedimmt sichtbar
    if (modus == 1) {
        if (vergangen >= 15000) {
            if (displayStufe != 1) {
                led.setBrightness(20)
                displayStufe = 1
            }
        } else {
            if (displayStufe != 0) {
                led.setBrightness(180)
                displayStufe = 0
            }
        }
        return
    }

    // A und C sowie D nach Spielende
    if (vergangen >= 60000) {
        if (displayStufe != 2) {
            basic.clearScreen()
            led.setBrightness(0)
            displayStufe = 2
        }

    } else if (vergangen >= 15000) {
        if (displayStufe != 1) {
            led.setBrightness(20)
            displayStufe = 1
        }

    } else {
        if (displayStufe != 0) {
            led.setBrightness(180)
            displayStufe = 0
        }
    }
}

// ========================================
// EIN SCHLAFTIMER
// ========================================

let timerZeiten = [5, 10, 15, 25]
let timerWahl = 0

let timerLaeuft = false
let timerEnde = 0
let uhrBis = 0

let matrixMinuten = -1
let matrixBlink = false
let matrixAktiv = false

// ========================================
// REAKTIONSSPIEL
// ========================================
//
// 0 = Countdown
// 1 = Warten
// 2 = Reagieren
// 3 = Rueckmeldung
// 4 = Spielende

let spielStatus = 0
let runde = 0
let punkte = 0
let zielLinks = true

let naechstesSignal = 0
let signalEnde = 0
let feedbackEnde = 0
let antwortRichtig = false

let spielCountdownStart = 0
let spielCountdownZahl = -1

// Tasterentprellung

let letzteLinks = -1000
let letzteRechts = -1000

// ========================================
// EINSTELLUNGEN SPEICHERN
// ========================================

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

// ========================================
// MODUS A: ZUFALLSFARBEN
// ========================================

function neueZufallsfarbe() {
    let r = randint(0, 200)
    let g = randint(0, 200)
    let b = randint(0, 200)

    // Mindestens ein Farbkanal ist hell
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

// ========================================
// MODUS B: MINUTENANZEIGE
// ========================================
//
// Eine LED = Eine Minute
//
// Die laufende Minute blinkt
// im Abstand von 400 Millisekunden

function minutenAnzeigen(minuten: number, aktiv: boolean) {
    minuten = Math.constrain(minuten, 0, 25)

    let blink = true

    if (aktiv) {
        blink =
            Math.idiv(input.runningTime(), 400) % 2 == 0
    }

    if (matrixMinuten == minuten &&
        matrixBlink == blink &&
        matrixAktiv == aktiv) {
        return
    }

    for (let i = 0; i < 25; i++) {
        let x = i % 5
        let y = Math.idiv(i, 5)

        let an = i < minuten

        if (aktiv && i == minuten - 1) {
            an = blink
        }

        if (an) {
            led.plot(x, y)
        } else {
            led.unplot(x, y)
        }
    }

    matrixMinuten = minuten
    matrixBlink = blink
    matrixAktiv = aktiv
}

// ========================================
// UHR BEIM TIMERSTART
// ========================================

function uhrAnzeigen() {
    displayAufwecken()

    uhrBis = input.runningTime() + 900
    matrixMinuten = -1

    basic.showLeds(`
        . # # # .
        # . . . #
        # . # . #
        # . . # #
        . # # # .
    `)
}

// ========================================
// AUFWECKEN NACH EINSCHLAFTIMER
// ========================================

function nachSchlafAufwecken() {
    schlafAbgelaufen = false
    lichtAus = false

    timerLaeuft = false
    uhrBis = 0

    // Immer in Modus A zurueck
    modus = 0
    startmodus = 0

    // Timer wieder auf 5 Minuten
    timerWahl = 0

    animationNeu = true
    matrixMinuten = -1

    // Letzte Farbe bleibt erhalten
    displayAufwecken()
    basic.showString("A")

    speichernAnfordern()
}

// ========================================
// REAKTIONSSPIEL VORBEREITEN
// ========================================

function spielVorbereiten() {
    runde = 0
    punkte = 0

    // Start-Countdown 5 bis 0
    spielStatus = 0

    spielCountdownStart = input.runningTime()
    spielCountdownZahl = -1

    animationNeu = true

    displayAufwecken()
    basic.clearScreen()
}

// ========================================
// REAKTIONSSPIEL STARTEN
// ========================================

function spielStarten() {
    runde = 0
    punkte = 0
    spielStatus = 1

    naechstesSignal =
        input.runningTime() + randint(1000, 2500)

    basic.showIcon(IconNames.SmallDiamond)
}

// ========================================
// REAKTIONSSPIEL ANTWORT
// ========================================

function spielAntwort(links: boolean) {
    // Nach Spielende: Neuer Countdown
    if (spielStatus == 4) {
        spielVorbereiten()
        return
    }

    // Waehrend des Countdowns keine Eingabe
    if (spielStatus != 2) {
        return
    }

    antwortRichtig = links == zielLinks
    spielStatus = 3

    if (antwortRichtig) {
        punkte += 1
        basic.showIcon(IconNames.Yes)

        // Richtig: Zwei hohe Toene
        music.playTone(988, 90)
        music.playTone(1319, 90)

    } else {
        basic.showIcon(IconNames.No)

        // Falsch: Tiefer Ton
        music.playTone(220, 180)
    }

    feedbackEnde = input.runningTime() + 650
}

// ========================================
// MODUSANZEIGE
// ========================================

function modusAnzeigen() {
    displayAufwecken()

    if (modus == 0) {
        basic.showString("A")

    } else if (modus == 1) {
        basic.showString("B")

        matrixMinuten = -1
        minutenAnzeigen(
            timerZeiten[timerWahl],
            false
        )

    } else if (modus == 2) {
        basic.showString("C")

    } else {
        basic.showString("D")
    }
}

// ========================================
// MODUS WECHSELN
// ========================================

function modusWechseln(neu: number) {
    modus = neu

    // Einschlaftimer abbrechen
    timerLaeuft = false
    uhrBis = 0

    animationNeu = true
    letzteAnimation = 0
    matrixMinuten = -1

    // B startet immer mit 5 Minuten
    if (modus == 1) {
        timerWahl = 0
    }

    // A und C als Startmodus speichern
    if (modus == 0 || modus == 2) {
        startmodus = modus
        speichernAnfordern()
    }

    modusAnzeigen()

    // Bei D zuerst Countdown
    if (modus == 3) {
        spielVorbereiten()
    }
}

// ========================================
// LINKER METALLTASTER P15
// ========================================

function tasteLinks() {
    let jetzt = input.runningTime()

    if (jetzt - letzteLinks < 130) {
        return
    }

    letzteLinks = jetzt

    // Einschlaflicht beenden / aufwecken
    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    if (lichtAus) {
        return
    }

    displayAufwecken()

    if (modus == 0) {
        // A: Neue Zufallsfarbe
        neueZufallsfarbe()
        basic.showString("A")

    } else if (modus == 1) {
        // B: Zeit waehlen
        timerLaeuft = false
        uhrBis = 0

        timerWahl = (timerWahl + 1) % 4

        matrixMinuten = -1
        minutenAnzeigen(
            timerZeiten[timerWahl],
            false
        )

    } else if (modus == 2) {
        // C: Naechster Effekt
        effekt = (effekt + 1) % 4
        animationNeu = true

        basic.showNumber(effekt + 1)
        speichernAnfordern()

    } else if (modus == 3) {
        // D: Gruen = links
        spielAntwort(true)
    }
}

// ========================================
// RECHTER METALLTASTER P1
// ========================================

function tasteRechts() {
    let jetzt = input.runningTime()

    if (jetzt - letzteRechts < 130) {
        return
    }

    letzteRechts = jetzt

    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    if (lichtAus) {
        return
    }

    displayAufwecken()

    if (modus == 0) {
        // A: Neue Zufallsfarbe
        neueZufallsfarbe()
        basic.showString("A")

    } else if (modus == 1) {
        // B: Countdown starten / stoppen
        if (timerLaeuft) {
            timerLaeuft = false
            uhrBis = 0

            matrixMinuten = -1
            minutenAnzeigen(
                timerZeiten[timerWahl],
                false
            )

        } else {
            timerLaeuft = true

            timerEnde =
                jetzt + timerZeiten[timerWahl] * 60000

            // Uhr als Startbestaetigung
            uhrAnzeigen()
        }

    } else if (modus == 2) {
        // C: Geschwindigkeit
        tempo = (tempo + 1) % 3

        basic.showNumber(tempo + 1)
        speichernAnfordern()

    } else if (modus == 3) {
        // D: Rot = rechts
        spielAntwort(false)
    }
}

// ========================================
// MICRO:BIT TASTEN
// ========================================

input.onButtonPressed(Button.A, function () {
    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    if (!lichtAus) {
        modusWechseln((modus + 1) % 4)
    }
})

input.onButtonPressed(Button.B, function () {
    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    if (!lichtAus) {
        modusWechseln((modus + 3) % 4)
    }
})

input.onButtonPressed(Button.AB, function () {
    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    lichtAus = !lichtAus

    if (lichtAus) {
        timerLaeuft = false

        strip.clear()
        strip.show()

        basic.clearScreen()
        led.setBrightness(0)

    } else {
        animationNeu = true
        matrixMinuten = -1

        modusAnzeigen()

        if (modus == 3) {
            spielVorbereiten()
        }
    }
})

// ========================================
// METALLTASTER
// High-Puls wie im Originalcode
// ========================================

pins.onPulsed(DigitalPin.P15, PulseValue.High, function () {
    tasteLinks()
})

pins.onPulsed(DigitalPin.P1, PulseValue.High, function () {
    tasteRechts()
})

// ========================================
// GESPEICHERTE EINSTELLUNGEN LADEN
// ========================================

let gespeicherteFarbe =
    flashstorage.get("lichtfarbe")

let gespeicherterModus =
    flashstorage.get("lichtmodus")

let gespeicherterEffekt =
    flashstorage.get("lichteffekt")

let gespeichertesTempo =
    flashstorage.get("lichttempo")

if (gespeicherteFarbe != "") {
    lichtfarbe = parseInt(gespeicherteFarbe)
}

if (gespeicherterModus != "") {
    let wert = parseInt(gespeicherterModus)

    if (wert == 0 || wert == 2) {
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

// ========================================
// HARDWARE INITIALISIEREN
// ========================================

strip = neopixel.create(
    DigitalPin.P16,
    10,
    NeoPixelMode.RGB
)

// Lautsprecher fuer Spiel
music.setBuiltInSpeakerEnabled(true)
music.setVolume(75)

// P0 fuer Potentiometer freihalten
pins.setAudioPinEnabled(false)

// Licht einschalten
strip.setBrightness(100)
strip.showColor(lichtfarbe)

// Display starten
displayAufwecken()
modusAnzeigen()

// ========================================
// HAUPTSCHLEIFE
// ========================================

basic.forever(function () {
    let jetzt = input.runningTime()

    // Speichern nach 3 Sekunden
    if (speichernOffen && jetzt >= speichernAb) {
        speichern()
    }

    // Displayhelligkeit automatisch regeln
    displayAktualisieren(jetzt)

    // Helligkeit vom Potentiometer
    let helligkeit = 5 + Math.idiv(
        pins.analogReadPin(AnalogPin.P0) * 200,
        1023
    )

    // ====================================
    // MODUS D: REAKTIONSSPIEL
    // ====================================

    if (!lichtAus && modus == 3) {

        // Countdown 5 bis 0
        if (spielStatus == 0) {
            let vergangen =
                jetzt - spielCountdownStart

            let zahl = 5 -
                Math.idiv(vergangen, 1000)

            if (zahl >= 0 &&
                zahl != spielCountdownZahl) {

                spielCountdownZahl = zahl
                basic.showNumber(zahl)
            }

            if (vergangen >= 5500) {
                spielStarten()
            }
        }

        // Zufallsfarbe ausloesen
        if (spielStatus == 1 &&
            jetzt >= naechstesSignal) {

            zielLinks = randint(0, 1) == 0
            spielStatus = 2

            basic.clearScreen()

            music.playTone(660, 75)

            signalEnde =
                input.runningTime() + 2200
        }

        // Reaktionszeit abgelaufen
        if (spielStatus == 2 &&
            jetzt >= signalEnde) {

            spielStatus = 3
            antwortRichtig = false

            basic.showIcon(IconNames.No)
            music.playTone(220, 180)

            feedbackEnde =
                input.runningTime() + 650
        }

        // Naechste Runde / Spielende
        if (spielStatus == 3 &&
            jetzt >= feedbackEnde) {

            runde += 1

            if (runde >= 10) {
                spielStatus = 4
                animationNeu = true

                // Display bleibt noch 60 s
                displayAufwecken()
                basic.showNumber(punkte)

                // Abschlussmelodie
                music.playTone(523, 100)
                music.playTone(659, 100)
                music.playTone(784, 100)
                music.playTone(1047, 200)

            } else {
                spielStatus = 1

                naechstesSignal =
                    input.runningTime() +
                    randint(1000, 3000)

                basic.showIcon(
                    IconNames.SmallDiamond
                )
            }
        }
    }

    // ====================================
    // LICHT AUS
    // ====================================

    if (lichtAus) {
        strip.clear()
        strip.show()

    } else if (modus == 0) {

        // =================================
        // A: ZUFALLSFARBEN
        // =================================

        strip.setBrightness(helligkeit)
        strip.showColor(lichtfarbe)

    } else if (modus == 1) {

        // =================================
        // B: EINSCHLAFLICHT
        // =================================

        // Gleiche Farbe wie Modus A
        let nachtHelligkeit = helligkeit

        if (timerLaeuft) {
            let restzeit =
                timerEnde - input.runningTime()

            if (restzeit <= 0) {

                // Timer abgelaufen
                timerLaeuft = false
                lichtAus = true
                schlafAbgelaufen = true

                strip.clear()
                strip.show()

                basic.clearScreen()
                led.setBrightness(0)

            } else {

                // 1 LED = 1 Minute
                let minuten = Math.idiv(
                    restzeit + 59999,
                    60000
                )

                // Uhr zuerst, dann Countdown
                if (input.runningTime() >= uhrBis) {
                    minutenAnzeigen(minuten, true)
                }

                // Letzte Minute sanft dimmen
                if (restzeit <= 60000) {
                    nachtHelligkeit = Math.idiv(
                        helligkeit * restzeit,
                        60000
                    )
                }
            }

        } else {

            // Eingestellte Dauer anzeigen
            minutenAnzeigen(
                timerZeiten[timerWahl],
                false
            )
        }

        if (!lichtAus) {
            strip.setBrightness(nachtHelligkeit)
            strip.showColor(lichtfarbe)
        }

    } else if (modus == 2) {

        // =================================
        // C: LICHTSHOW
        // =================================

        let intervall = 180 - tempo * 65

        if (animationNeu ||
            jetzt - letzteAnimation >= intervall) {

            strip.setBrightness(helligkeit)

            if (effekt == 0) {

                // REGENBOGEN
                if (animationNeu) {
                    strip.showRainbow(1, 360)
                } else {
                    strip.rotate(1)
                }

            } else if (effekt == 1) {

                // ATMENDES LICHT
                let dauer = 3600 - tempo * 900
                let halb = Math.idiv(dauer, 2)
                let phase = jetzt % dauer

                if (phase > halb) {
                    phase = dauer - phase
                }

                let faktor = 20 +
                    Math.idiv(phase * 235, halb)

                strip.setBrightness(
                    Math.idiv(
                        helligkeit * faktor,
                        255
                    )
                )

                strip.showColor(
                    neopixel.rgb(130, 25, 255)
                )

            } else if (effekt == 2) {

                // AUTOMATISCHER FARBWECHSEL
                let wechselzeit =
                    1300 - tempo * 400

                let index =
                    Math.idiv(jetzt, wechselzeit) %
                    effektFarben.length

                strip.showColor(
                    effektFarben[index]
                )

            } else {

                // FUNKELN
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

    } else if (modus == 3) {

        // =================================
        // D: REAKTIONSSPIEL
        // =================================

        strip.setBrightness(
            Math.max(80, helligkeit)
        )

        if (spielStatus == 0) {

            // COUNTDOWN
            // Leise, schwaches Violett
            strip.setBrightness(20)
            strip.showColor(
                neopixel.rgb(60, 0, 120)
            )

        } else if (spielStatus == 1) {

            // WARTEN
            strip.setBrightness(25)
            strip.showColor(
                neopixel.rgb(40, 0, 100)
            )

        } else if (spielStatus == 2) {

            // REAKTION
            if (zielLinks) {
                // Gruen = links
                strip.showColor(
                    neopixel.rgb(0, 255, 0)
                )
            } else {
                // Rot = rechts
                strip.showColor(
                    neopixel.rgb(255, 0, 0)
                )
            }

        } else if (spielStatus == 3) {

            // RUECKMELDUNG
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

            // SPIELENDE: REGENBOGEN
            strip.setBrightness(40)

            if (animationNeu) {
                strip.showRainbow(1, 360)
                animationNeu = false
                letzteAnimation = jetzt

            } else if (
                jetzt - letzteAnimation >= 150
            ) {
                strip.rotate(1)
                letzteAnimation = jetzt
            }

            strip.show()
        }
    }

    basic.pause(50)
})
