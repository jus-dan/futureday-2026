input.onButtonPressed(Button.A, function () {
    modeb = 0
    farbe = neopixel.rgb(randint(0, 255), randint(0, 255), randint(0, 255))
    strip.showColor(farbe)
    strip.show()
})
pins.onPulsed(DigitalPin.P1, PulseValue.High, function () {
    basic.showLeds(`
        . . # . .
        . . . # .
        # # # # #
        . . . # .
        . . # . .
        `)
})
pins.onPulsed(DigitalPin.P15, PulseValue.High, function () {
    basic.showLeds(`
        . . # . .
        . # . . .
        # # # # #
        . # . . .
        . . # . .
        `)
})
input.onButtonPressed(Button.B, function () {
    strip.showRainbow(1, 360)
    modeb = 1
})
let farbe = 0
let strip: neopixel.Strip = null
let modeb = 0
modeb = 0
strip = neopixel.create(DigitalPin.P16, 10, NeoPixelMode.RGB)
farbe = neopixel.colors(NeoPixelColors.Black)
strip.showColor(farbe)
strip.show()
basic.forever(function () {
    if (modeb == 1) {
        strip.rotate(1)
        strip.show()
        basic.pause(50)
    } else {
        strip.setBrightness(Math.map(pins.analogReadPin(AnalogPin.P0), 0, 1023, 0, 255))
        strip.showColor(farbe)
        strip.show()
        basic.pause(100)
    }
})
