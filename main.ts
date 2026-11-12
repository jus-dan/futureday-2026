
let strip: neopixel.Strip = null

// ========================================
// LIGHTPAD - ZUKUNFTSTAG
// ========================================
//
// micro:bit V2
//
// P16: 10 NeoPixel LEDs
// P0: Potentiometer
// P15: Metalltaster links
// P1: Metalltaster rechts
//
// MODUS A: Zufallsfarben
// MODUS B: Einschlaflicht
// MODUS C: Lichtshow
// MODUS D: Reaktionsspiel
//
// micro:bit A = Naechster Modus
// micro:bit B = Vorheriger Modus
// micro:bit A+B = Licht ein/aus

// ========================================
// GRUNDEINSTELLUNGEN
// ========================================

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
// EINSCHLAFTIMER
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
// Status 0 = Start-Countdown
// Status 1 = Warten auf Farbe
// Status 2 = Reagieren
// Status 3 = Rueckmeldung
// Status 4 = Spielende

let spielStatus = 0
let runde = 0
let punkte = 0
let zielLinks = true

let naechstesSignal = 0
let signalEnde = 0
let feedbackEnde = 0
let antwortRichtig = false

// NEU: Start-Countdown 5 bis 0
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
// 1 LED = 1 MINUTE
// Die laufende Minute blinkt
// ========================================

