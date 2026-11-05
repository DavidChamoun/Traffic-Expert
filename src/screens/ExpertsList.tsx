// src/screens/ExpertsList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView, useColorScheme } from 'react-native';
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

interface ExpertCardProps {
  item: Expert;
  styles: ReturnType<typeof getStyles>;
  onCall: (phone: string) => void;
}

const ExpertCard = React.memo(({ item, styles, onCall }: ExpertCardProps) => (
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
        onPress={() => onCall(item.phoneNumber)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="phone" size={16} color="#fff" />
        <Text style={styles.callBtnText}> Call</Text>
      </TouchableOpacity>
    </View>
  </View>
));

const ExpertsList: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  useDoubleBackExit();

  useEffect(() => {
    let isMounted = true;

    const loadExperts = async () => {
      try {
        setLoading(true);

        const verifiedSnap = await firestore()
          .collection('verifiedExperts')
          .where('isRegistered', '==', true)
          .get();

        // Concurrently fetch matching expert accounts
        const resolved = await Promise.all(
          verifiedSnap.docs.map(async (verifiedDoc) => {
            try {
              const verifiedData = verifiedDoc.data();
              // Syndicate authorization enforcement: omit suspended or revoked experts
              if (verifiedData.authorizationStatus === 'suspended' || verifiedData.authorizationStatus === 'revoked') {
                return null;
              }

              const expertSnap = await firestore()
                .collection('experts')
                .where('verifiedRef', '==', verifiedDoc.ref)
                .limit(1)
                .get();

              if (expertSnap.empty) return null;

              const expertData = expertSnap.docs[0].data();

              return {
                id: expertSnap.docs[0].id,
                fullName: verifiedData.fullName,
                licenseId: verifiedDoc.id,
                phoneNumber: verifiedData.phoneNumber,
                isAvailable: expertData.isAvailable ?? false,
              } as Expert;
            } catch {
              return null;
            }
          })
        );

        if (isMounted) {
          const results = resolved.filter((item): item is Expert => item !== null);
          setExperts(results);
        }
      } catch (e) {
        if (isMounted) {
          setError('Failed to load experts');
        }
        console.error('Failed to load experts', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredExperts = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return experts;

    return experts.filter(expert =>
      expert.fullName.toLowerCase().includes(q) ||
      expert.licenseId.toLowerCase().includes(q) ||
      expert.phoneNumber.toLowerCase().includes(q)
    );
  }, [experts, search]);

  const handleCall = React.useCallback((phoneNumber: string) => {
    makePhoneCall(phoneNumber);
  }, []);

  const renderInspector = React.useCallback(
    ({ item }: { item: Expert }) => (
      <ExpertCard item={item} styles={styles} onCall={handleCall} />
    ),
    [styles, handleCall]
  );

  if (loading) {
    return (
      <View style={[styles.safe, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={isDark ? '#002fbdff' : '#102C7E'} />
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
            style={styles.searchInput}
          />
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
      ) : (
        <FlatList
          data={filteredExperts}
          keyExtractor={(item) => item.licenseId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderInspector}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
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

const getStyles = (isDark: boolean) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: isDark ? '#0A0A0F' : '#fff'
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#0A0A0F' : '#fff'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: isDark ? '#FC8181' : '#E53E3E',
    fontFamily: 'Outfit-Medium',
    marginTop: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#2D2D3A' : 'transparent',
    elevation: isDark ? 0 : 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: isDark ? '#1A1A24' : '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    height: 48,
  },
  searchInput: {
    marginLeft: 12,
    flex: 1,
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDark ? 'rgba(72,187,120,0.08)' : '#F0FFF4',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(72,187,120,0.15)' : 'rgba(72,187,120,0.1)',
  },
  verifiedIcon: {
    backgroundColor: isDark ? '#68D391' : '#48BB78',
    padding: 6,
    borderRadius: 12,
    marginRight: 8
  },
  verifiedText: {
    flex: 1,
    color: isDark ? '#E2E8F0' : '#2D3748',
    fontWeight: '500',
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
  },
  noDataFound: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataFoundText: {
    fontSize: 18,
    color: isDark ? '#E2E8F0' : '#2D3748',
    fontFamily: 'Outfit-Medium',
    marginTop: 16,
  },
  noDataFoundSubText: {
    fontSize: 14,
    color: isDark ? '#94A3B8' : '#718096',
    fontFamily: 'Outfit-Regular',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    overflow: 'hidden',
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 2,
  },
  cardTop: {
    padding: 16
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(102,126,234,0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontFamily: 'Outfit-Medium'
  },
  role: {
    fontSize: 14,
    color: isDark ? '#002fbdff' : '#667EEA',
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Outfit-Medium'
  },
  license: {
    fontSize: 13,
    color: isDark ? '#94A3B8' : '#718096',
    marginTop: 8,
    fontFamily: 'Outfit-Regular'
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDark ? '#0A0A0F' : '#F7FAFC',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#2D2D3A' : 'transparent',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
  },
  callBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  callEnabled: {
    backgroundColor: isDark ? '#68D391' : '#48BB78'
  },
  callDisabled: {
    backgroundColor: isDark ? '#4A5568' : '#d6d6d6ff'
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
  },
});