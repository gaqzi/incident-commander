/// <reference types="cypress" />

// Slight speed up for Cypress tests by removing the delay between keystrokes
Cypress.Keyboard.defaults({
  keystrokeDelay: 0
})

// function getDataTest (target, suffix = '') {
//   return cy.get(`[data-test="${target}"] ${suffix}`)
// }

const URL = 'http://127.0.0.1:5432/incident/ongoing?disableMultiplayer=true'

function getDataTest (ids, suffix = '') {
  // OMG WTF: learing: cy.get seems to mutate a global state that all cy.get.shoulds are evaluated against!
  // This means you can't hold a reference to this
  let selector = `[data-test="${ids}"]`
  if (Array.isArray(ids)) {
    selector = ids.reduce((accum, id) => accum + `[data-test="${id}"] `, '')
  }
  if (suffix != '') {
    return cy.get('body').find(selector + ' ' + suffix)
  }
  return cy.get('body').find(selector + ' ' + suffix)
}

function submitIncident (what, when, where, impact, shouldUseDefaultActions) {
  getDataTest('summary__input__what').type(what)
  getDataTest('summary__input__when').clear().type(when)
  getDataTest('summary__input__where').type(where)
  getDataTest('summary__input__impact').type(impact)
  if (shouldUseDefaultActions) {
    getDataTest('summary__add-default-actions').check()
  } else {
    getDataTest('summary__add-default-actions').uncheck()
  }
  getDataTest('summary__submit').click()
}

function addActionToIncident ({ what = 'action-what', who = 'action-who', link = 'http://example.com', minutes = 10, isMitigating = false }) {
  getDataTest('actions__active__add_action').click()
  getDataTest('new-action__what').type(what)
  getDataTest('new-action__who').type(who)
  getDataTest('new-action__link').type(link)
  getDataTest('new-action__minutes-between-updates').clear().type(minutes)
  if (isMitigating) {
    getDataTest('new-action__is-mitigating').check()
  } else {
    getDataTest('new-action__is-mitigating').uncheck()
  }

  getDataTest('new-action__submit').click()
}

describe('Creating a New Incident', () => {
  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
  })

  it('creates a new incident - without default actions', () => {
    const what = 'This is the what'
    const when = '2021-01-02 11:22:00'
    const where = 'This is the where'
    const impact = 'This is the impact'

    submitIncident(what, when, where, impact, false)

    // Summary
    const summary = getDataTest('summary')
    summary.should('contain.text', what)
    summary.should('contain.text', when)
    summary.should('contain.text', where)
    summary.should('contain.text', impact)

    // Affected Systems
    getDataTest('affected-systems__listing__active', '>ul>li')
      .should('have.lengthOf', 1)
      .should('contain.text', what)

      .find('[data-test="actions__active"] li')
      .should('have.lengthOf', 0)

    getDataTest('affected-systems__listing__past', 'li')
      .should('have.lengthOf', 0)
  })

  it('creates a new incident - with default actions', () => {
    const what = 'This is the what'
    const when = 'This is the when'
    const where = 'This is the where'
    const impact = 'This is the impact'

    submitIncident(what, when, where, impact, true)

    // TODO file a bug with Cypress.  should('have.length.of',...) silently passes but is invalid.  'have.length.eq' seems to work, as does 'have.lengthOf'

    getDataTest('affected-system__past')
      .should('not.exist')

    getDataTest('affected-system__active')
      .should('have.lengthOf', 1)
      .should('contain.text', 'Was a feature flag toggled recently?')
      .should('contain.text', 'Has there been an infrastructure changed recently?')
  })

  it('can select the status through the keyboard', () => {
    getDataTest('summary__select__status')
      .click()
      .type('monitor{enter}')
    const what = 'This is the what'
    const when = 'This is the when'
    const where = 'This is the where'
    const impact = 'This is the impact'

    submitIncident(what, when, where, impact, true)

    getDataTest('summary', '.status')
      .should('contain.text', 'Monitoring')
  })
})

describe('Ongoing Incident: Managing the Summary', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you edit the incident summary attributes', () => {
    // Showing the form
    getDataTest('affected-systems__listing__active').should('contain.text', what)
    getDataTest('summary__input__what').should('not.exist')
    getDataTest('summary', '>span').trigger('mouseover')
    getDataTest('button-edit-summary').click()

    const newStatus = 'Monitoring'
    const newWhat = 'new what'
    const newWhen = 'new when'
    const newWhere = 'new where'
    const newImpact = 'new impact'

    getDataTest('summary__select__status').click().type(`${newStatus}{enter}`)
    getDataTest('summary__input__what').clear().type(newWhat)
    getDataTest('summary__input__when').clear().type(newWhen)
    getDataTest('summary__input__where').clear().type(newWhere)
    getDataTest('summary__input__impact').clear().type(newImpact)
    getDataTest('summary__submit').click()

    getDataTest('summary')
      .should('contain.text', newStatus)
      .should('contain.text', newWhat)
      .should('contain.text', newWhen)
      .should('contain.text', newWhere)
      .should('contain.text', newImpact)
      .should('not.contain.text', what)
      .should('not.contain.text', when)
      .should('not.contain.text', where)
      .should('not.contain.text', impact)
  })
})

