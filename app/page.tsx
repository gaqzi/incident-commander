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
          <li>Tracking who is working on what action(s)</li>
          <li>Reminding you when to ask for updates from people</li>
          <li>Making it easy to copy business & tech summaries to your clipboard so you can keep others updated</li>
        </ul>

        <h1 className="mt-4">Getting Started</h1>
        <p className="mt-2">
          To use the tool, <strong>click <Link href="/incident/ongoing">Manage Incident</Link></strong> and fill out the form to start tracking your first issue.
        </p>
        <p className="mt-2">
          Then, <strong>share your incident URL with anyone for realtime &quot;multi-player&quot; editing</strong> of the incident.
        </p>

        <h1 className="mt-4">What does it look like?</h1>
        <p className="mt-2">Here&apos;s a sample screenshot:</p>
        <p className="mt-2">
          <Image priority alt="screenshot" src={screenshot} className="border-t-4 border-l-4 border-r-8 border-b-8 border-black" />
        </p>
      </>
  )
}
