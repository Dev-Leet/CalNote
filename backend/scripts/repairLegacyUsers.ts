/**
 * One-time repair script for pre-existing User documents with invalid data
 * that predates this schema's current constraints (seen recurring in
 * testing as userId 6990df47d584dbd1bba97bd0: role "farmer", missing
 * authProvider, missing preferences.timezone). Run manually:
 *
 *   npx tsx scripts/repairLegacyUsers.ts
 *
 * Safe to run multiple times — only touches documents that are actually
 * missing/invalid on these specific fields, using $set with no
 * runValidators (same rationale as user.controller.ts's fix: we're
 * intentionally repairing already-broken documents, so document-level
 * validation would just get in its own way here too).
 */
/* 
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserModel } from '../src/models/User.model';

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string);

  const invalidRoleResult = await UserModel.updateMany(
    { role: { $nin: ['user', 'admin'] } },
    { $set: { role: 'user' } },
  );

  const missingAuthProviderResult = await UserModel.updateMany(
    { authProvider: { $exists: false } },
    { $set: { authProvider: 'local' } },
  );

  const missingTimezoneResult = await UserModel.updateMany(
    { 'preferences.timezone': { $exists: false } },
    { $set: { 'preferences.timezone': 'Asia/Kolkata' } },
  );

  const missingSleepWindowResult = await UserModel.updateMany(
    { 'preferences.sleepWindow': { $exists: false } },
    { $set: { 'preferences.sleepWindow': { start: '23:00', end: '06:00' } } },
  );

  const missingDefaultProviderResult = await UserModel.updateMany(
    { 'preferences.defaultAiProvider': { $exists: false } },
    { $set: { 'preferences.defaultAiProvider': 'ashna' } },
  );

  console.log('Legacy user repair complete:');
  console.log(`  Fixed invalid role:            ${invalidRoleResult.modifiedCount}`);
  console.log(`  Fixed missing authProvider:     ${missingAuthProviderResult.modifiedCount}`);
  console.log(`  Fixed missing timezone:         ${missingTimezoneResult.modifiedCount}`);
  console.log(`  Fixed missing sleepWindow:      ${missingSleepWindowResult.modifiedCount}`);
  console.log(`  Fixed missing defaultAiProvider:${missingDefaultProviderResult.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Repair script failed:', err);
  process.exit(1);
}); */