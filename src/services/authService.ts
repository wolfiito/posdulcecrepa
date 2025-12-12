// src/services/authService.ts
import { db, collection, query, where, getDocs } from '../firebase';
import type { User } from '../types/user';

export const authService = {
  async loginWithPin(pin: string): Promise<User> {
    // Buscamos el usuario que tenga ese PIN
    const q = query(collection(db, 'users'), where('pin', '==', pin));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('PIN incorrecto o usuario no encontrado');
    }

    // Tomamos el primer resultado
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Retornamos el objeto User completo y tipado
    return { 
        id: userDoc.id, 
        name: userData.name,
        role: userData.role,
        pin: userData.pin 
    } as User;
  }
};