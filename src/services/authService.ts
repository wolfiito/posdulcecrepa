import { db, collection, query, where, getDocs } from '../firebase';
import type { User } from '../types/user';

export const authService = {
  async loginWithCredentials(username: string, pass: string): Promise<User> {
    // 1. Se busca por nombre de usuario. 
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Se verifica la contraseña
    const matchedDoc = snapshot.docs.find(doc => doc.data().password === pass);

    if (!matchedDoc){
      throw new Error('Contraseña incorrecta');
    }

    const userData = matchedDoc.data();

    return { 
        id: matchedDoc.id, 
        name: userData.name,
        role: userData.role,
        username: userData.username,
        password: userData.password,
        branchId: userData.branchId
    } as User;
  },

  async checkUserExists(username: string): Promise<{ name: string; username: string; role: string } | null> {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return { name: data.name, username: data.username, role: data.role };
  }
};