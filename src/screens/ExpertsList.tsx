// src/screens/ExpertsList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { ActivityIndicator } from 'react-native';
import { makePhoneCall } from '../utils/phone';
import useDoubleBackExit from '../utils/doubleBackService';

interface Expert {
  id: string;
  fullName: string;
  licenseId: string;
  phoneNumber: string;
  isAvailable: boolean;
}

const ExpertsList: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');


  useDoubleBackExit();

  
  useEffect(() => {
    const loadExperts = async () => {
      try {
        // setError('');
        setLoading(true);

        const verifiedSnap = await firestore()
          .collection('verifiedExperts')
          .where('isRegistered', '==', true)
          .get();

        const results: Expert[] = [];

        for (const verifiedDoc of verifiedSnap.docs) {
          const verifiedData = verifiedDoc.data();

          // Find matching expert account
          const expertSnap = await firestore()
            .collection('experts')
            .where('verifiedRef', '==', verifiedDoc.ref)
            .limit(1)
            .get();

          if (expertSnap.empty) continue;

          const expertData = expertSnap.docs[0].data();

          results.push({
            id: expertSnap.docs[0].id,
            fullName: verifiedData.fullName,
            licenseId: verifiedDoc.id,
            phoneNumber: verifiedData.phoneNumber,
            isAvailable: expertData.isAvailable ?? false,
          });
        }

        setExperts(results);
      } catch (e) {
        setError('Failed to load experts')
        console.error('Failed to load experts', e);
      } finally {
        setLoading(false);
      }
    };

    loadExperts();
  }, []);


  const filteredExperts = experts.filter(expert => {
    const q = search.toLowerCase().trim();

    return (
      expert.fullName.toLowerCase().includes(q) ||
      expert.licenseId.toLowerCase().includes(q) ||
      expert.phoneNumber.toLowerCase().includes(q)
    );
  });




  const renderInspector = ({ item }: { item: Expert }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.left}>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.role}>Traffic Accident Inspector</Text>
            <Text style={styles.license}>License: {item.licenseId}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: item.isAvailable ? 'rgba(72,187,120,0.1)' : 'rgba(229,62,62,0.08)' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isAvailable ? '#48BB78' : '#E53E3E' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: item.isAvailable ? '#48BB78' : '#E53E3E' },
            ]}
          >
            {item.isAvailable ? 'Available Now' : 'Currently Busy'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.callBtn, item.isAvailable ? styles.callEnabled : styles.callDisabled]}
          disabled={!item.isAvailable}
          onPress={() => makePhoneCall(item.phoneNumber)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="phone" size={16} color="#fff" />
          <Text style={styles.callBtnText}> Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  if (loading) {
    return (
      <View style={[styles.safe, styles.loadingScreen]}>
        <ActivityIndicator size="large" color="#102C7E" />
      </View>
    );
  }



  return (
    <View style={styles.safe}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#A0AEC0" />
          <TextInput
            placeholder="Search traffic experts..."
            placeholderTextColor="#A0AEC0"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.verifiedHeader}>
        <View style={styles.verifiedIcon}>
          <MaterialIcons name="verified-user" size={16} color="#fff" />
        </View>
        <Text style={styles.verifiedText}>All experts are certified by Traffic Experts Syndicate</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>

      )
        :
        (
          <FlatList
            data={filteredExperts}
            keyExtractor={(item) => item.licenseId}
            contentContainerStyle={{ padding: 16 }}
            renderItem={renderInspector}
            ListEmptyComponent={
              <View style={styles.noDataFound}>
                <Text style={styles.noDataFoundText}>
                  No experts found
                </Text>
              </View>
            }

          />
        )}

    </View>
  );
};

export default ExpertsList;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
    fontFamily: 'Outfit-Medium',
  },
  searchContainer: { padding: 16, backgroundColor: '#fff', elevation: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchInput: { marginLeft: 12, flex: 1, color: '#2D3748', fontFamily: 'Outfit-Regular' },

  verifiedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F0FFF4' },
  verifiedIcon: { backgroundColor: '#48BB78', padding: 6, borderRadius: 12, marginRight: 8 },
  verifiedText: { flex: 1, color: '#2D3748', fontWeight: '500', fontFamily: 'Outfit-Regular' },

  noDataFound: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },

  noDataFoundText: {
    fontSize: 16,
    color: '#718096',
    fontFamily: 'Outfit-Medium',
  },
  
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { padding: 16 },
  left: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(102,126,234,0.08)', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '600', color: '#2D3748', fontFamily: 'Outfit-Medium' },
  role: { fontSize: 14, color: '#667EEA', fontWeight: '500', marginTop: 4, fontFamily: 'Outfit-Medium', },
  license: { fontSize: 13, color: '#718096', marginTop: 8, fontFamily: 'Outfit-Regular', },

  cardBottom: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F7FAFC', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { marginLeft: 8, fontSize: 12, fontWeight: '500' },

  callBtn: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  callEnabled: { backgroundColor: '#48BB78' },
  callDisabled: { backgroundColor: '#d6d6d6ff' },
  callBtnText: { color: '#fff', fontWeight: '600', fontFamily: 'Outfit-Medium', },
});
