// src/session/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'expert_session';

export const saveExpertSession = async (expertId: string) => {
    await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ expertId })
    );
};

export const getExpertSession = async () => {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
};

export const clearExpertSession = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
};
