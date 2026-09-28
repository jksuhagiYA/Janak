# Janak Accounts

A mobile app for tracking business income, expenses and profit. Built with
[Expo](https://expo.dev) (React Native) for Android and iOS.

## Features

- **Dashboard**: net balance, this month's income, expense and profit/loss, balance per account (Cash, Bank, UPI, Card), and recent transactions.
- **Add/edit transactions**: income or expense, amount, category, payment method, date and an optional note.
- **Transactions**: browse by month, filter by income or expense, search by category or note, with monthly totals.
- **Reports**: monthly profit and margin, a 6-month income vs expense chart, and category breakdowns.
- **Settings**: business name, currency (₹ uses Indian digit grouping, e.g. ₹1,23,456), CSV export via the share sheet, and delete all data.
- Light and dark mode.

Data is stored **on the device only** (AsyncStorage). Use *Settings → Export as CSV* to back it up.

## Run it

```bash
npm install
npm start          # then scan the QR code with the Expo Go app on your phone
npm run android    # or open in an Android emulator
npm run web        # or try it in a browser
```

## Develop

```bash
npm run typecheck  # TypeScript
npm test           # unit tests for the money and report calculations
```

Project layout:

```
src/app/               screens (Expo Router: each file is a route)
  (tabs)/              Dashboard, Transactions, Reports, Settings tabs
  transaction.tsx      add/edit form (opens as a modal)
src/components/ui.tsx  shared UI pieces
src/lib/finance.ts     data model and calculations (no React; unit-tested)
src/lib/store.tsx      app state and on-device storage
src/lib/theme.ts       light/dark colours
```

Amounts are stored as whole paise/cents (integers) so totals never pick up floating-point rounding errors.

## Build for the Play Store / App Store

Use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas-cli@latest build --platform android
```
