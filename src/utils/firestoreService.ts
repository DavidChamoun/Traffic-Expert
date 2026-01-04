import firestore from '@react-native-firebase/firestore';

export const updateExpertLocation = async (
    expertId: string,
    latitude: number,
    longitude: number
) => {
    await firestore()
        .collection('experts')
        .doc(expertId)
        .update({
            location: new firestore.GeoPoint(latitude, longitude),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
        });
};
