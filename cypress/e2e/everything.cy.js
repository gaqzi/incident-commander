/// <reference types="cypress" />

function getDataTest(target) {
    return cy.get(`[data-test="${target}"]`)
}

function submitIncident(what, when, where, impact, shouldUseDefaultActions) {
    getDataTest('new-incident__what').type(what)
    getDataTest('new-incident__when').type(when)
    getDataTest('new-incident__where').type(where)
    getDataTest('new-incident__impact').type(impact)
    if (shouldUseDefaultActions) {
        getDataTest('new-incident__add-default-actions').check()
    }
    else {
        getDataTest('new-incident__add-default-actions').uncheck()
    }
    getDataTest('new-incident__submit').click()
}

function addActionToIncident(what, who, link, minutes, isMitigating) {
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

        const actionWhat = 'a new action'
        const actionWho = 'john doe'
        const actionLink = 'http://example.com'
        const actionMinutes = 10
        addActionToIncident(actionWho, actionWhat, actionLink, actionMinutes, false)

        getDataTest('actions__active').get('li').should('have.length.of', 1)
        const action = getDataTest('actions__active').within( el => el.get('li')).first()
        action.should('contain.text', actionWhat)
        action.should('contain.text', actionWho)
        action.within(el => el.get(`a[href="${actionLink}"]`)).should('be.visible')
        action.within(el => el.get(`input[data-test="action__is-mitigating"`)).should('not.be.checked')
    })

    it('lets you edit the text of an add affected component', () => {
        const actionWhat = 'a new action'
        const actionWho = 'john doe'
        const actionLink = 'http://example.com'
        const actionMinutes = 10
        addActionToIncident(actionWho, actionWhat, actionLink, actionMinutes, false)
        const activeActions = getDataTest('actions__active')

        // This is how you type into prompts with Cypress =-\
        const newWhat = 'an updated action text'
        cy.window().then(function(win) {
            cy.stub(win, 'prompt').returns(newWhat)
        })

        // Prompt response stubbed above...
        const action = activeActions.getDataTest('active_action__what').first()
        action.rightclick()

        action.should('not.contain.text', actionWhat)
        action.should('contain.text', newWhat)
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

describe('Ongoing Incident: status updates', () => {
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
        cy.stub(win.navigator.clipboard, 'writeText', (text) => {clipboardText = text})
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
      addActionToIncident('The Action', 'The Who', 'http://example.com/', 10, true)
      addActionToIncident('A failed action', 'The Whom', 'http://example.com/', 10, true)
      cy.window().then((win) => cy.stub(win, 'prompt').returns('Was not destined to be.'))
      cy.get('active-action[what="A failed action"] [data-test="active_action__failed"]').click()

      let clipboardText = ''
      cy.window().then(function (win) {
        cy.stub(win.navigator.clipboard, 'writeText', (text) => {clipboardText = text})
      })

      getDataTest('tech-update')
        .click()
        .then(() => expect(clipboardText).to.eq(
          `*Investigating* Since ${when} we are seeing ${what} in ${where} impacting ${impact}.` +
          `\n\n*Current status:*\n- 🔴 ${what}` +
          `\n\n*Actions:*\n- The Action (The Who) [More info](http://example.com/)` +
          `\n\n*Past actions:*\n- ❌ A failed action (The Whom) [More info](http://example.com/)\n    - Was not destined to be.`
        ))
    })
  })
})
