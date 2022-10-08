Incident Commander
==================
_Helps you manage your incident by showing what's going on and helping you
summarize for updates_

[Demo](https://gaqzi.github.io/incident-commander/)

# Goals

When I end up being an [incident commander] I need to:

1. Keep stakeholders updated (business impact etc.)
2. Keep everyone that is debugging up-to-date
3. Keep track of all the various streams of research and when I last got an
   update

This is done by:

- Updating our internal status page with business updates
- Updating the channel with current status
    - Our current actions
        - Escalating to vendor
        - Researching if a system change occurred in subsystem X
    - Results of previous explorations
        - Explored a change in X but after reverting [link to thread] it did
          nothing

Today I do this by a combination of text editor (what's going on), Slack
reminders, and being meticulous about my process. I wonder if doing a small
UI with clear operations and template outputs I could:

- Get a timeline
- Generate an accurate status update (business + tech) where I don't miss data
- Provide consistency across commanders
- Simplify onboarding of new commanders

[incident commander]: https://www.atlassian.com/incident-management/incident-response/incident-commander

## MVP

![Mockup](docs/images/incident-commander-mockup.light.excalidraw.png#gh-light-mode-only)
![Mockup](docs/images/incident-commander-mockup.dark.excalidraw.png#gh-dark-mode-only)

1. [ ] Specify what the incident is about
    - [X] Since 00:00 UTC we are seeing [problem] in [impacted area] with [impact]
    - [ ] Update the state (Investigating / Identified / Monitoring / Resolved)
2. [ ] Add actions that we are taking
    - [X] Specify who is taking an action and how long between updates
    - [ ] Allow actions to have a link to something
3. [ ] Keep a list of current active
    - [x] Finish action and don't provide in summary (escalation successful,
      for example doesn't need to be mentioned, it will lead to a new action)
    - [ ] Issue a reminder when checkin time has come to give an update
      - [X] Visually show a countdown
      - [ ] Local notification? Some sound? More of something?
4. [ ] Keep a list of past actions
    - [x] Shown and what resolution they had. Will be part of the big tech
      update but at the bottom of it.
    - [ ] Distinguish between actions and tasks
5. [ ] Buttons to export (goes into the clipboard)
    - [ ] Business update: Doesn't have any formatting
    - [ ] Business + Text Update: Uses Slack formatting

Post MVP:

- Escalation policy and impact calculation: Specify how to escalate and
  when depending on the impact. Ideally with a list of people to add into
  OpsGenie.

# Feature descriptions

Trying to explain the _underlying idea_ of the functionality of this tool.
To explain where the authors are coming from and what they're aiming to
solve, with the aim to provide context to explain what we want and what we
don't want.

And to make it simpler _to change_ since the reason behind
something is available, so if a different way is proposed, and it fulfils
the original purpose, then why not?

## Fundamentals

To shorten the incident resolution by simplifying the juggling of tasks for
the incident commander and by providing all required information in a
consistent format for the incident responders.

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

## Reports / Updates

1. **Business:** No fluff, what is the impact, where is it happening, since
   when, and what the impact is. The current status of what we're doing but
   not super detailed. Non-techie.
2. **Tech:** Starts with business and then adds on more details about the
   current actions and any previous non-task actions that didn't pan out
   (with why they didn't)
3. **Timeline:** A complete report with any changes laid out
   chronologically. Can be the basis of an incident report.

## Actions

In the system we distinguish between types of action, but for brevity in
the UI they will in aggregate be referred to as actions for the most part.

1. **Task:** Any action that isn't aimed at directly resolving the
   incident, for example: escalate to someone or get a piece of
   information (how do we measure impact?)
    - Are not needed for the tech updates but are needed for the timeline to
      show what we've done and how long it took. For example, an escalation
      to a critical team that took longer than the SLA requires needs to
      be seen and discussed but not during the incident.
2. **Action:** This could be what we need to know the problem or to
   implement a mitigation. Actively working towards the resolution of the
   incident.

When an action completes it is either a _success_ or _failure_. A
successful action can optionally add information to it. A failed task requires
an explanation for why it failed with an optional link to somewhere with more
details.

For example, a successful task for which metric to use to measure could
include a link to where the to find it. And a failed actions needs to include
an explanation of why so if we need to later re-examine what we've tried we can
do so.
