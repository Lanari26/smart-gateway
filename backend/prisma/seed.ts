import {
  PrismaClient,
  Role,
  TransactionStatus,
  PlanCycle,
  SubscriptionStatus,
  ApiKeyType,
  InvoiceStatus,
  ProjectStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Demo merchant — change the password before any real deployment.
  const passwordHash = await bcrypt.hash('SmartPay#2026', 12);
  await prisma.merchant.upsert({
    where: { email: 'merchant@smartpay.rw' },
    update: {},
    create: {
      email: 'merchant@smartpay.rw',
      name: 'Demo Merchant',
      businessName: 'SmartPay Demo Co',
      phone: '+250788000000',
      role: Role.ADMIN,
      passwordHash,
    },
  });

  // Primary admin — created (and password re-enforced) on every boot.
  const adminHash = await bcrypt.hash('lanari@123!', 12);
  await prisma.merchant.upsert({
    where: { email: 'lanari.rw@gmail.com' },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: 'lanari.rw@gmail.com',
      name: 'Lanari Admin',
      businessName: 'Lanari Tech',
      role: Role.ADMIN,
      passwordHash: adminHash,
    },
  });

  // Transactions (unique on reference).
  const transactions = [
    { reference: 'tx_8f9e1a', customerName: 'Sarah Connor', customerEmail: 'sarah.c@cyberdyne.org', amount: 149.0, method: 'Visa •••• 4242', status: TransactionStatus.PAID },
    { reference: 'tx_3c4d5e', customerName: 'Bruce Wayne', customerEmail: 'bruce@waynecorp.com', amount: 2499.0, method: 'Mastercard •••• 9111', status: TransactionStatus.PAID },
    { reference: 'tx_2b3a5c', customerName: 'Peter Parker', customerEmail: 'spidey@dailybugle.net', amount: 15.0, method: 'Amex •••• 1007', status: TransactionStatus.FAILED },
    { reference: 'tx_9d0e1f', customerName: 'Tony Stark', customerEmail: 'tony@starkindustries.com', amount: 12500.0, method: 'Apple Pay', status: TransactionStatus.PAID },
    { reference: 'tx_4r5t6y', customerName: 'Clark Kent', customerEmail: 'clark@dailyplanet.com', amount: 49.0, method: 'Google Pay', status: TransactionStatus.PENDING },
    { reference: 'tx_7u8i9o', customerName: 'Selina Kyle', customerEmail: 'selina@gothamcats.org', amount: 180.0, method: 'Visa •••• 1312', status: TransactionStatus.PAID },
  ];
  for (const t of transactions) {
    await prisma.transaction.upsert({ where: { reference: t.reference }, update: {}, create: t });
  }

  // Plans (no natural unique key — seed once when empty).
  if ((await prisma.plan.count()) === 0) {
    await prisma.plan.createMany({
      data: [
        { name: 'Developer Starter', price: 19, cycle: PlanCycle.MONTHLY, subscribers: 142, description: 'Ideal for sandbox prototypes, early stage startups, and small hobby integrations.', isPopular: false },
        { name: 'Growth Scale Pro', price: 89, cycle: PlanCycle.MONTHLY, subscribers: 589, description: 'Our flagship subscription including priority visual dashboard, multi-currency processing, and instant webhooks.', isPopular: true, isScalable: true },
        { name: 'Enterprise Dedicated Integration', price: 399, cycle: PlanCycle.MONTHLY, subscribers: 48, description: 'Bespoke isolated processing clusters, dedicated account managers, zero interchange markup, and direct bank settlement.', isScalable: true },
      ],
    });
  }

  // Subscriptions (seed once when empty).
  if ((await prisma.subscription.count()) === 0) {
    await prisma.subscription.createMany({
      data: [
        { name: 'Alex Rivera', email: 'alex@riveratech.io', planName: 'Growth Scale Pro', status: SubscriptionStatus.ACTIVE, nextBilling: 'Jul 08, 2026', amount: 89 },
        { name: 'Clara Oswald', email: 'clara@spaceandtime.org', planName: 'Developer Starter', status: SubscriptionStatus.ACTIVE, nextBilling: 'Jul 01, 2026', amount: 19 },
        { name: 'Miles Morales', email: 'miles@brooklynsound.com', planName: 'Growth Scale Pro', status: SubscriptionStatus.ACTIVE, nextBilling: 'Jul 09, 2026', amount: 89 },
        { name: 'Diana Prince', email: 'diana@themyscira.gov', planName: 'Enterprise Dedicated Integration', status: SubscriptionStatus.ACTIVE, nextBilling: 'Jul 15, 2026', amount: 399 },
        { name: 'Wade Wilson', email: 'wade@deadpoolrentals.com', planName: 'Developer Starter', status: SubscriptionStatus.CANCELLED, nextBilling: null, amount: 0 },
      ],
    });
  }

  // API keys (unique on token).
  const keys = [
    { label: 'Production Public SDK API Key', type: ApiKeyType.PUBLIC, token: 'pk_live_demo_publishable_key_replace_me' },
    { label: 'Production Secret Backend Key', type: ApiKeyType.SECRET, token: 'sk_live_demo_secret_key_replace_me' },
    { label: 'Development Sandbox Public Token', type: ApiKeyType.PUBLIC, token: 'pk_test_demo_sandbox_key_replace_me' },
  ];
  for (const k of keys) {
    await prisma.apiKey.upsert({ where: { token: k.token }, update: {}, create: k });
  }

  // Whitelisted IPs (seed once when empty).
  if ((await prisma.whitelistedIp.count()) === 0) {
    await prisma.whitelistedIp.createMany({
      data: [
        { ip: '192.168.1.105', label: 'Staging Cluster Server Node (Oregon)' },
        { ip: '44.204.12.89', label: 'AWS Backend Application Cluster' },
        { ip: '8.8.8.8', label: 'External Developer DNS Test' },
      ],
    });
  }

  // Invoices (unique on number).
  const invoices = [
    { number: 'INV-2026-004', clientName: 'Cyberdyne Systems', clientEmail: 'accounts@cyberdyne.org', amount: 1250.0, issueDate: 'Jun 08, 2026', status: InvoiceStatus.PENDING },
    { number: 'INV-2026-003', clientName: 'Wayne Enterprises', clientEmail: 'billing@waynecorp.com', amount: 9800.0, issueDate: 'Jun 02, 2026', status: InvoiceStatus.PAID },
    { number: 'INV-2026-002', clientName: 'Daily Planet Co', clientEmail: 'finance@dailyplanet.com', amount: 450.0, issueDate: 'May 28, 2026', status: InvoiceStatus.OVERDUE },
    { number: 'INV-2026-001', clientName: 'Oscorp Biotech', clientEmail: 'payments@oscorp.io', amount: 3200.0, issueDate: 'May 15, 2026', status: InvoiceStatus.PAID },
  ];
  for (const inv of invoices) {
    await prisma.invoice.upsert({ where: { number: inv.number }, update: {}, create: inv });
  }

  // Projects (seed once when empty).
  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({
      data: [
        { name: 'Cyberdyne Systems Shop Storefront', webhookUrl: 'https://api.cyberdyne.org/smartpay-endpoint', keysCreated: 3, totalCalls: 14820, status: ProjectStatus.ACTIVE },
        { name: 'Stark Suite Recurring Cloud', webhookUrl: 'https://webhooks.starksuite.com/v1/router', keysCreated: 2, totalCalls: 349100, status: ProjectStatus.ACTIVE },
        { name: 'Wayne Cave Diagnostics Suite', webhookUrl: 'http://gotham.internal:8080/pay-callback', keysCreated: 1, totalCalls: 450, status: ProjectStatus.CONFIGURING },
      ],
    });
  }

  // Settings singleton.
  await prisma.gatewaySettings.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton' } });

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
