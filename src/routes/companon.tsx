/**
 * Compañon Route
 * 
 * Main route file for Compañon Brand Activation Dashboard.
 * Handles all /companon/* routes.
 * 
 * Route Structure:
 * /companon                   → Landing page (public)
 * /companon/dashboard         → Dashboard home (authenticated)
 * /companon/dna-builder       → DNA Query Builder
 * /companon/campaigns/*       → Campaign management
 * /companon/analytics         → Analytics dashboard
 * /companon/crm               → CRM & contacts
 * /companon/qr                → QR campaigns
 * /companon/settings          → Settings & billing
 */

import React from 'react';
import CompanonRoutes from '../components/companon/CompanonRoutes';

export default function CompanonRoute() {
  return <CompanonRoutes />;
}

