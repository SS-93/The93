flowchart TD
    Start[Start] --> Auth[User Authentication]
    Auth --> RoleSelect{Select Role}
    RoleSelect -->|Buyer| BuyerFlow[Buyer Flow]
    RoleSelect -->|Artist or Host| HostArtistFlow[Host Artist Flow]
    RoleSelect -->|Brand| BrandFlow[Brand Flow]
    RoleSelect -->|Admin| AdminFlow[Admin Flow]

    BuyerFlow --> Browse[Browse Events Subscriptions Tips]
    Browse --> ActionChoice{Choose Action}
    ActionChoice -->|Ticket| Purchase[Create Purchase]
    ActionChoice -->|Subscription| Purchase
    ActionChoice -->|Tip| Purchase

    Purchase --> StripeOn[Stripe Connect Payment]
    StripeOn --> Webhook[Stripe Webhook Handling]
    Webhook --> Ledger[Create Ledger Entries]
    Ledger --> Split[Apply Split Rules]
    Split --> Transfer[Execute Transfers Holds]
    Transfer --> Payout[Schedule Payouts]
    Payout --> BuyerConfirm[Confirmation Receipt]
    BuyerConfirm --> End[End]

    HostArtistFlow --> Onboard[Stripe Onboarding]
    Onboard --> Dashboard[Host Artist Dashboard]
    Dashboard --> ManageEvents[Manage Events Splits]
    ManageEvents --> HostReceive[Receive Payments]
    HostReceive --> Ledger
    HostReceive --> End

    BrandFlow --> BrandDashboard[Brand Dashboard]
    BrandDashboard --> EventInvites[Manage Event Invites Deals]
    EventInvites --> BrandEnd[End]

    AdminFlow --> AdminDashboard[Admin Dashboard]
    AdminDashboard --> Monitor[Monitor Transactions Health]
    Monitor --> Alerts[Alerts Notifications]
    Alerts --> AdminActions{Action Required}
    AdminActions -->|Dispute Refund| Refund[Process Refund]
    AdminActions -->|Override| Override[Apply Override]
    AdminActions -->|Export| Export[Generate Reports]
    Refund --> End
    Override --> End
    Export --> End

    style Start fill lightblue
    style End fill lightgreen