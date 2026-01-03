import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getCurrentLocation } from '../utils/location';
import Geolocation from '@react-native-community/geolocation';


const FirestoreTest = () => {
  const [loading, setLoading] = useState(false);
  const [geoPoint, setGeoPoint] = useState('');


  interface VerifiedExpert {
    id: string;
    fullName: string;
    phoneNumber: string;
    isRegistered: boolean;
  }

  const [experts, setExperts] = useState<VerifiedExpert[]>([]);

  const fetchData = async () => {
    try {
      const snapshot = await firestore()
        .collection('verifiedExperts')
        .get();

      const results: VerifiedExpert[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<VerifiedExpert, 'id'>),
      }));

      setExperts(results);
    } catch (error) {
      console.error('Error fetching verifiedExperts:', error);
    }
  };

  // const testLocation = async () => {
  //   console.log('Testing location...');
  //   const loc = await getCurrentLocation();
  //   if (loc) {
  //     Alert.alert('Success', `Got location: ${loc.latitude}, ${loc.longitude}`);
  //   } else {
  //     Alert.alert('Failed', 'Could not get location');
  //   }
  // };

  const handleGetLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const geoPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        console.log('GeoPoint:', geoPoint);
        Alert.alert('Success');
        // Here you can save it to your database or state

      },
      (error) => {
        Alert.alert('Success');

        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };




  const testFirestore = async () => {
    setLoading(true);
    try {
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={testFirestore}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Firestore Test</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGetLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Location</Text>
        )}
      </TouchableOpacity>

      <View style={styles.logBox}>
        {experts.length === 0 ? (
          <Text style={styles.logText}>No data fetched</Text>
        ) : (
          experts.map(expert => (
            <View key={expert.id} style={{ marginBottom: 12 }}>
              <Text style={styles.logText}>ID: {expert.id}</Text>
              <Text style={styles.logText}>Name: {expert.fullName}</Text>
              <Text style={styles.logText}>
                Registered: {expert.isRegistered ? 'Yes' : 'No'}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.logBox}>
        <Text style={styles.logText}>GeoPoint: {geoPoint}</Text>
      </View>
    </ScrollView>
  );
};

export default FirestoreTest;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 50,
  },
  button: {
    backgroundColor: '#102C7E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logBox: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
  },
  logText: {
    fontSize: 14,
    color: '#2D3748',
  },
});
