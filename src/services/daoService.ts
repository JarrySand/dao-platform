import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface DAODetails {
  id?: string;
  name: string;
  description: string;
  location: string;
  size: 'small' | 'medium' | 'large';
  memberCount: number;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  contactPerson?: string;
  trustScore: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  ownerId: string;
  adminAddress?: string;
  foundingDate?: string;
  attestationUID?: string;
  documents?: any[];
}

const COLLECTION_NAME = 'daos';

export const daoService = {
  // 全DAOを取得
  async getAllDAOs(): Promise<DAODetails[]> {
    console.log('🔥 Firebase: Fetching all DAOs...');
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const daos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DAODetails[];
      
      console.log(`🔥 Firebase: Found ${daos.length} DAOs`);
      
      // クライアントサイドでフィルタリング（インデックス不要）
      const activeDaos = daos.filter(dao => dao.status === 'active');
      
      // クライアントサイドでソート
      activeDaos.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return activeDaos;
    } catch (error) {
      console.error('🔥 Firebase: Error fetching DAOs:', error);
      throw error;
    }
  },

  // 特定のDAOを取得
  async getDAO(id: string): Promise<DAODetails | null> {
    console.log(`🔥 Firebase: Fetching DAO with ID: ${id}`);
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as DAODetails;
        console.log('🔥 Firebase: DAO found:', data);
        return data;
      } else {
        console.log('🔥 Firebase: DAO not found');
        return null;
      }
    } catch (error) {
      console.error('🔥 Firebase: Error fetching DAO:', error);
      throw error;
    }
  },

  // DAOを作成
  async createDAO(daoData: Omit<DAODetails, 'id'>): Promise<string> {
    console.log('🔥 Firebase: Creating DAO...', daoData);
    try {
      const docData = {
        ...daoData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        documents: daoData.documents || []
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      console.log('🔥 Firebase: DAO created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('🔥 Firebase: Error creating DAO:', error);
      throw error;
    }
  },

  // DAOを更新
  async updateDAO(id: string, updates: Partial<DAODetails>): Promise<void> {
    console.log(`🔥 Firebase: Updating DAO ${id}...`, updates);
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      await updateDoc(docRef, updateData);
      console.log('🔥 Firebase: DAO updated successfully');
    } catch (error) {
      console.error('🔥 Firebase: Error updating DAO:', error);
      throw error;
    }
  },

  // DAOを削除
  async deleteDAO(id: string): Promise<void> {
    console.log(`🔥 Firebase: Deleting DAO ${id}...`);
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('🔥 Firebase: DAO deleted successfully');
    } catch (error) {
      console.error('🔥 Firebase: Error deleting DAO:', error);
      throw error;
    }
  }
}; 