function minutenAnzeigen(minuten: number, aktiv: boolean) {
    minuten = Math.constrain(minuten, 0, 25)

    let blink = true

    if (aktiv) {
        blink = Math.idiv(input.runningTime(), 400) % 2 == 0
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

// Uhrsymbol beim Timerstart

function uhrAnzeigen() {
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

    // Immer zurueck zu Modus A
    modus = 0
    startmodus = 0

    // Standard wieder 5 Minuten
    timerWahl = 0

    animationNeu = true
    matrixMinuten = -1

    // Gespeicherte Farbe bleibt erhalten
    basic.showString("A")

    speichernAnfordern()
}

// ========================================
// MODUS D: SPIEL-COUNTDOWN
// ========================================

// Wird beim Eintritt in D ausgefuehrt
// und auch bei einem neuen Spiel.

function spielVorbereiten() {
    runde = 0
    punkte = 0

    // Countdown aktivieren
    spielStatus = 0

    spielCountdownStart = input.runningTime()
    spielCountdownZahl = -1

    animationNeu = true
    basic.clearScreen()
}

// ========================================
// MODUS D: SPIEL STARTEN
// ========================================

// Wird erst NACH dem Countdown
// aufgerufen.

function spielStarten() {
    runde = 0
    punkte = 0
    spielStatus = 1

    // Zufallspause vor erster Farbe
    naechstesSignal =
        input.runningTime() + randint(1000, 2500)

    basic.showIcon(IconNames.SmallDiamond)
}

// ========================================
// MODUS D: SPIELANTWORT
// ========================================

function spielAntwort(links: boolean) {

    // Nach Spielende neuer Countdown
    if (spielStatus == 4) {
        spielVorbereiten()
        return
    }

    // Waehrend Countdown oder Wartezeit
    // keine Eingabe auswerten
    if (spielStatus != 2) {
        return
    }

    antwortRichtig = links == zielLinks
    spielStatus = 3

    if (antwortRichtig) {
        punkte += 1
        basic.showIcon(IconNames.Yes)

        // Positive Toene
        music.playTone(988, 90)
        music.playTone(1319, 90)

    } else {
        basic.showIcon(IconNames.No)

        // Fehlerton
        music.playTone(220, 180)
    }

    feedbackEnde = input.runningTime() + 650
}

// ========================================
// MODUSANZEIGE
// ========================================

function modusAnzeigen() {
    if (modus == 0) {
        basic.showString("A")

    } else if (modus == 1) {
        basic.showString("B")

        matrixMinuten = -1
        minutenAnzeigen(5, false)

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

    // Beim Eintritt in B immer 5 Minuten
    if (modus == 1) {
        timerWahl = 0
    }

    // Nur A und C als Startmodus speichern
    if (modus == 0 || modus == 2) {
        startmodus = modus
        speichernAnfordern()
    }

    modusAnzeigen()

    if (modus == 3) {
        // NEU: Erst Countdown statt Spiel
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

    if (schlafAbgelaufen) {
        nachSchlafAufwecken()
        return
    }

    if (lichtAus) {
        return
    }

    if (modus == 0) {
        // A: Neue Zufallsfarbe
        neueZufallsfarbe()

    } else if (modus == 1) {
        // B: Timerdauer waehlen
        timerLaeuft = false
        uhrBis = 0

        timerWahl = (timerWahl + 1) % 4

        matrixMinuten = -1
        minutenAnzeigen(
            timerZeiten[timerWahl],
            false
        )

    } else if (modus == 2) {
        // C: Lichteffekt wechseln
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

    if (modus == 0) {
        // A: Neue Zufallsfarbe
        neueZufallsfarbe()

    } else if (modus == 1) {
        // B: Timer starten oder stoppen
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

            timerEnde = jetzt +
                timerZeiten[timerWahl] * 60000

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

let gespeicherteFarbe = flashstorage.get("lichtfarbe")
let gespeicherterModus = flashstorage.get("lichtmodus")
let gespeicherterEffekt = flashstorage.get("lichteffekt")
let gespeichertesTempo = flashstorage.get("lichttempo")

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

// Eingebauten Lautsprecher aktivieren
music.setBuiltInSpeakerEnabled(true)
music.setVolume(75)

// Audio nicht auf P0 ausgeben
pins.setAudioPinEnabled(false)

// Startlicht
strip.setBrightness(100)
strip.showColor(lichtfarbe)

modusAnzeigen()

// ========================================
// HAUPTSCHLEIFE
// ========================================

basic.forever(function () {
    let jetzt = input.runningTime()

    // Einstellungen speichern
    if (speichernOffen && jetzt >= speichernAb) {
        speichern()
    }

    // Helligkeitsregler
    let helligkeit = 5 + Math.idiv(
        pins.analogReadPin(AnalogPin.P0) * 200,
        1023
    )

    // ====================================
    // MODUS D: SPIELLOGIK
    // ====================================

    if (!lichtAus && modus == 3) {

        // --------------------------------
        // NEU: COUNTDOWN 5 BIS 0
        // --------------------------------

        if (spielStatus == 0) {
            let vergangen =
                jetzt - spielCountdownStart

            let zahl = 5 -
                Math.idiv(vergangen, 1000)

            // Nur bei neuer Zahl anzeigen
            if (zahl >= 0 &&
                zahl != spielCountdownZahl) {

                spielCountdownZahl = zahl
                basic.showNumber(zahl)
            }

            // Nach Anzeige der 0 starten
            if (vergangen >= 5500) {
                spielStarten()
            }
        }

        // --------------------------------
        // WARTEN AUF ZUFALLSFARBE
        // --------------------------------

        if (spielStatus == 1 &&
            jetzt >= naechstesSignal) {

            zielLinks = randint(0, 1) == 0
            spielStatus = 2

            basic.clearScreen()

            // Kurzer Signalton
            music.playTone(660, 75)

            signalEnde =
                input.runningTime() + 2200
        }

        // --------------------------------
        // ZEIT ABGELAUFEN
        // --------------------------------

        if (spielStatus == 2 &&
            jetzt >= signalEnde) {

            spielStatus = 3
            antwortRichtig = false

            basic.showIcon(IconNames.No)
            music.playTone(220, 180)

            feedbackEnde =
                input.runningTime() + 650
        }

        // --------------------------------
        // NAECHSTE RUNDE / SPIELENDE
        // --------------------------------

        if (spielStatus == 3 &&
            jetzt >= feedbackEnde) {

            runde += 1

            if (runde >= 10) {
                spielStatus = 4
                animationNeu = true

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

        let nachtHelligkeit = helligkeit

        if (timerLaeuft) {
            let restzeit =
                timerEnde - input.runningTime()

            if (restzeit <= 0) {

                // Einschlaftimer beendet
                timerLaeuft = false
                lichtAus = true
                schlafAbgelaufen = true

                strip.clear()
                strip.show()
                basic.clearScreen()

            } else {

                // 1 LED pro Restminute
                let minuten = Math.idiv(
                    restzeit + 59999,
                    60000
                )

                // Uhr zuerst, danach LEDs
                if (input.runningTime() >= uhrBis) {
                    minutenAnzeigen(minuten, true)
                }

                // Letzte Minute dimmen
                if (restzeit <= 60000) {
                    nachtHelligkeit = Math.idiv(
                        helligkeit * restzeit,
                        60000
                    )
                }
            }

        } else {
            // Eingestellte Minuten
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

            // COUNTDOWN: ruhiges Violett
            // Noch keine Toene!
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
