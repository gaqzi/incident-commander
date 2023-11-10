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
  getDataTest('summary__input__when').clear().type(when, {delay: 5})
  getDataTest('summary__input__where').type(where)
  getDataTest('summary__input__impact').type(impact)
  if (shouldUseDefaultActions) {
    getDataTest('summary__add-default-actions').check()
  } else {
    getDataTest('summary__add-default-actions').uncheck()
  }
  getDataTest('summary__submit').click()
}

function addResourceLink(name, url) {
  getDataTest('button-add-resource').click()
  getDataTest('resource-link__name').clear().type(name)
  getDataTest('resource-link__url').clear().type(url)
  getDataTest('resource-link__submit').click()
}

function addActionToIncident ({ what = 'action-what', who = 'action-who', link = 'http://example.com', minutes = 10}) {
  getDataTest('actions__active__add_action').click()
  getDataTest('new-action__what').type(what)
  getDataTest('new-action__who').type(who)
  getDataTest('new-action__link').type(link)
  getDataTest('new-action__minutes-between-updates').clear().type(minutes)

  getDataTest('action-form__submit').click()
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

      .find('[data-test="actions__active"] li.action')
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
      .should('contain.text', 'Has there been an infrastructure change recently?')
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

describe('Ongoing Incident: Collaborating in the shared notepad', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you write in a notepad', () => {
    // Note: we aren't simulating anything in multiplayer for these tests, so the fact that this is a multiplayer notepad isnt tested yet
    getDataTest('notes').type('Hello there')
    getDataTest('notes').should('have.text', 'Hello there')
  })
})


