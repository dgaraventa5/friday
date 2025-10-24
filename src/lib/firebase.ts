import { getFirestore } from 'firebase/firestore';
import { app, auth } from '../utils/firebase';

const db = getFirestore(app);

export { app, auth, db };
