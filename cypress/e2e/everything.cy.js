/// <reference types="cypress" />

// Slight speed up for Cypress tests by removing the delay between keystrokes
Cypress.Keyboard.defaults({
  keystrokeDelay: 0,
})


function getDataTest (target) {
  return cy.get(`[data-test="${target}"]`)
}

function submitIncident (what, when, where, impact, shouldUseDefaultActions) {
  getDataTest('new-incident__what').type(what)
  getDataTest('new-incident__when').type(when)
  getDataTest('new-incident__where').type(where)
  getDataTest('new-incident__impact').type(impact)
  if (shouldUseDefaultActions) {
    getDataTest('new-incident__add-default-actions').check()
  } else {
    getDataTest('new-incident__add-default-actions').uncheck()
  }
  getDataTest('new-incident__submit').click()
}

function addActionToIncident ({what='action-what', who='action-who', link='http://example.com', minutes=10, isMitigating=false}) {
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
    cy.visit('http://127.0.0.1:5432/?disableMultiplayer=true') // TODO: dont use hardcoded port
  })

  it('creates a new incident - without default actions', () => {
    const what = 'This is the what'
    const when = 'This is the when'
    const where = 'This is the where'
    const impact = 'This is the impact'

    submitIncident(what, when, where, impact, false)

    // Summary
    const summary = getDataTest('summary')
    summary.should('contain.text', when)
    summary.should('contain.text', where)
    summary.should('contain.text', impact)

    // Affected Systems
    getDataTest('affected-systems__active').should('contain.text', what)
    getDataTest('affected-systems__past').get('li').should('have.length.of', 0)

    // Actions
    getDataTest('actions__active').get('active-action').should('have.length.of', 0)
    getDataTest('past-actions li').should('have.length.of', 0)
  })

  it('creates a new incident - with default actions', () => {
    const what = 'This is the what'
    const when = 'This is the when'
    const where = 'This is the where'
    const impact = 'This is the impact'

    submitIncident(what, when, where, impact, true)

    const activeActions = getDataTest('actions__active')
    activeActions.get('active-action').should('have.length.of', 3)
    activeActions.should('contain.text', 'Was there a recent deploy?')
    activeActions.should('contain.text', 'Was a feature flag toggled recently?')
    activeActions.should('contain.text', 'Has there been an infrastructure changed recently?')
  })
})

describe('Ongoing Incident: Managing Affected Components', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5432/?disableMultiplayer=true') // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add another affected component', () => {
    const newWhat = 'Another what'
    getDataTest('new-affected-system__what').type(newWhat)
    getDataTest('new-affected-system__submit').click()

    getDataTest('affected-systems').should('have.length.of', 2)
    getDataTest('affected-systems').should('contain.text', newWhat)
  })

  it('lets you edit the text of an add affected component', () => {
    // Showing & Cancelling update dialog
    getDataTest('affected-systems').should('contain.text', what)
    getDataTest('update-affected-system__dialog').should('not.be.visible')
    getDataTest('affected-systems').contains(what).rightclick()
    getDataTest('update-affected-system__dialog').should('be.visible')
    getDataTest('update-affected-system__cancel').click()

    // Changing via the dialog
    const newWhat = 'changed to this'
    getDataTest('affected-systems').contains(what).rightclick()
    getDataTest('update-affected-system__what').clear().type(newWhat)
    getDataTest('update-affected-system__submit').click()
    getDataTest('affected-systems').should('not.contain.text', what)
    getDataTest('affected-systems').should('contain.text', newWhat)
    getDataTest('affected-systems').should('have.length.of', 1)
  })

  it('lets you resolve an affected component', () => {
    getDataTest('affected-systems').should('have.length.of', 1)
    getDataTest('affected-systems__past').should('have.length.of', 0)

    getDataTest('affected-systems').contains(what).get('[data-test="affected-system__resolve"]').click()

    getDataTest('affected-systems').should('have.length.of', 0)
    getDataTest('affected-systems__past').should('have.length.of', 1)
    getDataTest('affected-systems__past').should('contain.text', what)
  })
})