describe('Ongoing Incident: Managing Affected Components', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add another affected component', () => {
    const newWhat = 'Another what'
    getDataTest('btn-add-affected-system').click()
    getDataTest('new-affected-system__what').type(newWhat)
    getDataTest('new-affected-system__submit').click()

    getDataTest('affected-systems__listing__active', '>ul>li')
      .should('have.length', 2)
      .should('contain.text', newWhat)
  })

  it('lets you edit the text of an add affected component', () => {
    // Showing the form
    getDataTest('affected-systems__listing__active').should('contain.text', what)
    // getDataTest('summary__input__what').should('not.exist')
    getDataTest('button-edit-affected-system').click()

    const newWhat = 'changed to this'
    getDataTest('new-affected-system__what').clear().type(newWhat)
    getDataTest('new-affected-system__submit').click()

    getDataTest('affected-systems__listing__active')
      .should('not.contain.text', what)
      .should('contain.text', newWhat)
  })

  it('lets you resolve an affected component', () => {
    getDataTest('affected-systems__listing__active', '>ul>li').should('have.length', 1)
    getDataTest('affected-systems__listing__past', '>ul>li').should('not.exist')

    getDataTest('affected-systems__listing__active')
      .contains(what)
      .trigger('mouseover')
      .get('[data-test="button-resolve-affected-system"]')
      .click()

    getDataTest('affected-systems__listing__active', '>ul>li').should('not.exist')
    getDataTest('affected-systems__listing__past', '>ul>li').should('have.length', 1)
    getDataTest('affected-systems__listing__past').should('contain.text', what)
  })
})