describe('Ongoing Incident: Managing Affected Systems', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add another affected system', () => {
    const newWhat = 'Another what'
    getDataTest('btn-add-affected-system').click()
    getDataTest('new-affected-system__what').type(newWhat)
    getDataTest('new-affected-system__submit').click()

    getDataTest('affected-systems__listing__active', '>ul>li')
      .should('have.length', 2)
      .should('contain.text', newWhat)
  })

  it('lets you edit the text of an add affected system', () => {
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

  it('lets you resolve and unresolve an affected system', () => {
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

    getDataTest('affected-systems__listing__past')
      .contains(what)
      .trigger('mouseover')
      .get('[data-test="button-unresolve-affected-system"]')
      .click()

    getDataTest('affected-systems__listing__active', '>ul>li').should('have.length', 1)
    getDataTest('affected-systems__listing__past', '>ul>li').should('not.exist')
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
    getDataTest('actions__active', 'li.action').should('not.exist')

    const what = 'a new action'
    const who = 'john doe'
    const link = 'http://example.com'
    const minutes = 10
    addActionToIncident({ who, what, link, minutes })

    getDataTest('actions__active', '>li.action').should('have.lengthOf', 1)
    const action = getDataTest('actions__active').within(el => el.get('li')).first()
    action.should('contain.text', what)
    action.should('contain.text', who)
    action.within(el => el.get(`a[href="${link}"]`)).should('be.visible')
  })

  it('allows you to start typing the what without clicking on the field', () => {
    getDataTest('actions__active__add_action').click()

    getDataTest('new-action__what').should('be.focused')
  })

  it('lets you edit the text of an active action', () => {
    const what = 'old what'
    addActionToIncident({ what })

    const newWhat = 'new what'
    getDataTest('action__more').trigger('mouseover')
    getDataTest('action__edit').click()
    getDataTest('new-action__what').clear().type(newWhat)
    getDataTest('action-form__submit').click()

    getDataTest('action-card', '>.ant-card-head')
      .should('not.contain.text', what)
      .should('contain.text', newWhat)
  })

  it('lets you edit the link of an active action', () => {
    const linkVal = 'http://google.com'
    addActionToIncident({ link: linkVal })

    const newLinkVal = 'http://example.com'
    getDataTest('action__more').trigger('mouseover')
    getDataTest('action__edit').click()
    getDataTest('new-action__link').clear().type(newLinkVal)

    getDataTest('action-form__submit').click()

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
    getDataTest('new-action__minutes-between-updates').clear().type(newMinutes)
    getDataTest('action-form__submit').click()
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

  it('lets you finish an action as a chore, success, or failure, and cancels their timers', () => {
    const getCountdownDisplay = () => {
      return getDataTest('actions__active', '[data-test="countdown-display-wrapper"]').first()
    }

    addActionToIncident({ what: 'Will be a success', minutes: 2 })
    addActionToIncident({ what: 'Will be a failure', minutes: 2 })
    addActionToIncident({ what: 'Will be a chore', minutes: 2 })

    getDataTest('actions__inactive', 'li').should('not.exist')

    // click mark as success
    getDataTest('action__more').first().trigger('mouseover')
    getDataTest('action__resolve_success').first().click({force: true})

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

    getDataTest('action__more').first().trigger('mouseover')
    getDataTest('action__resolve_failure').first().click({force: true})

    getDataTest('actions__inactive', 'li')
      .should('contain.text', 'Will be a failure')
      .should('contain.text', 'Failure')
      .should('contain.text', failureReason)


    // click mark as chore
    getDataTest('action__more').first().trigger('mouseover')
    getDataTest('action__resolve_chore').first().click({force: true})

    getDataTest('actions__inactive', 'li')
      .should('contain.text', 'Will be a success')
      .should('contain.text', 'Success')
      .should('contain.text', 'Will be a failure')
      .should('contain.text', 'Failure')
      .should('contain.text', 'Will be a chore')
      .should('contain.text', 'Chore')


    cy.wait(1 * 1000)

    // capture first inactive action timer value
    getDataTest('actions__inactive', '[data-test="countdown-display-wrapper"]').eq(0).within(() => {
      cy.get('.minutes').invoke('text').then(parseInt).as('finishedMins')
      cy.get('.seconds').invoke('text').then(parseInt).as('finishedSecs')
    })
    // expect timer values to be 0m0s
    cy.then(function () {
      expect(this.finishedMins).to.eq(0)
      expect(this.finishedSecs).to.eq(0)
    })

    // capture next inactive action timer value
    getDataTest('actions__inactive', '[data-test="countdown-display-wrapper"]').eq(1).within(() => {
      cy.get('.minutes').invoke('text').then(parseInt).as('finishedMins')
      cy.get('.seconds').invoke('text').then(parseInt).as('finishedSecs')
    })

    // expect timer values to be 0m0s
    cy.then(function () {
      expect(this.finishedMins).to.eq(0)
      expect(this.finishedSecs).to.eq(0)
    })

    // capture last inactive action timer value
    getDataTest('actions__inactive', '[data-test="countdown-display-wrapper"]').eq(2).within(() => {
      cy.get('.minutes').invoke('text').then(parseInt).as('finishedMins')
      cy.get('.seconds').invoke('text').then(parseInt).as('finishedSecs')
    })

    // expect timer values to be 0m0s
    cy.then(function () {
      expect(this.finishedMins).to.eq(0)
      expect(this.finishedSecs).to.eq(0)
    })
  })

  it.only('lets you add, edit, and remove timeline entries for the action, and it paginates them', () => {
    addActionToIncident({ what: 'Some Action' })
    getDataTest('action__timeline', 'li').should('have.length', 1) // This is the new item input box

    // Enter key adds entry and clears the text box
    getDataTest('action__timeline_form__text').should('have.value', '')
    getDataTest('action__timeline_form__text').clear().type('Note A{enter}')
    getDataTest('action__timeline').should('contain.text', 'Note A')
    getDataTest('action__timeline_form__text').should('have.value', '')

    // We have 1 entry in timeline. Don't show collapse and expand buttons until we have 4 entries total (first 3 will be visible)...
    getDataTest('action__timeline__expand_button').should('not.exist')
    getDataTest('action__timeline__collapse_button').should('not.exist')

    // Make 2 more entries. Collapse and expand buttons should still be hidden.
    getDataTest('action__timeline_form__text').clear().type('Note B{enter}')
    getDataTest('action__timeline').should('contain.text', 'Note B')
    getDataTest('action__timeline').should('contain.text', 'Note A')
    getDataTest('action__timeline__expand_button').should('not.exist')
    getDataTest('action__timeline__collapse_button').should('not.exist')

    getDataTest('action__timeline_form__text').clear().type('Note C{enter}')
    getDataTest('action__timeline').should('contain.text', 'Note C')
    getDataTest('action__timeline').should('contain.text', 'Note B')
    getDataTest('action__timeline').should('contain.text', 'Note A')
    getDataTest('action__timeline__expand_button').should('not.exist')
    getDataTest('action__timeline__collapse_button').should('not.exist')

    // Here is 4th entry. After this we should see expand button and entry A should have dropped into the collapsed section
    getDataTest('action__timeline_form__text').clear().type('Note D{enter}')
    getDataTest('action__timeline').should('contain.text', 'Note D')
    getDataTest('action__timeline').should('contain.text', 'Note C')
    getDataTest('action__timeline').should('contain.text', 'Note B')
    getDataTest('action__timeline').should('not.contain.text', 'Note A')
    getDataTest('action__timeline__expand_button').should('be.visible')
    getDataTest('action__timeline__collapse_button').should('not.exist')

    // Click the expand button and we should see note A, and expand button should be gone, replaced by collapse button
    getDataTest('action__timeline__expand_button').click()
    getDataTest('action__timeline').should('contain.text', 'Note A')
    getDataTest('action__timeline__expand_button').should('not.exist')
    getDataTest('action__timeline__collapse_button').should('be.visible')

    // And clicking on collapse should re-hide old notes and the collapse button, and show the expand button
    getDataTest('action__timeline__collapse_button').click()
    getDataTest('action__timeline').should('not.contain.text', 'Note A')
    getDataTest('action__timeline__collapse_button').should('not.exist')
    getDataTest('action__timeline__expand_button').should('be.visible')

    // We can delete a timeline entry. Let's delete D and see A come back on screen and D disappear...
    getDataTest('action__timeline__entry').eq(0).trigger('mouseover')
    getDataTest('action__timeline__entry__delete').click()
    getDataTest('action__timeline').should('not.contain.text', 'Note D')
    getDataTest('action__timeline').should('contain.text', 'Note C')
    getDataTest('action__timeline').should('contain.text', 'Note B')
    getDataTest('action__timeline').should('contain.text', 'Note A')

    // We can also edit a timeline entry...
    getDataTest('action__timeline__entry').eq(0).trigger('mouseover')
    getDataTest('action__timeline__entry__edit').click()
    getDataTest('action__timeline__entry__form__text').clear().type('Updated Note C Text')
    getDataTest('action__timeline__entry__form__timestamp').clear().type('Updated Note C Timestamp Value') // Yes, timestamps are just strings with no validation right now
    getDataTest('action__timeline__entry__form__submit').click()
    getDataTest('action__timeline__entry__text').eq(0).invoke('text').should('eq', 'Updated Note C Text')
    getDataTest('action__timeline__entry__timestamp').eq(0).invoke('text').should('eq', 'Updated Note C Timestamp Value')
  })
})

describe('Ongoing Incident: Managing Resources', () => {
  beforeEach(() => {
    const what = 'This is the what'
    const when = 'This is the when'
    const where = 'This is the where'
    const impact = 'This is the impact'

    cy.visit(URL) // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add and edit resource links', () => {
    addResourceLink('Link One', 'http://one.com')
    getDataTest('incident-summary__resources', 'ul.incident-summary__links__list li')
    .should('contain.text', 'Link One')
    .within(() => {
      cy.get('a').should('have.attr', 'href', "http://one.com")
    })


    // edit the link
    getDataTest('incident-summary__resources', 'ul.incident-summary__links__list li').eq(0).trigger('mouseover')
    getDataTest('button-edit-resource').click()

    getDataTest('resource-link__name').clear().type('Link One Updated')
    getDataTest('resource-link__url').clear().type('http://one-updated.com')
    getDataTest('resource-link__submit').click()

    getDataTest('incident-summary__resources', 'ul.incident-summary__links__list li')
    .should('contain.text', 'Link One Updated')
    .within(() => {
      cy.get('a').should('have.attr', 'href', "http://one-updated.com")
    })
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
    it('provides the status, summary, resources, affected components, current actions', () => {
      // Make resource links
      addResourceLink('Link One', 'http://one.com')
      addResourceLink('Link Two', 'http://two.com')

      // Make Actives
      addActionToIncident({ what: '0 Active', who: 'Person 0', link: 'http://zero.com/', minutes: 0 })

      // Make Inactives
      addActionToIncident({ what: '1 Chore', who: 'Person 1', link: 'http://one.com/', minutes: 0 })
      addActionToIncident({ what: '2 Succeeded', who: 'Person 2', link: 'http://two.com/', minutes: 0 })
      addActionToIncident({ what: '3 Failed', who: 'Person 3', link: 'http://three.com/', minutes: 0 })

      // Finish Chore and Succeeded
      // promptReturn = 'It worked.'
      getDataTest('action__more').eq(1).trigger('mouseover')
      getDataTest('action__resolve_chore').click({force: true})
      getDataTest('action__more').eq(1).trigger('mouseover')
      getDataTest('action__resolve_success').click({force: true})

      // Finish Failed
      let promptReturn
      promptReturn = 'It failed.'
      cy.window().then((win) => cy.stub(win, 'prompt').returns(promptReturn))
      getDataTest('action__more').eq(1).trigger('mouseover')
      getDataTest('action__resolve_failure').click({force: true})


      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => { clipboardText = text })
      })

      // All active actions should show up
      // All non-Chore non-active actions should show up
      // Chores are only important while they are active, so we don't keep them for the stateless update once they are finished
      const expected = '' +
              `Tech Update` +
              `\n*Investigating*` +
              `\nSince ${when} we are seeing ${what} in ${where} impacting ${impact}.` +
              `\n` +
              `\n*Resources:*` +
              `\n- [Link One](http://one.com)` +
              `\n- [Link Two](http://two.com)` +
              `\n` +
              `\n*Current status:*` +
              `\n- 🔴 ${what}` +
              `\n    *Actions:*` +
              `\n    - 0 Active (@Person 0) [More info](http://zero.com/)` +
              `\n` +
              `\n    *Past Actions:*` +
              `\n    - ✔️ 2 Succeeded (@Person 2) [More info](http://two.com/)` +
              `\n    - ❌ 3 Failed (@Person 3) [More info](http://three.com/) -- It failed.` 

      getDataTest('button-tech-update')
        .click()
        .then(() => {
          expect(clipboardText).to.eq(expected)
        })
    })
  })
})
