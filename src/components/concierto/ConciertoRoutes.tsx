import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ConciertoLanding from './ConciertoLanding'
import EventCreator from './EventCreator'
import EventDashboard from './EventDashboard'
import ArtistRegistration from './ArtistRegistration'
import AudienceRegistration from './AudienceRegistration'
import PublicEventView from './PublicEventView'
import VotingInterface from './VotingInterface'
import EventResults from './EventResults'
import GlobalEventsListing from './GlobalEventsListing'

const ConciertoRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main Concierto landing - buckets.media/events/ */}
      <Route path="/" element={<ConciertoLanding />} />

      {/* Global events listing - buckets.media/events/global */}
      <Route path="/global" element={<GlobalEventsListing />} />

      {/* Event management routes */}
      <Route path="/create" element={<EventCreator />} />
      <Route path="/manage/:eventId" element={<EventDashboard />} />

      {/* Artist registration - buckets.media/events/artist/:token */}
      <Route path="/artist/:registrationToken" element={<ArtistRegistration />} />

      {/* Audience registration - buckets.media/events/register/:eventCode */}
      <Route path="/register/:eventCode" element={<AudienceRegistration />} />

      {/* Public event view (The Christening) - buckets.media/events/view/:eventCode */}
      <Route path="/view/:eventCode" element={<PublicEventView />} />

      {/* Voting interface - buckets.media/events/vote/:shareableCode */}
      <Route path="/vote/:shareableCode" element={<VotingInterface />} />

      {/* Event results - buckets.media/events/results/:shareableCode */}
      <Route path="/results/:shareableCode" element={<EventResults />} />
    </Routes>
  )
}

export default ConciertoRoutes