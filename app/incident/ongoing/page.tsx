'use client'

import Image from 'next/image'
import OngoingIncident from "@/app/components/ongoing-incident/ongoing-incident";
import { useEffect, useState } from 'react';

export default function Incident() {
  const [incidentId, setIncidentId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room !== null) {
      setIncidentId(room)
    }
  }, [])
  return (
    <OngoingIncident incidentId={incidentId} />
  )
}
