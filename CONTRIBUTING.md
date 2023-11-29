# Contributing

## How to run a local dev instance of the tool

The app consists of two parts: a Node.js socket relay server powering the 'multiplayer' part and a Next.js static website powering the web UI part.

To start a copy of the relay server (defaults to port 1234), a local Next.js dev server with hot reloading, and the Cypress end-to-end testing launcher, run ```npm run dev:all```. 

Press `Ctrl-c` to kill it all when you're done.

## Testing
We use Cypress for browser testing. See [`./cypress/e2e/everything.cy.js`](./cypress/e2e/everything.cy.js) for all of the tests. Yes, we could/should make this nicer in the fullness of time. =-)

See [how to run a local dev instance](#how-to-run-a-local-dev-instance-of-the-tool) above to get tests and a dev server to run locally.

-------

# Ubiquitous Language

## Why the tool exists

To lower the cognitive burden of an incident commander by helping them 
manage pertinent information when coordinating an incident repsponse. This includes
a list of the current/past issues (what is broken) and actions (the TODO list) for each issue. 

The tool also aims to make it easier to create and share updates (for business and tech stakeholders) based on the information tracked in the tool.

The tool is designed to fail gracefully. This means it should be designed to work when other things are failing. As an example, if you're using the multi-player feature of the tool and you or the relay server experiences a network issue, the single-page static app nature of the web UI allows the tool to remain useful to you as the Incident Commander even if others can't update your 'single pane of glass' at that moment.

### Roles

- **Incident commander:** The person coordinating the efforts and possibly
  making decisions on what to try when
- **Incident responder:** A person that is helping to resolve the incident
  by finding the root cause, implementing a mitigation, or providing
  information
- **Stakeholder:** A catch-all term for people who care about the
  resolution of the incident but are not participating in the resolution.
    - Note: some stakeholders might also end up being responders as we learn
      more and need to find more people

## Updates

1. **Business:** No fluff, what is the impact, where is it happening, and since
   when. The current status of what we're doing but not super detailed. Non-techie.
2. **Tech:** Starts with Business update and then adds on more details about the
   current and past actions.
3. **Timeline:** (FUTURE PLANS) A complete report with any changes laid out
   chronologically. Can be the basis of an incident report.

## Issue and Actions

An incident tracked by the tool is comprised of one or more Issues. Each issue can have Actions to track what needs to be done to try to mitigate the issue.

0. **Incident:** The overarching problem requiring immediate mitigation. It can be comprised of one or more Issues.

1. **Issue:** A description about an atomic problem contributing to an incident. For example, in an e-commerce store, you would have an Incident if your checkout flow is degraded during a flash sale. This incident might have more than one Issue contributing to it, such as a web server with an overloaded CPU and a database server refusing to accept new connections.

2. **Action:** Something that needs to be done in response to an Issue. 

    - This can be things that can directly mitigate an issue (reboot the server) or indirectly mitigate an issue (page the person so we can ask them to reboot the server). 
    - Actions are either _Active_ or _Completed_.
    - Actions become _Completed_ when you mark them as either _This Helped_ (e.g. roll back the deployed code), _This didn't help_ (e.g. reboot the server -- you tried it but the problem persists), or _Was Chore_ (e.g. page Jane). 
    - When an Action is marked as _This didn't help_, the tool asks "Why?". This is to help keep track of the reasons for why something we thought would help didn't actually help. So if anyone new comes to review the context of the incident, they understand more about what was tried and worked/didn't work already.
    - Actions also have a list of zero or more Timeline Entries.

3. **Timeline Entry:** A timestamped note belonging to an Action. Some actions are more complex than others and it can be useful to keep track of updates for specific actions. 
    - For example, when restoring a database from a backup, you might want to keep track of the percentage completion over time (to be able to share an updated ETA with stakeholders). 
    - So if you had a "Restore db backup" action, you might have a few Timeline Entries in it with updates like:
        - Starting restore
        - 20% complete, ETA 10 more minutes
        - 80% percent complete, ETA 2 more minutes

# Project Organization

TODO. 

For the intrepid, see [app/components](./app/components/) for a bunch of React components and [reducer.tsx](./app/components/ongoing-incident/reducer.tsx) for how we translate atomic actions from Y.js into updates to the incident.
