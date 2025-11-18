flowchart TD
  A[Passport Events] --> B[Ingestion Service]
  C[External Sources] --> B
  B --> D[Event Aggregator]
  D --> E[TimescaleDB]
  D --> F[Redis Cache]
  E --> G[Metrics Store]
  F --> G
  G --> H[Leaderboard Service]
  H --> I[Leaderboards]
  G --> J[Report Generator]
  J --> K[PDF Storage]
  J --> L[JSON Storage]
  I --> M[User Frontend]
  K --> M
  L --> M
  M --> N[Stripe Entitlements]
  D --> O[Monitoring Service]
  O --> P[Admin Dashboard]