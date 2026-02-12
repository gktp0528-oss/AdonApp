import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const USERS_COLLECTION = 'users';

// Copies old reliabilityLabel text into bio when bio is missing.
export async function migrateUserBioField() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  const batch = writeBatch(db);
  let migrated = 0;

  snap.forEach((userDoc) => {
    const data = userDoc.data() as any;
    const hasBio = typeof data.bio === 'string' && data.bio.trim().length > 0;
    const legacyBio = typeof data.reliabilityLabel === 'string' ? data.reliabilityLabel.trim() : '';

    if (!hasBio && legacyBio) {
      batch.set(doc(db, USERS_COLLECTION, userDoc.id), { bio: legacyBio }, { merge: true });
      migrated += 1;
    }
  });

  if (migrated === 0) {
    console.log('No users required bio migration.');
    return;
  }

  await batch.commit();
  console.log(`Migrated bio for ${migrated} user(s).`);
}
