import Image from 'next/image'
import Link from 'next/link';
import screenshot from '@/public/IncidentCommander_Screenshot.png'


export default function Home() {
  return (
      <>
        <h1>Welcome!</h1>

        <p className="mt-2">
          This <strong>Incident Commander tool</strong> helps you keep track of everything that&apos;s going on when you&apos;re managing an incident including:
        </p>

        <ul className="list-disc list-inside mt-1">
          <li>Keeping track of all the current issues affecting your systems</li>
          <li>Managing a list of actions per issue</li>
          <li>Keeping track of a timeline of notes for each action</li>
          <li>Tracking who is working on what action(s)</li>
          <li>Reminding you when to ask for updates from people</li>
          <li>Making it easy to copy business & tech summaries to your clipboard so you can keep others updated</li>
          <li>Providing a shared notes area for free-form (also multiplayer-compatible) organization and collaboration</li>
        </ul>

        <h1 className="mt-4">Getting Started</h1>
        <p className="mt-2">
          To use the tool, <strong>click <Link href="/incident/ongoing">Manage Incident</Link></strong> and fill out the form to start tracking your first issue.
        </p>
        <p className="mt-2">
          Then, <strong>share your incident URL with anyone for realtime &quot;multi-player&quot; editing</strong> of the incident.
        </p>

        <h1 className="mt-4">We&apos;re on GitHub</h1>
        <p className="mt-2">
          You can <a href="https://github.com/gaqzi/incident-commander">find the code on GitHub</a>.
        </p>
        <p className="mt-2">
          Bug reports and feature requests are most welcome!
          Please <a href="https://github.com/gaqzi/incident-commander/issues">give us feedback via GitHub issues.</a></p>

        <h1 className="mt-4">What does it look like and how does it work?</h1>

        <h3 className="mt-2">Here&apos;s a short demo video. (Note: the video is a little out of date due to new features and further UI polish)</h3>
        <iframe className="border-0" width="560" height="315" src="https://www.youtube.com/embed/1F2GK-zinls?si=v5sz4lFqz6izkeIS" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>

        <h3 className="mt-2">And here&apos;s a sample screenshot:</h3>
        <p className="mt-2">
          <Image priority alt="screenshot" src={screenshot} className="border-t-4 border-l-4 border-r-8 border-b-8 border-black" />
        </p>
      </>
  )
}
