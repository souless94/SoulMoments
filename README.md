# SoulMoments 🌟

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=souless94_SoulMoments&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=souless94_SoulMoments)
[![Snyk Badge](https://snyk.io/test/github/souless94/SoulMoments/badge.svg)](https://snyk.io/test/github/souless94/SoulMoments)

A beautiful, offline-first life moments tracker that helps you capture and reflect on important events in your life. Track birthdays, anniversaries, milestones, and any meaningful moments with elegant time visualization.

## 🌐 Live Demo

**[Try SoulMoments →](https://soul-moments.vercel.app/)**

## ⚠️ Project Status & Disclaimer

**This is a side project with limited maintenance.**

- **No Long-term Support**: This project may not receive regular updates or maintenance
- **Use at Your Own Risk**: While functional, this is primarily a demonstration/learning project
- **Security**: Basic security measures are implemented, but this is not enterprise-grade software
- **Data**: All data is stored locally in your browser - no server-side storage or backups
- **Contributions Welcome**: Community contributions are appreciated but not guaranteed to be reviewed promptly

## Table of Contents
================

- [📊 Metrics](#-metrics)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Tech Stack](#-tech-stack)
- [📱 Usage](#-usage)
  - [Adding Moments](#adding-moments)
  - [Managing Moments](#managing-moments)
  - [Repeat Events](#repeat-events)`

## 📊 Metrics

- **SonarCloud**: Code quality and security analysis
- **Snyk**: Vulnerability scanning
- **SonarCloud**: Code quality and security analysis
- **Snyk**: Vulnerability scanning

## ✨ Features

- **Offline-First**: Works completely offline with local IndexedDB storage
- **Real-time Updates**: Reactive UI that updates automatically
- **Recurring Events**: Support for daily, weekly, monthly, and yearly recurring moments
- **Time Visualization**: See how many days until or since your important moments- 
- **Moment Management**: Add, edit, and delete moments with ease
- **Responsive Design**: Beautiful UI that works on all devices
- **Type-Safe**: Built with TypeScript for reliability
- **Fast Performance**: Optimized with Next.js 15 and Turbopack

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/souless94/SoulMoments.git
cd SoulMoments

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI components
- **Database**: RxDB with IndexedDB (Dexie storage)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest (unit), Playwright (E2E)
- **UI Components**: Custom components with Radix UI primitives

## 📱 Usage

### Adding Moments

1. Click the floating "+" button
2. Enter a title and optional description
3. Select the date
4. Choose repeat frequency (none, daily, weekly, monthly, yearly)
5. Save your moment

### Managing Moments

- **View**: Click on any moment tile to focus on it
- **Edit**: Use the edit button on moment tiles
- **Delete**: Use the delete button (with confirmation)
- **Filter**: Moments are automatically sorted by creation date

### Repeat Events

Set recurring moments for:
- **Daily**: Daily habits or routines
- **Weekly**: Weekly events or meetings
- **Monthly**: Monthly milestones
- **Yearly**: Birthdays, anniversaries, holidays

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests
npm run test:e2e:ui  # Run E2E tests with UI

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

```
├── app/                 # Next.js App Router
│   ├── components/      # Page-specific components
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # Reusable UI components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and database
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
└── e2e/                # End-to-end tests
```

### Database Schema

Moments are stored locally using RxDB with this structure:

```typescript
interface MomentDocument {
  id: string;                    // UUID
  title: string;                 // Max 100 characters
  description?: string;          // Optional, max 200 characters
  date: string;                  // ISO date (YYYY-MM-DD)
  repeatFrequency: RepeatFrequency; // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Tests cover:
- Database operations
- Date calculations
- Component rendering
- Form validation

### E2E Tests

```bash
npm run test:e2e
```

E2E tests include:
- Basic functionality
- Moment lifecycle (CRUD operations)
- Mobile UX
- Security headers
- Smoke tests

## 🔒 Security

- **CSP Headers**: Content Security Policy implemented
- **Input Validation**: All inputs validated with Zod schemas
- **XSS Protection**: React's built-in XSS protection
- **Local Storage**: All data stored locally, no external APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database powered by [RxDB](https://rxdb.info/)
- Icons from [Lucide React](https://lucide.dev/)

---

Made with ❤️ for capturing life's precious moments