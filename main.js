import { Countdown, CountdownDisplay } from './countdown.mjs'

// No idea what the practice here is, do we put in the definition in the
// module or in main? I'm going with main for now so all the custom
// components are declared in one place, but it feels weird
customElements.define('countdown-display', CountdownDisplay)
customElements.define('countdown-timer', Countdown)
