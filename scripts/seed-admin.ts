/**
 * Seed admin user.
 * Run with: bun run /home/z/my-project/scripts/seed-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const adminLoginId = 'sagathiyapradip2002@gmail.com';
  const adminEmail = 'sagathiyapradip2002@gmail.com';
  const adminPassword = 'Pradip@2026'; // admin can change later
  const adminPin = '180802';
  const adminFullName = 'Pradip Sagathiya';
  
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const pinHash = await bcrypt.hash(adminPin, 12);
  
  const existing = await db.user.findFirst({ where: { OR: [{ loginId: adminLoginId }, { email: adminEmail }] } });
  if (existing) {
    // Update password + PIN
    await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash, pinHash,
        role: 'admin',
        status: 'active',
        fullName: adminFullName,
      },
    });
    console.log(`Admin user updated: ${existing.loginId} (${existing.id})`);
  } else {
    const u = await db.user.create({
      data: {
        loginId: adminLoginId.toLowerCase(),
        email: adminEmail.toLowerCase(),
        fullName: adminFullName,
        passwordHash, pinHash,
        role: 'admin',
        status: 'active',
      },
    });
    console.log(`Admin user created: ${u.loginId} (${u.id})`);
  }
  
  // Also create a test user
  const userLoginId = 'pradip';
  const userEmail = 'pradip@example.com';
  const userPassword = 'user123';
  const userPin = '100727';
  
  const userPwdHash = await bcrypt.hash(userPassword, 10);
  const userPinHash = await bcrypt.hash(userPin, 12);
  
  const existingUser = await db.user.findFirst({ where: { OR: [{ loginId: userLoginId }, { email: userEmail }] } });
  if (existingUser) {
    await db.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: userPwdHash, pinHash: userPinHash, role: 'user', status: 'active', fullName: 'Pradip (User)' },
    });
    console.log(`Test user updated: ${userLoginId}`);
  } else {
    await db.user.create({
      data: {
        loginId: userLoginId, email: userEmail, fullName: 'Pradip (User)',
        passwordHash: userPwdHash, pinHash: userPinHash, role: 'user', status: 'active',
      },
    });
    console.log(`Test user created: ${userLoginId}`);
  }
  
  console.log('\n=== CREDENTIALS ===');
  console.log(`Admin: ${adminLoginId} / password: ${adminPassword} / PIN: ${adminPin}`);
  console.log(`User:  ${userLoginId} / password: ${userPassword} / PIN: ${userPin}`);
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect(); process.exit(1); });
