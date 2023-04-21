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

describe('Creating a New Incident', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5432/?room=test&password=testing') // TODO: dont use hardcoded port
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
        getDataTest('active-actions active-action').should('have.length.of', 0)
        getDataTest('past-actions li').should('have.length.of', 0)
    })

    it('creates a new incident - with default actions', () => {
        const what = 'This is the what'
        const when = 'This is the when'
        const where = 'This is the where'
        const impact = 'This is the impact'

        submitIncident(what, when, where, impact, true)

        const activeActions = getDataTest('active-actions')
        activeActions.get('active-action').should('have.length.of', 3)
        activeActions.should('contain.text', 'Was there a recent deploy?')
        activeActions.should('contain.text', 'Was a feature flag toggled recently?')
        activeActions.should('contain.text', 'Has there been an infrastructure changed recently?')
    })
})
