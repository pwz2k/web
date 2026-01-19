# Project Folder Structure

This document provides an overview of our social media platform's folder structure and explains the purpose of each directory and key files.

## Root Directory

- **components.json**: Shadcn UI components configuration
- **next-auth.d.ts**: Type definitions for NextAuth
- **next.config.mjs**: Next.js configuration file
- **package.json**: Project dependencies and scripts
- **pnpm-lock.yaml**: PNPM package lock file
- **postcss.config.mjs**: PostCSS configuration for styling
- **tailwind.config.ts**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript configuration
- **vercel.json**: Vercel deployment configuration
- **vote-algorithm.txt**: Documentation for the voting algorithm

## Directories

### `/certificates`
Contains SSL certificates for local HTTPS development:
- **localhost-key.pem**: Local SSL private key
- **localhost.pem**: Local SSL certificate

### `/docs`
Project documentation:
- **folder-structure.md**: This document
- **post-recommendation-algorithm.md**: Details about post recommendation logic
- **top-creators-algorithm.md**: Algorithm for determining top content creators
- **voting-algorithm.md**: Comprehensive documentation of the voting system

### `/prisma`
Database ORM configuration:
- **schema.prisma**: Database schema definition with models for users, posts, comments, votes, etc.

### `/public`
Static assets:
- **/company_logos**: Payment provider logos (PayPal, Stripe, etc.)
- **/images**: Generic images used throughout the application
- **/payment_qr**: QR codes for different payment methods

### `/scripts`
Utility scripts:
- **generate-prisma-types.js**: Script to generate TypeScript types from Prisma schema

### `/src`
Main source code directory:

#### `/src/actions`
Server actions for Next.js:
- **admin.ts**: Admin-specific server actions
- **login.ts**: Authentication login logic
- **logout.ts**: Authentication logout logic
- **register.ts**: User registration logic
- **update-share-count.ts**: Logic for updating post share counts

#### `/src/app`
Next.js App Router structure:
- **layout.tsx**: Root layout for the application
- **globals.css**: Global CSS styles

Route groups (in parentheses):
- **/(admin)**: Admin panel routes and components
- **/(forms)**: Authentication and application forms
- **/(main)**: Main application routes (profile, billing, etc.)
- **/(moderator)**: Moderator panel
- **/(protected)**: Routes requiring authentication
- **/(public)**: Publicly accessible routes
- **/(restricted)**: Routes with specific access restrictions

Additional routes:
- **/api**: API routes using Next.js API Routes
- **/auth**: Authentication related routes

#### `/src/components`
Reusable UI components:
- **ui/**: Shadcn UI components
- **header.tsx**: Site header component
- **form-error.tsx, form-success.tsx**: Form feedback components
- **user-avatar.tsx**: User avatar component
- **tag-input.tsx**: Component for tag input
- **password-input.tsx**: Secure password input component
- **date-picker.tsx**: Date selection component

#### `/src/constants`
Application constants:
- **payment-qrs.ts**: Payment QR code references
- **payout-methods-logos-src.ts**: Sources for payout method logos
- **query-keys.ts**: React Query cache keys
- **report-reasons.ts**: Predefined reasons for content reporting
- **shared-enums.ts**: Shared enumeration types
- **vote-buttons.ts**: Configuration for voting buttons

#### `/src/data`
Data access layer:
- **account.ts**: Account data handling
- **user.ts**: User data handling

#### `/src/hooks`
Custom React hooks:
- **use-confirm.tsx**: Confirmation dialog hook
- **use-create-query-string.ts**: URL query string creation
- **use-current-role.ts**: Current user role hook
- **use-current-user.ts**: Current user data hook
- **use-mobile.tsx**: Mobile device detection hook

#### `/src/icons`
Custom icon components:
- **index.tsx**: Icon exports

#### `/src/lib`
Utility libraries:
- **auth.ts**: Authentication utilities
- **bitpay.ts**: BitPay integration
- **db.ts**: Database client setup
- **hono.ts**: Hono API framework setup
- **stripe.ts**: Stripe payment integration
- **uploadthing.ts**: File upload integration
- **utils.ts**: General utility functions
- **/notifications**: Notification system implementations
- **/utils**: Additional utility functions

#### `/src/providers`
React context providers:
- **provider.tsx**: Main application providers wrapper
- **query-provider.tsx**: React Query provider
- **react-day-picker-providers.tsx**: Date picker providers

#### `/src/schemas`
Validation schemas:
- **admin.ts**: Admin form validations
- **index.ts**: Schema exports
- **moderator.ts**: Moderator form validations

#### `/src/types`
TypeScript type definitions:
- **helper.ts**: Helper types
- **index.ts**: Main type exports

## Key Features

This social media platform appears to include:

1. **Authentication System**: Complete with email verification and multiple sign-in methods
2. **Content Creation & Sharing**: Posts, comments, and voting system
3. **Monetization**: Creator commissions, tips, and payment processing
4. **Moderation**: Admin and moderator panels for content moderation
5. **Analytics**: User activity tracking and engagement metrics
6. **Notifications**: Email and in-app notification system

The application is built with modern technologies:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with PostgreSQL
- React Query for data fetching
- Shadcn UI components
- Authentication via NextAuth
- Multiple payment integrations (Stripe, PayPal, BitPay)