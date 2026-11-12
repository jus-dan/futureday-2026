/**
 * ------------------------------------
 * 
 * Einstellungen speichern
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Spiel vorbereiten
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Modus wechseln
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Metalltaster links - P15
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Metalltaster rechts - P1
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * micro:bit Tasten A / B / A+B
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Externe Taster
 * 
 * Wie im bisherigen Programm:
 * 
 * High-Puls auf P1 und P15
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Hauptprogramm
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * LIGHTPAD - Zukunftstag
 * 
 * P16: 10 NeoPixel
 * 
 * P0: Potentiometer
 * 
 * P15: Metalltaster links
 * 
 * P1: Metalltaster rechts
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * Gespeicherte Werte laden
 * 
 * ------------------------------------
 */
/**
 * ------------------------------------
 * 
 * NeoPixel starten
 * 
 * ------------------------------------
 */
/**
 * Spielstatus:
 */
/**
 * 1 = Warten
 */
/**
 * 2 = Reagieren
 */
/**
 * 3 = Rueckmeldung
 */
// 4 = Spielende
function tasteRechts () {
    jetzt2 = input.runningTime()
    if (jetzt2 - letzteRechts < 130) {
        return
    }
    letzteRechts = jetzt2
    if (lichtAus) {
        return
    }
    if (modus == 0) {
        // Vorherige Farbe
        farbeIndex += 0 - 1
        if (farbeIndex < 0) {
            farbeIndex = farben.length - 1
        }
        speichernAnfordern()
    } else if (modus == 1) {
        // Geschwindigkeit: langsam, mittel, schnell
        tempo = (tempo + 1) % 3
        basic.showNumber(tempo + 1)
        speichernAnfordern()
    } else if (modus == 2) {
        // Einschlaftimer ein- oder ausschalten
        if (timerLaeuft) {
            timerLaeuft = false
            basic.showIcon(IconNames.No)
            basic.showNumber(timerMinuten[timerWahl])
        } else {
            timerLaeuft = true
            timerEnde = jetzt2 + timerMinuten[timerWahl] * 60000
            letzteMinute = -1
            basic.showIcon(IconNames.Yes)
        }
    } else if (modus == 3) {
        // Rechte Spieltaste
        spielAntwort(false)
    }
}
input.onButtonPressed(Button.A, function () {
    if (!(lichtAus)) {
        modusWechseln((modus + 1) % 4)
    }
})
function speichernAnfordern () {
    speichernOffen = true
    speichernAb = input.runningTime() + 2000
}
function spielStarten () {
    runde = 0
    punkte = 0
    spielStatus = 1
    naechstesSignal = input.runningTime() + randint(1200, 3000)
    basic.showIcon(IconNames.SmallDiamond)
}
pins.onPulsed(DigitalPin.P1, PulseValue.High, function () {
    tasteRechts()
})
function einstellungenSpeichern () {
    // Alle Werte in einer einzigen Zahl speichern
    wert = startmodus * 1000
    wert += farbeIndex * 100
    wert += effekt * 10
    wert += tempo
    flashstorage.put("licht", "" + wert)
    speichernOffen = false
}
pins.onPulsed(DigitalPin.P15, PulseValue.High, function () {
    tasteLinks()
})
function spielAntwort (links: boolean) {
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
input.onButtonPressed(Button.AB, function () {
    lichtAus = !(lichtAus)
    if (lichtAus) {
        timerLaeuft = false
        strip.clear()
        strip.show()
        basic.clearScreen()
    } else {
        animationNeu = true
        letzteAnimation = 0
        basic.showNumber(modus + 1)
        if (modus == 3) {
            spielStarten()
        }
    }
})
input.onButtonPressed(Button.B, function () {
    if (!(lichtAus)) {
        modusWechseln((modus + 3) % 4)
    }
})
function tasteLinks () {
    jetzt = input.runningTime()
    if (jetzt - letzteLinks < 130) {
        return
    }
    letzteLinks = jetzt
    if (lichtAus) {
        return
    }
    if (modus == 0) {
        // Naechste Farbe
        farbeIndex += 1
        if (farbeIndex >= farben.length) {
            farbeIndex = 0
        }
        speichernAnfordern()
    } else if (modus == 1) {
        // Naechster Lichteffekt
        effekt = (effekt + 1) % 4
        animationNeu = true
        letzteAnimation = 0
        basic.showNumber(effekt + 1)
        speichernAnfordern()
    } else if (modus == 2) {
        // Timerdauer waehlen
        timerLaeuft = false
        timerWahl = (timerWahl + 1) % 3
        basic.showNumber(timerMinuten[timerWahl])
    } else if (modus == 3) {
        // Linke Spieltaste
        spielAntwort(true)
    }
}
function modusWechseln (neuerModus: number) {
    modus = neuerModus
    timerLaeuft = false
    letzteMinute = -1
    animationNeu = true
    letzteAnimation = 0
    if (modus == 0 || modus == 1) {
        startmodus = modus
        speichernAnfordern()
    }
    basic.showNumber(modus + 1)
    if (modus == 3) {
        spielStarten()
    }
}
let spielHelligkeit = 0
let matrixAusAb = 0
let minuten = 0
let restzeit = 0
let nachtHelligkeit = 0
let index = 0
let wechselzeit = 0
let faktor = 0
let phase = 0
let halb = 0
let dauer = 0
let intervall = 0
let signalEnde = 0
let helligkeit = 0
let jetzt3 = 0
let jetzt = 0
let letzteAnimation = 0
let feedbackEnde = 0
let antwortRichtig = false
let wert = 0
let naechstesSignal = 0
let spielStatus = 0
let punkte = 0
let runde = 0
let speichernAb = 0
let speichernOffen = false
let timerEnde = 0
let timerWahl = 0
let timerLaeuft = false
let lichtAus = false
let jetzt2 = 0
let strip: neopixel.Strip = null
let modus = 0
let effekt = 0
let farbeIndex = 0
let startmodus = 0
let wert2 = 0
let letzteRechts = 0
let letzteLinks = 0
let zielLinks = false
let letzteMinute = 0
let animationNeu = false
let tempo = 0
let timerMinuten: number[] = []
let farben: number[] = []
farben = [
neopixel.rgb(255, 140, 45),
neopixel.rgb(0, 80, 255),
neopixel.rgb(0, 220, 190),
neopixel.rgb(0, 255, 40),
neopixel.rgb(150, 0, 255),
neopixel.rgb(255, 25, 130),
neopixel.rgb(255, 0, 0),
neopixel.rgb(255, 80, 0),
neopixel.rgb(220, 235, 255)
]
timerMinuten = [5, 10, 15]
tempo = 1
animationNeu = true
letzteMinute = -1
zielLinks = true
letzteLinks = -1000
letzteRechts = -1000
let gespeichert = flashstorage.get("licht")
if (gespeichert != "") {
    wert2 = parseInt(gespeichert)
    if (wert2 >= 0 && wert2 < 2000) {
        startmodus = Math.idiv(wert2, 1000)
        farbeIndex = Math.idiv(wert2 % 1000, 100)
        effekt = Math.idiv(wert2 % 100, 10)
        tempo = wert2 % 10
        if (farbeIndex >= farben.length) {
            farbeIndex = 0
        }
        if (effekt > 3) {
            effekt = 0
        }
        if (tempo > 2) {
            tempo = 1
        }
    }
}
modus = startmodus
strip = neopixel.create(DigitalPin.P16, 10, NeoPixelMode.RGB)
strip.setBrightness(100)
strip.showColor(farben[farbeIndex])
basic.showNumber(modus + 1)
basic.forever(function () {
    jetzt3 = input.runningTime()
    // Einstellungen nach kurzer Ruhe speichern
    if (speichernOffen && jetzt3 >= speichernAb) {
        einstellungenSpeichern()
    }
    // Helligkeit am Potentiometer
    helligkeit = 5 + Math.idiv(pins.analogReadPin(AnalogPin.P0) * 200, 1023)
    // --------------------------------
    // Spielsteuerung
    // --------------------------------
    if (!(lichtAus) && modus == 3) {
        if (spielStatus == 1 && jetzt3 >= naechstesSignal) {
            zielLinks = randint(0, 1) == 0
            spielStatus = 2
            signalEnde = jetzt3 + 2200
            basic.clearScreen()
        }
        if (spielStatus == 2 && jetzt3 >= signalEnde) {
            antwortRichtig = false
            spielStatus = 3
            feedbackEnde = jetzt3 + 600
            basic.showIcon(IconNames.No)
        }
        if (spielStatus == 3 && jetzt3 >= feedbackEnde) {
            runde += 1
            if (runde >= 10) {
                spielStatus = 4
                basic.showNumber(punkte)
            } else {
                spielStatus = 1
                naechstesSignal = jetzt3 + randint(1000, 3000)
                basic.showIcon(IconNames.SmallDiamond)
            }
        }
    }
    // --------------------------------
    // Ausschalten
    // --------------------------------
    if (lichtAus) {
        strip.clear()
        strip.show()
    } else if (modus == 0) {
        // ----------------------------
        // MODUS 1: FARBLAMPE
        // ----------------------------
        strip.setBrightness(helligkeit)
        strip.showColor(farben[farbeIndex])
    } else if (modus == 1) {
        // ----------------------------
        // MODUS 2: LICHTSHOW
        // ----------------------------
        intervall = 180 - tempo * 65
        if (animationNeu || jetzt3 - letzteAnimation >= intervall) {
            if (effekt == 0) {
                // Laufender Regenbogen
                if (animationNeu) {
                    strip.showRainbow(1, 360)
                } else {
                    strip.rotate(1)
                }
                strip.setBrightness(helligkeit)
            } else if (effekt == 1) {
                // Sanftes Atmen in Violett
                dauer = 3600 - tempo * 900
                halb = Math.idiv(dauer, 2)
                phase = jetzt3 % dauer
                if (phase > halb) {
                    phase = dauer - phase
                }
                faktor = 20 + Math.idiv(phase * 235, halb)
                strip.setBrightness(Math.idiv(helligkeit * faktor, 255))
                strip.showColor(neopixel.rgb(130, 25, 255))
            } else if (effekt == 2) {
                // Wechselnde Farben
                wechselzeit = 1300 - tempo * 400
                index = Math.idiv(jetzt3, wechselzeit) % farben.length
                strip.setBrightness(helligkeit)
                strip.showColor(farben[index])
            } else {
                // Funkelnde Lichtpunkte
                strip.setBrightness(helligkeit)
                strip.showColor(neopixel.rgb(10, 3, 35))
                strip.setPixelColor(randint(0, 9), neopixel.rgb(180, 80, 255))
                strip.setPixelColor(randint(0, 9), neopixel.rgb(80, 190, 255))
            }
            strip.show()
            animationNeu = false
            letzteAnimation = jetzt3
        }
    } else if (modus == 2) {
        // ----------------------------
        // MODUS 3: EINSCHLAFLICHT
        // ----------------------------
        nachtHelligkeit = helligkeit
        if (timerLaeuft) {
            restzeit = timerEnde - jetzt3
            if (restzeit <= 0) {
                timerLaeuft = false
                lichtAus = true
                strip.clear()
                strip.show()
                basic.clearScreen()
            } else {
                // Letzte Minute langsam dimmen
                if (restzeit <= 60000) {
                    nachtHelligkeit = Math.idiv(helligkeit * restzeit, 60000)
                }
                // Verbleibende Minuten anzeigen
                minuten = Math.idiv(restzeit + 59999, 60000)
                if (minuten != letzteMinute) {
                    letzteMinute = minuten
                    basic.showNumber(minuten)
                    matrixAusAb = input.runningTime() + 2500
                }
                // Anzeige nach 2.5 Sekunden loeschen
                if (matrixAusAb > 0 && jetzt3 >= matrixAusAb) {
                    basic.clearScreen()
                    matrixAusAb = 0
                }
            }
        }
        if (!(lichtAus)) {
            strip.setBrightness(nachtHelligkeit)
            strip.showColor(neopixel.rgb(255, 120, 35))
        }
    } else if (modus == 3) {
        // ----------------------------
        // MODUS 4: REAKTIONSSPIEL
        // ----------------------------
        spielHelligkeit = Math.max(80, helligkeit)
        strip.setBrightness(spielHelligkeit)
        if (spielStatus == 1) {
            // Warten: schwaches violettes Licht
            strip.setBrightness(25)
            strip.showColor(neopixel.rgb(40, 0, 100))
        } else if (spielStatus == 2) {
            if (zielLinks) {
                // Gruen = linker Taster
                strip.showColor(neopixel.rgb(0, 255, 0))
            } else {
                // Rot = rechter Taster
                strip.showColor(neopixel.rgb(255, 0, 0))
            }
        } else if (spielStatus == 3) {
            if (antwortRichtig) {
                strip.showColor(neopixel.rgb(0, 255, 100))
            } else {
                strip.showColor(neopixel.rgb(255, 0, 0))
            }
        } else {
            // Spielende
            strip.setBrightness(40)
            strip.showRainbow(1, 360)
        }
    }
    basic.pause(50)
})
