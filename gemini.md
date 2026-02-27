# Gemini Onboarding Summary

This document provides a high-level overview of the "Bucket & MediaID" project, based on a review of the existing documentation and codebase.

## Project Overview

**Bucket & MediaID** is a React-based audio content platform built with TypeScript and backed by Supabase. It features advanced audio processing and a multi-faceted user role system, including fans, artists, brands, and developers. The platform is designed around a privacy-first "MediaID" system and incorporates sophisticated audio intelligence capabilities.

## Key Architectural Components

*   **Frontend:**
    *   **Framework:** React with TypeScript
    *   **Routing:** React Router, with role-based access control
    *   **Styling:** Tailwind CSS

*   **Backend (Supabase):**
    *   **Authentication:** Manages user sign-up, login, and roles.
    *   **Database (PostgreSQL):** Stores all application data, including user profiles, content metadata, and audio analysis results.
    *   **Storage:** Manages user-uploaded content, such as audio files.
    *   **Edge Functions:** Enables server-side logic, including audio processing.

*   **Core Technologies:**
    *   **Stripe:** Integrated for payment processing.
    *   **FFmpeg (WASM & Server-Side):** Powers the hybrid audio processing system, enabling both client-side and server-side analysis.

## Core Features

*   **Hybrid Audio Processing:** A flexible system that can process audio in the browser for speed or on the server for more intensive tasks. It intelligently chooses the best environment for the job.

*   **Audio Intelligence:** The platform can analyze audio files to extract a rich set of metadata, including:
    *   **Technical Data:** BPM, key, energy, danceability.
    *   **Descriptive Tags:** Moods and genres (e.g., "energetic," "acoustic").

*   **MediaID System:** A privacy-centric approach to user profiles, allowing users to control how their data is used and shared.

*   **Role-Based Dashboards:** The user interface is tailored to different user roles, providing each with a unique set of tools and views.

## Backend Location

The project documentation mentions that the backend code is located in a directory named "EPK" on the desktop. Access to this directory is required for a complete understanding of the backend implementation.

## Next Steps

1.  **Provide Access to "EPK":** To get a full picture of the backend, please provide the contents of the "EPK" directory.
2.  **Backend Review:** Once the backend code is available, I will conduct a thorough review of the server-side logic, including the Supabase Edge Functions and database schema.
3.  **Full-Stack Analysis:** With both frontend and backend context, I can provide a complete analysis of the application and assist with any development tasks.