describe('Ongoing Incident: Managing Actions', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add an action', () => {
    getDataTest('actions__active', 'li').should('not.exist')

    const what = 'a new action'
    const who = 'john doe'
    const link = 'http://example.com'
    const minutes = 10
    addActionToIncident({ who, what, link, minutes, isMitigating: false })

    getDataTest('actions__active', '>li').should('have.lengthOf', 1)
    const action = getDataTest('actions__active').within(el => el.get('li')).first()
    action.should('contain.text', what)
    action.should('contain.text', who)
    action.within(el => el.get(`a[href="${link}"]`)).should('be.visible')
    action.within(el => el.get('input[data-test="action__is-mitigating"')).should('not.be.checked')
  })

  it('allows you to start typing the what without clicking on the field', () => {
    getDataTest('actions__active__add_action').click()

    getDataTest('new-action__what').should('be.focused')
  })

  it('lets you edit the text of an active action', () => {
    const what = 'old what'
    addActionToIncident({ what })

    const newWhat = 'new what'
    getDataTest('active_action__what').trigger('mouseover')
    getDataTest('action__edit').click()
    getDataTest('new-action__what').clear().type(newWhat)
    getDataTest('new-action__submit').click()

    getDataTest('active_action__what')
      .should('not.contain.text', what)
      .should('contain.text', newWhat)
  })

  it('lets you edit the link of an active action', () => {
    const linkVal = 'http://google.com'
    addActionToIncident({ link: linkVal })

    const newLinkVal = 'http://example.com'
    getDataTest('active_action__link').trigger('mouseover')
    getDataTest('action__edit').click()
    getDataTest('new-action__link').clear().type(newLinkVal)

    getDataTest('new-action__submit').click()

    getDataTest('active_action__link').should('have.attr', 'href', newLinkVal)
  })

  it('lets you reset or edit the timer of an active action', () => {
    const minutes = 10
    addActionToIncident({ minutes })

    const getCountdownDisplay = () => {
      return getDataTest('actions__active', '[data-test="countdown-display-wrapper"]').first()
    }

    cy.wait(1 * 1000)

    // capture value, wait a teensy bit to see the value change
    getCountdownDisplay().within(() => cy.get('.minutes').invoke('text').then(parseInt).as('initialMins'))
    getCountdownDisplay().within(() => cy.get('.seconds').invoke('text').then(parseInt).as('initialSecs'))
    cy.wait(3 * 1000)

    // look at value after waiting
    getCountdownDisplay().within(() => cy.get('.minutes').invoke('text').then(parseInt).as('waitedMins'))
    getCountdownDisplay().within(() => cy.get('.seconds').invoke('text').then(parseInt).as('waitedSecs'))

    // expect to be lower
    cy.then(function () {
      expect(this.waitedMins * 60 + this.waitedSecs).to.be.below(this.initialMins * 60 + this.initialSecs)
    })

    // now restart timer
    getCountdownDisplay().within(() => cy.get('[data-test="countdown-display"]').trigger('mouseover'))
    getDataTest('countdown-timer__restart').click()
    cy.wait(1 * 1000)

    // get the restart timer vals
    getCountdownDisplay().within(() => cy.get('.minutes').invoke('text').then(parseInt).as('restartMins'))
    getCountdownDisplay().within(() => cy.get('.seconds').invoke('text').then(parseInt).as('restartSecs'))

    // expect them to be higher
    cy.then(function () {
      expect(this.restartMins * 60 + this.restartSecs).to.be.above(this.waitedMins * 60 + this.waitedSecs)
    })

    // now set new value to timer
    const newMinutes = 20
    getCountdownDisplay().trigger('mouseover')
    getDataTest('countdown-timer__edit').click()
    getDataTest('countdown-timer__minutes').clear().type(newMinutes)
    getDataTest('countdown-timer-form__submit').click()
    cy.wait(1 * 1000)

    // get the new values
    getCountdownDisplay().within(() => cy.get('.minutes').invoke('text').then(parseInt).as('newMins'))
    getCountdownDisplay().within(() => cy.get('.seconds').invoke('text').then(parseInt).as('newSecs'))

    // expect them to be what we just set
    cy.then(function () {
      // doing a range here just because we'r dealing with timing code
      expect(this.newMins * 60 + this.newSecs).to.be.greaterThan(newMinutes * 60 - 10)
      expect(this.newMins * 60 + this.newSecs).to.be.lessThan(newMinutes * 60 + 1)
    })
  })

  it('lets you toggle an active action as mitigating or not', () => {
    addActionToIncident({ isMitigating: false })
    getDataTest('action__is-mitigating').should('not.exist')

    getDataTest('active_action__what').trigger('mouseover')
    getDataTest('action__edit').click()
    getDataTest('new-action__is-mitigating').check()
    getDataTest('new-action__submit').click()
    getDataTest('action__is-mitigating').should('exist')
  })

  it('lets you finish an action as a success or a failure', () => {
    addActionToIncident({ what: 'Will be a success' })
    addActionToIncident({ what: 'Will be a failure' })

    getDataTest('actions__inactive', 'li').should('not.exist')

    // click mark as success
    getDataTest('active_action__what').first().trigger('mouseover')
    getDataTest('active_action__succeeded').first().click()

    getDataTest('actions__inactive', 'li')
      .should('contain.text', 'Will be a success')
      .should('contain.text', 'Success')
      .should('not.contain.text', 'Will be a failure')
      .should('not.contain.text', 'Failure')

    // click mark as failure
    // need to stub the prompt...
    const failureReason = 'This is the failure reason'
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns(failureReason)
    })

    getDataTest('active_action__what').first().trigger('mouseover')
    getDataTest('active_action__failed').first().click()

    getDataTest('actions__inactive', 'li')
      .should('contain.text', 'Will be a failure')
      .should('contain.text', 'Failure')
      .should('contain.text', failureReason) // TODO
  })
})

describe('Ongoing Incident: Status Updates', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  describe('Business Update', () => {
    it('provides the current status of the incident, the summary, and the currently affected components', () => {
      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => { clipboardText = text })
      })

      getDataTest('button-business-update')
        .click()
        .then(() => expect(clipboardText).to.eq(
          `Business Update\n*Investigating*\nSince ${when} we are seeing ${what} in ${where} impacting ${impact}.\n\n*Current status:*\n- 🔴 ${what}`
        ))
    })
  })

  describe('Tech Update', () => {
    it('provides the status, summary, affected components, current actions', () => {
      addActionToIncident({ what: 'The Action', who: 'The Who', link: 'http://example.com/', minutes: 10, isMitigating: true })
      addActionToIncident({ what: 'A failed action', who: 'The Whom', link: 'http://example.com/', minutes: 10, isMitigating: true })

      // Mark action as failed
      cy.window().then((win) => cy.stub(win, 'prompt').returns('Was not destined to be.'))
      getDataTest('active_action__what').eq(1).trigger('mouseover')
      getDataTest('active_action__failed').click()

      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => { clipboardText = text })
      })

      const expected = '' +
              `Tech Update\n*Investigating*\nSince ${when} we are seeing ${what} in ${where} impacting ${impact}.` +
              `\n\n*Current status:*\n- 🔴 ${what}` +
              '\n    *Actions:*\n' +
              '    - The Action (@The Who) [More info](http://example.com/)' +
              // '\n\n*Past actions:*\n- ❌ A failed action (The Whom) [More info](http://example.com/)\n    - Was not destined to be.'
              '\n' +
              '\n    *Past Actions:*' +
              '\n    - ❌ A failed action (@The Whom) [More info](http://example.com/) -- Was not destined to be.'

      getDataTest('button-tech-update')
        .click()
        .then(() => {
          expect(clipboardText).to.eq(expected)
        })
    })
  })
})