describe('Ongoing Incident: Managing Actions', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5432/?disableMultiplayer=true') // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  it('lets you add an action', () => {
    getDataTest('actions__active').get('li').should('have.length.of', 0)

    const what = 'a new action'
    const who = 'john doe'
    const link = 'http://example.com'
    const minutes = 10
    addActionToIncident({who, what, link, minutes, isMitigating: false})

    getDataTest('actions__active').get('li').should('have.length.of', 1)
    const action = getDataTest('actions__active').within(el => el.get('li')).first()
    action.should('contain.text', what)
    action.should('contain.text', who)
    action.within(el => el.get(`a[href="${link}"]`)).should('be.visible')
    action.within(el => el.get('input[data-test="action__is-mitigating"')).should('not.be.checked')
  })

  it('lets you edit the text of an active action', () => {
    const what = 'old what'
    addActionToIncident({what})
    const activeActions = getDataTest('actions__active')

    // This is how you type into prompts with Cypress =-\
    const newWhat = 'an updated action text'
    cy.window().then(function (win) {
      cy.stub(win, 'prompt').returns(newWhat)
    })

    // Prompt response stubbed above...
    const action = activeActions.getDataTest('active_action__what').first()
    action.rightclick()

    action.should('not.contain.text', what)
    action.should('contain.text', newWhat)
  })

  it('lets you edit the link of an active action', () => {
    const linkVal = 'http://google.com'
    addActionToIncident({link: linkVal})
    const activeActions = getDataTest('actions__active')

    // This is how you type into prompts with Cypress =-\
    const newLinkVal = 'http://example.com'
    cy.window().then(function (win) {
      cy.stub(win, 'prompt').returns(newLinkVal)
    })

    // Prompt response stubbed above...
    const link = activeActions.getDataTest('active_action__link').first()
    link.rightclick()

    const anchor = link.get('a').first()
    anchor.invoke('attr', 'href').should('equal', newLinkVal)
  })

  it('lets you reset or edit the timer of an active action', () => {
    const minutes = 10
    addActionToIncident({minutes})
    const activeActions = getDataTest('actions__active')

    const getCountdownDisplay = () => {
      return activeActions.getDataTest('active_action__timer').get('countdown-display').first()
    }

    cy.wait(1 * 1000)

    // capture value, wait a teensy bit to see the value change
    getCountdownDisplay().invoke('attr', 'seconds').then(parseInt).as('initialMins')
    getCountdownDisplay().invoke('attr', 'seconds').then(parseInt).as('initialSecs')
    cy.wait(3 * 1000)

    // look at value after waiting
    activeActions.getDataTest('active_action__timer').get('countdown-display').first()
    getCountdownDisplay().invoke('attr', 'minutes').then(parseInt).as('waitedMins')
    getCountdownDisplay().invoke('attr', 'seconds').then(parseInt).as('waitedSecs')

    // expect to be lower
    cy.then(function() {
      expect(this.waitedMins * 60 + this.waitedSecs).to.be.below(this.initialMins * 60 + this.initialSecs)
    })

    // now left-click to reset timer
    getCountdownDisplay().click()

    // get the reset timer vals
    getCountdownDisplay().invoke('attr', 'minutes').then(parseInt).as('resetMins')
    getCountdownDisplay().invoke('attr', 'seconds').then(parseInt).as('resetSecs')

    // expect them to be higher
    cy.then(function() {
      expect(this.resetMins  * 60 + this.resetSecs).to.be.above(this.waitedMins * 60 + this.waitedSecs)
    })


    // now right-click to set new value to timer
    // This is how you type into prompts with Cypress =-\
    const newMinutes = 20
    cy.window().then(function (win) {
      cy.stub(win, 'prompt').returns(newMinutes)
    })
    getCountdownDisplay().rightclick()

    // get the new values
    getCountdownDisplay().invoke('attr', 'minutes').then(parseInt).as('newMins')
    getCountdownDisplay().invoke('attr', 'seconds').then(parseInt).as('newSecs')

    // expect them to be what we just set
    cy.then(function() {
      expect(this.newMins  * 60 + this.newSecs).to.equal(newMinutes * 60)
    })
  })

  it('lets you toggle an active action as mitigating or not', () => {
    addActionToIncident({isMitigating: false})
    const activeAction = getDataTest('actions__active').first()
    const mitigatingInput = activeAction.getDataTest('action__is-mitigating')
    mitigatingInput.should('not.be.checked')

    mitigatingInput.check()
    mitigatingInput.should('be.checked')
  })
})

describe('Ongoing Incident: Status Updates', () => {
  const what = 'This is the what'
  const when = 'This is the when'
  const where = 'This is the where'
  const impact = 'This is the impact'

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5432/?disableMultiplayer=true') // TODO: dont use hardcoded port
    submitIncident(what, when, where, impact, false)
  })

  describe('Business Update', () => {
    it('provides the current status of the incident, the summary, and the currently affected components', () => {
      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => { clipboardText = text })
      })

      getDataTest('business-update')
        .click()
        .then(() => expect(clipboardText).to.eq(
          `*Investigating* Since ${when} we are seeing ${what} in ${where} impacting ${impact}.\n\n*Current status:*\n- 🔴 ${what}`
        ))
    })
  })

  describe('Tech Update', () => {
    it('provides the status, summary, affected components, current actions', () => {
      addActionToIncident({what: 'The Action', who: 'The Who', link: 'http://example.com/', minutes:10, isMitigating: true})
      addActionToIncident({what: 'A failed action', who: 'The Whom', link: 'http://example.com/', minutes:10, isMitigating: true})
      cy.window().then((win) => cy.stub(win, 'prompt').returns('Was not destined to be.'))
      cy.get('active-action[what="A failed action"] [data-test="active_action__failed"]').click()

      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => { clipboardText = text })
      })

      getDataTest('tech-update')
        .click()
        .then(() => expect(clipboardText).to.eq(
          `*Investigating* Since ${when} we are seeing ${what} in ${where} impacting ${impact}.` +
          `\n\n*Current status:*\n- 🔴 ${what}` +
          '\n\n*Actions:*\n- The Action (The Who) [More info](http://example.com/)' +
          '\n\n*Past actions:*\n- ❌ A failed action (The Whom) [More info](http://example.com/)\n    - Was not destined to be.'
        ))
    })
  })
})
