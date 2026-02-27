import React, { useState } from 'react';
import DashboardGate from '../components/dnvrspotlight/DashboardGate';
import OrganizerDashboard from '../components/dnvrspotlight/OrganizerDashboard';
import { isDashboardUnlocked } from '../components/dnvrspotlight/mockData';

const DNVRSpotlightDashboard: React.FC = () => {
  const [unlocked, setUnlocked] = useState(isDashboardUnlocked);

  if (!unlocked) {
    return <DashboardGate onUnlock={() => setUnlocked(true)} />;
  }

  return <OrganizerDashboard />;
};

export default DNVRSpotlightDashboard;
